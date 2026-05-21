-- ============================================================================
-- MIGRATION 05: Functions
-- ============================================================================

-- 1. update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. handle_student_excuse
CREATE OR REPLACE FUNCTION handle_student_excuse()
RETURNS TRIGGER AS $$
DECLARE
    current_excuse_balance INTEGER;
    student_name VARCHAR(200);
BEGIN
    IF NEW.status = 'student_excused' AND (OLD.status IS NULL OR OLD.status != 'student_excused') THEN
        UPDATE students 
        SET excuse_balance = GREATEST(excuse_balance - 1, 0),
            updated_at = NOW()
        WHERE id = NEW.student_id
        RETURNING excuse_balance, name INTO current_excuse_balance, student_name;
        
        IF current_excuse_balance <= 0 THEN
            INSERT INTO warnings (
                warning_number, student_id, warning_type, severity,
                title, reason, issued_by, status
            ) VALUES (
                'WRN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('warning_seq')::TEXT, 6, '0'),
                NEW.student_id, 'excessive_excuses', 'high',
                'تجاوز عدد الاعتذارات المسموح',
                'تجاوز الطالب ' || student_name || ' عدد الاعتذارات المسموح بها (' || 
                (SELECT max_excuses_per_month FROM students WHERE id = NEW.student_id) || ' اعتذار شهرياً)',
                'system', 'active'
            );
            
            UPDATE students 
            SET warnings_count = warnings_count + 1, updated_at = NOW()
            WHERE id = NEW.student_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. update_invoice_sessions_count
CREATE OR REPLACE FUNCTION update_invoice_sessions_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE invoices
        SET completed_sessions = completed_sessions + 1, updated_at = NOW()
        WHERE student_id = NEW.student_id
        AND month = EXTRACT(MONTH FROM NEW.session_date)
        AND year = EXTRACT(YEAR FROM NEW.session_date);
    END IF;
    
    IF NEW.status = 'teacher_cancelled' AND (OLD.status IS NULL OR OLD.status != 'teacher_cancelled') THEN
        UPDATE invoices
        SET cancelled_by_teacher = cancelled_by_teacher + 1, updated_at = NOW()
        WHERE student_id = NEW.student_id
        AND month = EXTRACT(MONTH FROM NEW.session_date)
        AND year = EXTRACT(YEAR FROM NEW.session_date);
    END IF;
    
    IF NEW.status = 'student_absent' AND (OLD.status IS NULL OR OLD.status != 'student_absent') THEN
        UPDATE invoices
        SET absent_sessions = absent_sessions + 1, updated_at = NOW()
        WHERE student_id = NEW.student_id
        AND month = EXTRACT(MONTH FROM NEW.session_date)
        AND year = EXTRACT(YEAR FROM NEW.session_date);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. update_invoice_status_on_payment
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(10, 2);
    invoice_total DECIMAL(10, 2);
    invoice_status VARCHAR(20);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments WHERE invoice_id = NEW.invoice_id AND status = 'completed';
    
    SELECT total_amount INTO invoice_total
    FROM invoices WHERE id = NEW.invoice_id;
    
    IF total_paid >= invoice_total THEN
        invoice_status := 'paid';
    ELSIF total_paid > 0 THEN
        invoice_status := 'partial';
    ELSE
        invoice_status := 'pending';
    END IF;
    
    UPDATE invoices 
    SET status = invoice_status,
        amount_paid = total_paid,
        amount_due = invoice_total - total_paid,
        paid_date = CASE WHEN invoice_status = 'paid' THEN CURRENT_DATE ELSE paid_date END,
        last_payment_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. log_audit_trail
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields JSONB := '{}'::JSONB;
    field_name TEXT;
    old_value TEXT;
    new_value TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::JSONB, current_user);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        FOR field_name IN SELECT jsonb_object_keys(to_jsonb(NEW)) LOOP
            old_value := (to_jsonb(OLD) ->> field_name);
            new_value := (to_jsonb(NEW) ->> field_name);
            IF old_value IS DISTINCT FROM new_value THEN
                changed_fields := changed_fields || jsonb_build_object(
                    field_name, jsonb_build_object('old', old_value, 'new', new_value)
                );
            END IF;
        END LOOP;
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_fields, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB, changed_fields, current_user);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::JSONB, current_user);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. generate_invoice_number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
                             LPAD(NEXTVAL('invoice_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. generate_payment_number
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
        NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                             LPAD(NEXTVAL('payment_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. calculate_student_attendance_rate
CREATE OR REPLACE FUNCTION calculate_student_attendance_rate(student_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    attendance_rate DECIMAL(5, 2);
BEGIN
    SELECT ROUND(
        COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / 
        NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'student_absent')), 0) * 100, 2
    ) INTO attendance_rate
    FROM sessions WHERE student_id = student_uuid;
    RETURN COALESCE(attendance_rate, 100);
END;
$$ LANGUAGE plpgsql;

-- 9. update_student_attendance_rate
CREATE OR REPLACE FUNCTION update_student_attendance_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('completed', 'student_absent') THEN
        UPDATE students
        SET attendance_rate = calculate_student_attendance_rate(NEW.student_id),
            last_session_date = NEW.session_date, updated_at = NOW()
        WHERE id = NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. generate_weekly_sessions
CREATE OR REPLACE FUNCTION generate_weekly_sessions(
    start_date DATE DEFAULT CURRENT_DATE,
    weeks_count INTEGER DEFAULT 4
)
RETURNS TABLE (sessions_created INTEGER, sessions_skipped INTEGER, message TEXT) AS $$
DECLARE
    created_count INTEGER := 0;
    skipped_count INTEGER := 0;
    schedule_record RECORD;
    target_date DATE;
    week_num INTEGER;
    is_holiday BOOLEAN;
BEGIN
    FOR schedule_record IN 
        SELECT * FROM scheduled_sessions 
        WHERE is_active = true AND (end_date IS NULL OR end_date >= start_date)
    LOOP
        FOR week_num IN 0..(weeks_count - 1) LOOP
            target_date := start_date + (week_num * 7) + schedule_record.day_of_week;
            SELECT EXISTS(SELECT 1 FROM holidays WHERE holiday_date = target_date) INTO is_holiday;
            IF NOT is_holiday THEN
                BEGIN
                    INSERT INTO sessions (
                        scheduled_session_id, student_id, teacher_id,
                        session_date, session_time, session_duration, status
                    ) VALUES (
                        schedule_record.id, schedule_record.student_id, schedule_record.teacher_id,
                        target_date, schedule_record.session_time, schedule_record.session_duration, 'scheduled'
                    );
                    created_count := created_count + 1;
                EXCEPTION WHEN unique_violation THEN
                    skipped_count := skipped_count + 1;
                END;
            ELSE
                skipped_count := skipped_count + 1;
            END IF;
        END LOOP;
    END LOOP;
    RETURN QUERY SELECT created_count, skipped_count,
        'تم إنشاء ' || created_count || ' حصة، وتخطي ' || skipped_count || ' حصة';
END;
$$ LANGUAGE plpgsql;

-- 11. reset_monthly_excuse_balance
CREATE OR REPLACE FUNCTION reset_monthly_excuse_balance()
RETURNS TABLE (updated_count INTEGER, message TEXT) AS $$
DECLARE
    count INTEGER;
BEGIN
    UPDATE students SET excuse_balance = max_excuses_per_month, updated_at = NOW()
    WHERE status = 'active';
    GET DIAGNOSTICS count = ROW_COUNT;
    RETURN QUERY SELECT count, 'تم إعادة تعيين رصيد الاعتذارات لـ ' || count || ' طالب';
END;
$$ LANGUAGE plpgsql;

-- 12. check_overdue_invoices
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS TABLE (updated_count INTEGER, warnings_issued INTEGER, message TEXT) AS $$
DECLARE
    invoice_count INTEGER := 0;
    warning_count INTEGER := 0;
    invoice_record RECORD;
BEGIN
    UPDATE invoices SET status = 'overdue', updated_at = NOW()
    WHERE status IN ('pending', 'partial', 'sent') AND due_date < CURRENT_DATE;
    GET DIAGNOSTICS invoice_count = ROW_COUNT;
    
    FOR invoice_record IN
        SELECT i.*, s.name as student_name FROM invoices i
        JOIN students s ON i.student_id = s.id
        WHERE i.status = 'overdue' AND i.due_date < CURRENT_DATE - INTERVAL '7 days'
        AND NOT EXISTS (
            SELECT 1 FROM warnings w WHERE w.student_id = i.student_id
            AND w.warning_type = 'payment_overdue' AND w.status = 'active'
            AND w.issued_at > CURRENT_DATE - INTERVAL '30 days'
        )
    LOOP
        INSERT INTO warnings (
            warning_number, student_id, warning_type, severity, title, reason, issued_by, status
        ) VALUES (
            'WRN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('warning_seq')::TEXT, 6, '0'),
            invoice_record.student_id, 'payment_overdue', 'high',
            'تأخر في سداد الفاتورة',
            'تأخر الطالب ' || invoice_record.student_name || ' في سداد فاتورة ' || 
            invoice_record.invoice_number || ' لأكثر من 7 أيام',
            'system', 'active'
        );
        warning_count := warning_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT invoice_count, warning_count,
        'تم تحديث ' || invoice_count || ' فاتورة وإصدار ' || warning_count || ' تحذير';
END;
$$ LANGUAGE plpgsql;

-- 13. cleanup_old_data
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 365)
RETURNS TABLE (deleted_audit_logs BIGINT, deleted_notifications BIGINT, message TEXT) AS $$
DECLARE
    audit_count BIGINT;
    notif_count BIGINT;
BEGIN
    DELETE FROM audit_log WHERE changed_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS audit_count = ROW_COUNT;
    DELETE FROM notifications WHERE status = 'read' AND read_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS notif_count = ROW_COUNT;
    RETURN QUERY SELECT audit_count, notif_count,
        'تم حذف ' || audit_count || ' سجل تدقيق و ' || notif_count || ' إشعار';
END;
$$ LANGUAGE plpgsql;

-- 14. rebuild_statistics
CREATE OR REPLACE FUNCTION rebuild_statistics()
RETURNS TEXT AS $$
BEGIN
    UPDATE students s SET attendance_rate = calculate_student_attendance_rate(s.id), updated_at = NOW()
    WHERE status = 'active';
    UPDATE students s SET next_session_date = (
        SELECT MIN(session_date) FROM sessions
        WHERE student_id = s.id AND session_date >= CURRENT_DATE AND status = 'scheduled'
    ), updated_at = NOW() WHERE status = 'active';
    RETURN 'تم إعادة بناء الإحصائيات بنجاح';
END;
$$ LANGUAGE plpgsql;

-- 15. Treasury updated_at function
CREATE OR REPLACE FUNCTION update_treasury_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
