-- ============================================================================
-- تعطيل RLS مؤقتاً للتطوير
-- Temporarily Disable RLS for Development
-- ============================================================================
-- تحذير: هذا للتطوير فقط! لا تستخدمه في الإنتاج
-- Warning: Development only! Do not use in production
-- ============================================================================

-- تعطيل RLS على الجداول الأساسية
ALTER TABLE countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_salaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE warnings DISABLE ROW LEVEL SECURITY;
ALTER TABLE holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_log DISABLE ROW LEVEL SECURITY;

-- التحقق من حالة RLS
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'countries', 'pricing_plans', 'teachers', 'students',
        'scheduled_sessions', 'sessions', 'invoices', 'payments',
        'expenses', 'teacher_salaries', 'warnings', 'holidays',
        'student_progress', 'notifications', 'system_settings',
        'audit_log', 'attendance_log'
    )
ORDER BY tablename;
