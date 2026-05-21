-- Enable RLS on all tables
-- This fixes the "Policy Exists RLS Disabled" warnings

-- Core tables
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Session tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.makeup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_log ENABLE ROW LEVEL SECURITY;

-- Financial tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_salaries ENABLE ROW LEVEL SECURITY;

-- Document tables
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_documents ENABLE ROW LEVEL SECURITY;

-- Progress and tracking
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;

-- System tables
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_availability ENABLE ROW LEVEL SECURITY;

-- Django tables (optional - usually don't need RLS)
-- ALTER TABLE public.django_migrations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.django_content_type ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.auth_permission ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.auth_group ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.auth_group_permissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.auth_user_groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.auth_user_user_permissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.auth_user ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.django_admin_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.django_session ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'django_%'
    AND tablename NOT LIKE 'auth_%'
ORDER BY tablename;
