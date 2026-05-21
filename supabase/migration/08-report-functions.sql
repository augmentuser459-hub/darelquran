-- ============================================================================
-- MIGRATION 08: Report Functions
-- ============================================================================

-- 1. get_dashboard_stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_active_students BIGINT, total_active_teachers BIGINT,
    sessions_today BIGINT, sessions_this_week BIGINT, sessions_this_month BIGINT,
    pending_invoices BIGINT, overdue_invoices BIGINT,
    students_with_warnings BIGINT, makeup_sessions_needed BIGINT,
    total_revenue_this_month DECIMAL, total_collected_this_month DECIMAL,
    collection_rate_this_month DECIMAL,
    new_students_this_month BIGINT, graduated_students_this_month BIGINT
) AS $$
BEGIN
    RETURN QUERY SELECT 
        (SELECT COUNT(*) FROM students WHERE status = 'active'),
        (SELECT COUNT(*) FROM teachers WHERE status = 'active'),
        (SELECT COUNT(*) FROM sessions WHERE session_date = CURRENT_DATE AND status = 'scheduled'),
        (SELECT COUNT(*) FROM sessions WHERE session_date >= DATE_TRUNC('week', CURRENT_DATE) AND session_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days' AND status = 'scheduled'),
        (SELECT COUNT(*) FROM sessions WHERE session_date >= DATE_TRUNC('month', CURRENT_DATE) AND status IN ('scheduled', 'completed')),
        (SELECT COUNT(*) FROM invoices WHERE status = 'pending'),
        (SELECT COUNT(*) FROM invoices WHERE status = 'overdue'),
        (SELECT COUNT(*) FROM students WHERE warnings_count > 0 AND status = 'active'),
        (SELECT COUNT(*) FROM sessions_need_makeup),
        (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)),
        (SELECT COALESCE(SUM(amount_paid), 0) FROM invoices WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)),
        (SELECT ROUND(COALESCE(SUM(amount_paid), 0) / NULLIF(SUM(total_amount), 0) * 100, 2) FROM invoices WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)),
        (SELECT COUNT(*) FROM students WHERE enrollment_date >= DATE_TRUNC('month', CURRENT_DATE)),
        (SELECT COUNT(*) FROM students WHERE graduation_date >= DATE_TRUNC('month', CURRENT_DATE));
END;
$$ LANGUAGE plpgsql;

-- 2. get_student_report
CREATE OR REPLACE FUNCTION get_student_report(student_uuid UUID)
RETURNS TABLE (
    student_id UUID, student_name VARCHAR, phone VARCHAR, parent_phone VARCHAR,
    email VARCHAR, country VARCHAR, pricing_plan VARCHAR, monthly_price DECIMAL,
    excuse_balance INTEGER, max_excuses INTEGER, warnings_count INTEGER,
    status VARCHAR, enrollment_date DATE, total_sessions BIGINT,
    completed_sessions BIGINT, excused_sessions BIGINT, absent_sessions BIGINT,
    attendance_rate DECIMAL, total_invoiced DECIMAL, total_paid DECIMAL,
    balance_due DECIMAL, overdue_invoices BIGINT, last_payment_date DATE,
    next_session_date DATE, next_session_time TIME,
    current_level VARCHAR, total_pages_memorized INTEGER
) AS $$
BEGIN
    RETURN QUERY SELECT 
        s.id, s.name, s.phone, s.parent_phone, s.email, c.name,
        pp.sessions_per_week || ' حصص/أسبوع',
        COALESCE(s.custom_monthly_price, pp.monthly_price),
        s.excuse_balance, s.max_excuses_per_month, s.warnings_count, s.status,
        s.enrollment_date, COUNT(ses.id),
        COUNT(*) FILTER (WHERE ses.status = 'completed'),
        COUNT(*) FILTER (WHERE ses.status = 'student_excused'),
        COUNT(*) FILTER (WHERE ses.status = 'student_absent'),
        s.attendance_rate, COALESCE(SUM(i.total_amount), 0),
        COALESCE(SUM(i.amount_paid), 0), COALESCE(SUM(i.amount_due), 0),
        COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'overdue'),
        MAX(p.payment_date),
        MIN(ses.session_date) FILTER (WHERE ses.session_date >= CURRENT_DATE AND ses.status = 'scheduled'),
        MIN(ses.session_time) FILTER (WHERE ses.session_date >= CURRENT_DATE AND ses.status = 'scheduled'),
        s.current_level, s.total_pages_memorized
    FROM students s
    LEFT JOIN countries c ON s.country_id = c.id
    LEFT JOIN pricing_plans pp ON s.pricing_plan_id = pp.id
    LEFT JOIN sessions ses ON s.id = ses.student_id
    LEFT JOIN invoices i ON s.id = i.student_id
    LEFT JOIN payments p ON i.id = p.invoice_id
    WHERE s.id = student_uuid
    GROUP BY s.id, s.name, s.phone, s.parent_phone, s.email, c.name, 
             pp.sessions_per_week, pp.monthly_price, s.custom_monthly_price,
             s.excuse_balance, s.max_excuses_per_month, s.warnings_count, 
             s.status, s.enrollment_date, s.attendance_rate, s.current_level, 
             s.total_pages_memorized;
END;
$$ LANGUAGE plpgsql;

-- 3. get_teacher_report
CREATE OR REPLACE FUNCTION get_teacher_report(teacher_uuid UUID)
RETURNS TABLE (
    teacher_id UUID, teacher_name VARCHAR, phone VARCHAR, email VARCHAR,
    status VARCHAR, hire_date DATE, total_students BIGINT, active_students BIGINT,
    total_sessions BIGINT, completed_sessions BIGINT, cancelled_sessions BIGINT,
    completion_rate DECIMAL, average_rating DECIMAL,
    sessions_this_month BIGINT, sessions_this_week BIGINT,
    next_session_date DATE, next_session_time TIME
) AS $$
BEGIN
    RETURN QUERY SELECT 
        t.id, t.name, t.phone, t.email, t.status, t.hire_date,
        COUNT(DISTINCT ss.student_id),
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN ss.student_id END),
        COUNT(ses.id),
        COUNT(*) FILTER (WHERE ses.status = 'completed'),
        COUNT(*) FILTER (WHERE ses.status = 'teacher_cancelled'),
        ROUND(COUNT(*) FILTER (WHERE ses.status = 'completed')::DECIMAL / NULLIF(COUNT(ses.id), 0) * 100, 2),
        ROUND(AVG(ses.rating) FILTER (WHERE ses.rating IS NOT NULL), 2),
        COUNT(*) FILTER (WHERE ses.session_date >= DATE_TRUNC('month', CURRENT_DATE)),
        COUNT(*) FILTER (WHERE ses.session_date >= DATE_TRUNC('week', CURRENT_DATE)),
        MIN(ses.session_date) FILTER (WHERE ses.session_date >= CURRENT_DATE AND ses.status = 'scheduled'),
        MIN(ses.session_time) FILTER (WHERE ses.session_date >= CURRENT_DATE AND ses.status = 'scheduled')
    FROM teachers t
    LEFT JOIN scheduled_sessions ss ON t.id = ss.teacher_id
    LEFT JOIN students s ON ss.student_id = s.id
    LEFT JOIN sessions ses ON t.id = ses.teacher_id
    WHERE t.id = teacher_uuid
    GROUP BY t.id, t.name, t.phone, t.email, t.status, t.hire_date;
END;
$$ LANGUAGE plpgsql;

-- 4. get_attendance_statistics
CREATE OR REPLACE FUNCTION get_attendance_statistics(
    start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_scheduled BIGINT, total_completed BIGINT, total_excused BIGINT,
    total_absent BIGINT, total_cancelled_by_teacher BIGINT,
    completion_rate DECIMAL, excuse_rate DECIMAL,
    absence_rate DECIMAL, cancellation_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'student_excused'),
        COUNT(*) FILTER (WHERE status = 'student_absent'),
        COUNT(*) FILTER (WHERE status = 'teacher_cancelled'),
        ROUND(COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2),
        ROUND(COUNT(*) FILTER (WHERE status = 'student_excused')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2),
        ROUND(COUNT(*) FILTER (WHERE status = 'student_absent')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2),
        ROUND(COUNT(*) FILTER (WHERE status = 'teacher_cancelled')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2)
    FROM sessions WHERE session_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- 5. get_students_by_country_report
CREATE OR REPLACE FUNCTION get_students_by_country_report()
RETURNS TABLE (
    country_name VARCHAR, currency_code VARCHAR, total_students BIGINT,
    active_students BIGINT, total_revenue DECIMAL, total_collected DECIMAL,
    total_outstanding DECIMAL, collection_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY SELECT 
        c.name, c.currency_code, COUNT(DISTINCT s.id),
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active'),
        COALESCE(SUM(i.total_amount), 0), COALESCE(SUM(i.amount_paid), 0),
        COALESCE(SUM(i.amount_due), 0),
        ROUND(COALESCE(SUM(i.amount_paid), 0) / NULLIF(SUM(i.total_amount), 0) * 100, 2)
    FROM countries c
    LEFT JOIN students s ON c.id = s.country_id
    LEFT JOIN invoices i ON s.id = i.student_id
    GROUP BY c.id, c.name, c.currency_code
    ORDER BY total_students DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. get_top_students_report
CREATE OR REPLACE FUNCTION get_top_students_report(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    student_id UUID, student_name VARCHAR, attendance_rate DECIMAL,
    completed_sessions BIGINT, excuse_balance INTEGER, warnings_count INTEGER,
    total_pages_memorized INTEGER, overall_performance DECIMAL
) AS $$
BEGIN
    RETURN QUERY SELECT 
        s.id, s.name, s.attendance_rate,
        COUNT(*) FILTER (WHERE ses.status = 'completed'),
        s.excuse_balance, s.warnings_count, s.total_pages_memorized, s.overall_performance
    FROM students s
    LEFT JOIN sessions ses ON s.id = ses.student_id
    WHERE s.status = 'active'
    GROUP BY s.id, s.name, s.attendance_rate, s.excuse_balance, 
             s.warnings_count, s.total_pages_memorized, s.overall_performance
    ORDER BY s.attendance_rate DESC, completed_sessions DESC, s.warnings_count ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 7. get_daily_summary_report
CREATE OR REPLACE FUNCTION get_daily_summary_report(input_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    report_date DATE, total_sessions BIGINT, completed_sessions BIGINT,
    cancelled_sessions BIGINT, pending_sessions BIGINT,
    active_students BIGINT, active_teachers BIGINT,
    payments_today BIGINT, payments_amount DECIMAL,
    overdue_invoices BIGINT, students_with_warnings BIGINT
) AS $$
BEGIN
    RETURN QUERY SELECT 
        input_date,
        (SELECT COUNT(*) FROM sessions WHERE session_date = input_date),
        (SELECT COUNT(*) FROM sessions WHERE session_date = input_date AND status = 'completed'),
        (SELECT COUNT(*) FROM sessions WHERE session_date = input_date AND status IN ('student_excused', 'teacher_cancelled', 'cancelled')),
        (SELECT COUNT(*) FROM sessions WHERE session_date = input_date AND status = 'scheduled'),
        (SELECT COUNT(*) FROM students WHERE status = 'active'),
        (SELECT COUNT(*) FROM teachers WHERE status = 'active'),
        (SELECT COUNT(*) FROM payments WHERE payment_date = input_date),
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date = input_date),
        (SELECT COUNT(*) FROM invoices WHERE status = 'overdue'),
        (SELECT COUNT(*) FROM students WHERE warnings_count > 0 AND status = 'active');
END;
$$ LANGUAGE plpgsql;

-- 8. get_teacher_schedule
CREATE OR REPLACE FUNCTION get_teacher_schedule(
    teacher_uuid UUID,
    week_start_date DATE DEFAULT DATE_TRUNC('week', CURRENT_DATE)::DATE
)
RETURNS TABLE (
    day_of_week INTEGER, day_name VARCHAR, session_time TIME,
    student_name VARCHAR, student_phone VARCHAR,
    session_duration INTEGER, is_online BOOLEAN, meeting_link TEXT
) AS $$
BEGIN
    RETURN QUERY SELECT 
        ss.day_of_week, TO_CHAR(week_start_date + ss.day_of_week, 'Day'),
        ss.session_time, s.name, s.phone, ss.session_duration, ss.is_online, ss.meeting_link
    FROM scheduled_sessions ss
    JOIN students s ON ss.student_id = s.id
    WHERE ss.teacher_id = teacher_uuid AND ss.is_active = true
    AND (ss.end_date IS NULL OR ss.end_date >= week_start_date)
    ORDER BY ss.day_of_week, ss.session_time;
END;
$$ LANGUAGE plpgsql;

-- 9. get_student_progress_report
CREATE OR REPLACE FUNCTION get_student_progress_report(student_uuid UUID)
RETURNS TABLE (
    progress_date DATE, surah_name VARCHAR, from_ayah INTEGER, to_ayah INTEGER,
    mastery_level VARCHAR, accuracy_percentage DECIMAL,
    teacher_name VARCHAR, teacher_notes TEXT, mistakes_count INTEGER
) AS $$
BEGIN
    RETURN QUERY SELECT 
        sp.progress_date, sp.surah_name, sp.from_ayah, sp.to_ayah,
        sp.mastery_level, sp.accuracy_percentage, t.name, sp.teacher_notes, sp.mistakes_count
    FROM student_progress sp
    LEFT JOIN teachers t ON sp.teacher_id = t.id
    WHERE sp.student_id = student_uuid
    ORDER BY sp.progress_date DESC, sp.created_at DESC;
END;
$$ LANGUAGE plpgsql;
