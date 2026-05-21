-- ============================================================================
-- MIGRATION 09: Row Level Security (RLS) & Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_transfers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Anonymous access policies (for development / anon key usage)
-- Full CRUD for all tables via anon role
-- ============================================================================

-- countries
CREATE POLICY "Allow anonymous read access" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.countries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.countries FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.countries FOR DELETE USING (true);

-- pricing_plans
CREATE POLICY "Allow anonymous read access" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.pricing_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.pricing_plans FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.pricing_plans FOR DELETE USING (true);

-- teachers
CREATE POLICY "Allow anonymous read access" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teachers FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teachers FOR DELETE USING (true);

-- students
CREATE POLICY "Allow anonymous read access" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.students FOR DELETE USING (true);

-- sessions
CREATE POLICY "Allow anonymous read access" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.sessions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.sessions FOR DELETE USING (true);

-- scheduled_sessions
CREATE POLICY "Allow anonymous read access" ON public.scheduled_sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.scheduled_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.scheduled_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.scheduled_sessions FOR DELETE USING (true);

-- attendance_log
CREATE POLICY "Allow anonymous read access" ON public.attendance_log FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.attendance_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.attendance_log FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.attendance_log FOR DELETE USING (true);

-- invoices
CREATE POLICY "Allow anonymous read access" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.invoices FOR DELETE USING (true);

-- payments
CREATE POLICY "Allow anonymous read access" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.payments FOR DELETE USING (true);

-- expenses
CREATE POLICY "Allow anonymous read access" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.expenses FOR DELETE USING (true);

-- expense_categories
CREATE POLICY "Allow anonymous read access" ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.expense_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.expense_categories FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.expense_categories FOR DELETE USING (true);

-- teacher_salaries
CREATE POLICY "Allow anonymous read access" ON public.teacher_salaries FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teacher_salaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teacher_salaries FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teacher_salaries FOR DELETE USING (true);

-- student_documents
CREATE POLICY "Allow anonymous read access" ON public.student_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.student_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.student_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.student_documents FOR DELETE USING (true);

-- teacher_documents
CREATE POLICY "Allow anonymous read access" ON public.teacher_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teacher_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teacher_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teacher_documents FOR DELETE USING (true);

-- student_progress
CREATE POLICY "Allow anonymous read access" ON public.student_progress FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.student_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.student_progress FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.student_progress FOR DELETE USING (true);

-- warnings
CREATE POLICY "Allow anonymous read access" ON public.warnings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.warnings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.warnings FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.warnings FOR DELETE USING (true);

-- holidays
CREATE POLICY "Allow anonymous read access" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.holidays FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.holidays FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.holidays FOR DELETE USING (true);

-- notifications
CREATE POLICY "Allow anonymous read access" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.notifications FOR DELETE USING (true);

-- system_settings
CREATE POLICY "Allow anonymous read access" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.system_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.system_settings FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.system_settings FOR DELETE USING (true);

-- audit_log
CREATE POLICY "Allow anonymous read access" ON public.audit_log FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.audit_log FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.audit_log FOR DELETE USING (true);

-- communication_log
CREATE POLICY "Allow anonymous read access" ON public.communication_log FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.communication_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.communication_log FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.communication_log FOR DELETE USING (true);

-- teacher_availability
CREATE POLICY "Allow anonymous read access" ON public.teacher_availability FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teacher_availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teacher_availability FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teacher_availability FOR DELETE USING (true);

-- treasury_transactions
CREATE POLICY "Allow anon to view transactions" ON public.treasury_transactions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon to insert transactions" ON public.treasury_transactions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon to update transactions" ON public.treasury_transactions FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow authenticated to view transactions" ON public.treasury_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to insert transactions" ON public.treasury_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated to update transactions" ON public.treasury_transactions FOR UPDATE TO authenticated USING (true);

-- treasury_transfers
CREATE POLICY "Allow anon to view transfers" ON public.treasury_transfers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon to insert transfers" ON public.treasury_transfers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow authenticated to view transfers" ON public.treasury_transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to insert transfers" ON public.treasury_transfers FOR INSERT TO authenticated WITH CHECK (true);
