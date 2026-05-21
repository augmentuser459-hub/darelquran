-- Allow anonymous access to all tables for development
-- Run this in Supabase SQL Editor

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.countries;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.pricing_plans;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.teachers;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.students;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.sessions;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.scheduled_sessions;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.makeup_sessions;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.attendance_log;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.invoices;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.payments;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.expenses;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.expense_categories;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.teacher_salaries;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.student_documents;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.teacher_documents;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.student_progress;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.warnings;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.holidays;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.notifications;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.system_settings;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.audit_log;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.communication_log;
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.teacher_availability;

-- Create policies to allow all operations for anon users (development only)
CREATE POLICY "Allow anonymous read access" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.countries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.countries FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.countries FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.pricing_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.pricing_plans FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.pricing_plans FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teachers FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teachers FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.students FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.sessions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.sessions FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.scheduled_sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.scheduled_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.scheduled_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.scheduled_sessions FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.makeup_sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.makeup_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.makeup_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.makeup_sessions FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.attendance_log FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.attendance_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.attendance_log FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.attendance_log FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.invoices FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.payments FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.expenses FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.expense_categories FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.expense_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.expense_categories FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.expense_categories FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.teacher_salaries FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teacher_salaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teacher_salaries FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teacher_salaries FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.student_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.student_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.student_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.student_documents FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.teacher_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teacher_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teacher_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teacher_documents FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.student_progress FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.student_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.student_progress FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.student_progress FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.warnings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.warnings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.warnings FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.warnings FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.holidays FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.holidays FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.holidays FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.notifications FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.system_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.system_settings FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.system_settings FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.audit_log FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.audit_log FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.audit_log FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.communication_log FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.communication_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.communication_log FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.communication_log FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.teacher_availability FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON public.teacher_availability FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teacher_availability FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teacher_availability FOR DELETE USING (true);

-- Success message
SELECT 'Anonymous access policies created successfully!' as status;
