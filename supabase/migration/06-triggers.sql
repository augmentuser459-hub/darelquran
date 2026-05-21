-- ============================================================================
-- MIGRATION 06: Triggers
-- ============================================================================

-- updated_at triggers
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_sessions_updated_at BEFORE UPDATE ON scheduled_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON pricing_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warnings_updated_at BEFORE UPDATE ON warnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_salaries_updated_at BEFORE UPDATE ON teacher_salaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Treasury updated_at trigger
CREATE TRIGGER treasury_transactions_updated_at BEFORE UPDATE ON treasury_transactions
    FOR EACH ROW EXECUTE FUNCTION update_treasury_transactions_updated_at();

-- Business logic triggers
CREATE TRIGGER trigger_handle_excuse AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION handle_student_excuse();

CREATE TRIGGER trigger_update_invoice_count AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_invoice_sessions_count();

CREATE TRIGGER trigger_update_invoice_status AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_status_on_payment();

CREATE TRIGGER trigger_update_attendance_rate AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_student_attendance_rate();

CREATE TRIGGER trigger_generate_invoice_number BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

CREATE TRIGGER trigger_generate_payment_number BEFORE INSERT ON payments
    FOR EACH ROW EXECUTE FUNCTION generate_payment_number();

-- Audit trail triggers
CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_teachers AFTER INSERT OR UPDATE OR DELETE ON teachers
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_sessions AFTER INSERT OR UPDATE OR DELETE ON sessions
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_warnings AFTER INSERT OR UPDATE OR DELETE ON warnings
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
