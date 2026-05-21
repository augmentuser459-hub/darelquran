-- Quick Fix: Allow anonymous access for existing tables only
-- Run this in Supabase SQL Editor

-- Teachers
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.teachers;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.teachers;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.teachers;

CREATE POLICY "Allow anonymous write access" ON public.teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teachers FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teachers FOR DELETE USING (true);

-- Students
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.students;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.students;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.students;

CREATE POLICY "Allow anonymous write access" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.students FOR DELETE USING (true);

-- Sessions
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.sessions;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.sessions;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.sessions;

CREATE POLICY "Allow anonymous write access" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.sessions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.sessions FOR DELETE USING (true);

-- Scheduled Sessions
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.scheduled_sessions;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.scheduled_sessions;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.scheduled_sessions;

CREATE POLICY "Allow anonymous write access" ON public.scheduled_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.scheduled_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.scheduled_sessions FOR DELETE USING (true);

-- Invoices
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.invoices;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.invoices;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.invoices;

CREATE POLICY "Allow anonymous write access" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.invoices FOR DELETE USING (true);

-- Payments
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.payments;

CREATE POLICY "Allow anonymous write access" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.payments FOR DELETE USING (true);

-- Expenses
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.expenses;

CREATE POLICY "Allow anonymous write access" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.expenses FOR DELETE USING (true);

-- Expense Categories
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.expense_categories;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.expense_categories;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.expense_categories;

CREATE POLICY "Allow anonymous write access" ON public.expense_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.expense_categories FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.expense_categories FOR DELETE USING (true);

-- Teacher Salaries
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.teacher_salaries;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.teacher_salaries;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.teacher_salaries;

CREATE POLICY "Allow anonymous write access" ON public.teacher_salaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.teacher_salaries FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.teacher_salaries FOR DELETE USING (true);

-- Countries
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.countries;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.countries;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.countries;

CREATE POLICY "Allow anonymous write access" ON public.countries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.countries FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.countries FOR DELETE USING (true);

-- Pricing Plans
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.pricing_plans;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.pricing_plans;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.pricing_plans;

CREATE POLICY "Allow anonymous write access" ON public.pricing_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.pricing_plans FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.pricing_plans FOR DELETE USING (true);

-- System Settings
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.system_settings;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.system_settings;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.system_settings;

CREATE POLICY "Allow anonymous write access" ON public.system_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.system_settings FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.system_settings FOR DELETE USING (true);

SELECT '✅ Anonymous access policies updated successfully!' as status;
