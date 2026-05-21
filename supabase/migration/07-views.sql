-- ============================================================================
-- MIGRATION 07: Views
-- ============================================================================

-- 1. students_overview
CREATE OR REPLACE VIEW students_overview AS
SELECT 
    s.id, s.name, s.phone, s.email, s.parent_phone,
    c.name as country, c.currency_code, c.currency_symbol,
    pp.sessions_per_week, pp.monthly_price,
    COALESCE(s.custom_monthly_price, pp.monthly_price) as actual_monthly_price,
    s.excuse_balance, s.max_excuses_per_month, s.warnings_count,
    s.status, s.enrollment_date, s.attendance_rate,
    s.current_level, s.total_pages_memorized,
    COUNT(DISTINCT ses.id) as total_sessions,
    COUNT(*) FILTER (WHERE ses.status = 'completed') as completed_sessions,
    COUNT(*) FILTER (WHERE ses.status = 'student_absent') as absent_sessions,
    COUNT(*) FILTER (WHERE ses.status = 'student_excused') as excused_sessions,
    (SELECT COUNT(*) FROM invoices WHERE student_id = s.id AND status = 'overdue') as overdue_invoices,
    (SELECT COUNT(*) FROM warnings WHERE student_id = s.id AND status = 'active') as active_warnings,
    s.last_session_date, s.next_session_date
FROM students s
LEFT JOIN countries c ON s.country_id = c.id
LEFT JOIN pricing_plans pp ON s.pricing_plan_id = pp.id
LEFT JOIN sessions ses ON s.id = ses.student_id
GROUP BY s.id, c.name, c.currency_code, c.currency_symbol, pp.sessions_per_week, pp.monthly_price;

-- 2. teachers_overview
CREATE OR REPLACE VIEW teachers_overview AS
SELECT 
    t.id, t.name, t.phone, t.email, t.status, t.employment_type,
    t.hire_date, t.overall_rating, t.total_ratings,
    COUNT(DISTINCT ss.student_id) as total_students,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN ss.student_id END) as active_students,
    COUNT(DISTINCT ses.id) as total_sessions,
    COUNT(*) FILTER (WHERE ses.status = 'completed') as completed_sessions,
    COUNT(*) FILTER (WHERE ses.status = 'teacher_cancelled') as cancelled_sessions,
    ROUND(AVG(ses.rating) FILTER (WHERE ses.rating IS NOT NULL), 2) as average_session_rating,
    COUNT(*) FILTER (WHERE ses.session_date >= CURRENT_DATE - INTERVAL '30 days' AND ses.status = 'completed') as sessions_last_30_days,
    MAX(ses.session_date) FILTER (WHERE ses.status = 'completed') as last_session_date
FROM teachers t
LEFT JOIN scheduled_sessions ss ON t.id = ss.teacher_id AND ss.is_active = true
LEFT JOIN students s ON ss.student_id = s.id
LEFT JOIN sessions ses ON t.id = ses.teacher_id
GROUP BY t.id;

-- 3. upcoming_sessions
CREATE OR REPLACE VIEW upcoming_sessions AS
SELECT 
    ses.id, ses.session_date, ses.session_time, ses.session_duration,
    s.id as student_id, s.name as student_name, s.phone as student_phone,
    t.id as teacher_id, t.name as teacher_name, t.phone as teacher_phone,
    ses.status, ses.is_makeup, ses.session_type, ses.is_online, ses.meeting_link,
    CASE 
        WHEN ses.session_date = CURRENT_DATE THEN 'اليوم'
        WHEN ses.session_date = CURRENT_DATE + 1 THEN 'غداً'
        WHEN ses.session_date = CURRENT_DATE + 2 THEN 'بعد غد'
        ELSE TO_CHAR(ses.session_date, 'Day DD/MM/YYYY')
    END as session_label,
    EXTRACT(EPOCH FROM (ses.session_date + ses.session_time - NOW())) / 3600 as hours_until_session
FROM sessions ses
JOIN students s ON ses.student_id = s.id
JOIN teachers t ON ses.teacher_id = t.id
WHERE ses.session_date >= CURRENT_DATE AND ses.status = 'scheduled'
ORDER BY ses.session_date, ses.session_time;

-- 4. financial_summary
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    i.month, i.year, i.currency_code, i.currency_symbol,
    COUNT(DISTINCT i.student_id) as total_students,
    COUNT(i.id) as total_invoices,
    SUM(i.total_amount) as total_invoiced,
    SUM(i.amount_paid) as total_collected,
    SUM(i.amount_due) as total_outstanding,
    COUNT(*) FILTER (WHERE i.status = 'paid') as paid_count,
    COUNT(*) FILTER (WHERE i.status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE i.status = 'partial') as partial_count,
    COUNT(*) FILTER (WHERE i.status = 'overdue') as overdue_count,
    ROUND(SUM(i.amount_paid) / NULLIF(SUM(i.total_amount), 0) * 100, 2) as collection_rate,
    SUM(i.expected_sessions) as expected_sessions,
    SUM(i.completed_sessions) as completed_sessions,
    SUM(i.cancelled_by_teacher) as cancelled_by_teacher,
    SUM(i.absent_sessions) as absent_sessions
FROM invoices i
GROUP BY i.month, i.year, i.currency_code, i.currency_symbol
ORDER BY i.year DESC, i.month DESC;

-- 5. overdue_invoices_detail
CREATE OR REPLACE VIEW overdue_invoices_detail AS
SELECT 
    i.id as invoice_id, i.invoice_number, i.student_id,
    s.name as student_name, s.phone as student_phone, s.parent_phone,
    i.month, i.year, i.total_amount, i.amount_paid, i.amount_due,
    i.currency_code, i.currency_symbol, i.due_date,
    CURRENT_DATE - i.due_date as days_overdue,
    i.last_payment_date,
    (SELECT COUNT(*) FROM payments WHERE invoice_id = i.id) as payment_count,
    (SELECT COUNT(*) FROM warnings WHERE student_id = i.student_id AND warning_type = 'payment_overdue' AND status = 'active') as payment_warnings
FROM invoices i
JOIN students s ON i.student_id = s.id
WHERE i.status = 'overdue'
ORDER BY days_overdue DESC, i.amount_due DESC;

-- 6. sessions_need_makeup
CREATE OR REPLACE VIEW sessions_need_makeup AS
SELECT 
    ses.id, ses.session_date, ses.session_time, ses.status,
    s.id as student_id, s.name as student_name, s.phone as student_phone,
    t.id as teacher_id, t.name as teacher_name, t.phone as teacher_phone,
    ses.cancellation_reason,
    CURRENT_DATE - ses.session_date as days_since_cancellation
FROM sessions ses
JOIN students s ON ses.student_id = s.id
JOIN teachers t ON ses.teacher_id = t.id
WHERE ses.status IN ('student_excused', 'teacher_cancelled')
AND ses.is_makeup = false
AND NOT EXISTS (SELECT 1 FROM sessions makeup WHERE makeup.makeup_for_session_id = ses.id)
ORDER BY ses.session_date DESC;
