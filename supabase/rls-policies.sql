-- ==========================================
-- Row Level Security Policies
-- دار القرآن - نظام إدارة المحفظين والطلبة
-- ==========================================
-- 
-- هذا الملف يحتوي على جميع RLS Policies للجداول
-- يمكن تنفيذه في Supabase SQL Editor
--
-- للتطوير: Policies مرنة تسمح بالقراءة للجميع
-- للإنتاج: يجب تشديد الأمان حسب الحاجة
-- ==========================================

-- ==========================================
-- 1. Countries (الدول)
-- ==========================================

-- تفعيل RLS
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- Policy: السماح بالقراءة للجميع
CREATE POLICY "Allow read access to all users"
ON countries FOR SELECT
USING (true);

-- Policy: السماح بالإضافة للمصادق عليهم
CREATE POLICY "Allow insert for authenticated users"
ON countries FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: السماح بالتعديل للمصادق عليهم
CREATE POLICY "Allow update for authenticated users"
ON countries FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy: السماح بالحذف للمصادق عليهم
CREATE POLICY "Allow delete for authenticated users"
ON countries FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 2. Pricing Plans (أنظمة التسعير)
-- ==========================================

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON pricing_plans FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON pricing_plans FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON pricing_plans FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON pricing_plans FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 3. Teachers (المحفظين)
-- ==========================================

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON teachers FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON teachers FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON teachers FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON teachers FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 4. Students (الطلبة)
-- ==========================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON students FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON students FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON students FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON students FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 5. Scheduled Sessions (الجدول الأسبوعي)
-- ==========================================

ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON scheduled_sessions FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON scheduled_sessions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON scheduled_sessions FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON scheduled_sessions FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 6. Sessions (الحصص)
-- ==========================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON sessions FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON sessions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON sessions FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON sessions FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 7. Invoices (الفواتير)
-- ==========================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON invoices FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON invoices FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON invoices FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON invoices FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 8. Payments (المدفوعات)
-- ==========================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON payments FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON payments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON payments FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON payments FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 9. Expense Categories (فئات المصروفات)
-- ==========================================

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON expense_categories FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON expense_categories FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON expense_categories FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON expense_categories FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 10. Expenses (المصروفات)
-- ==========================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON expenses FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON expenses FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON expenses FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON expenses FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 11. Teacher Salaries (رواتب المحفظين)
-- ==========================================

ALTER TABLE teacher_salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON teacher_salaries FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON teacher_salaries FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON teacher_salaries FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON teacher_salaries FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 12. Warnings (التحذيرات)
-- ==========================================

ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON warnings FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON warnings FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON warnings FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON warnings FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 13. Notifications (الإشعارات)
-- ==========================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON notifications FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON notifications FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON notifications FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 14. Holidays (العطلات)
-- ==========================================

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON holidays FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON holidays FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON holidays FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON holidays FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 15. Student Progress (تقدم الطلبة)
-- ==========================================

ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON student_progress FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON student_progress FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON student_progress FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON student_progress FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 16. Student Documents (مستندات الطلبة)
-- ==========================================

ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON student_documents FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON student_documents FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON student_documents FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON student_documents FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 17. Teacher Documents (مستندات المحفظين)
-- ==========================================

ALTER TABLE teacher_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON teacher_documents FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON teacher_documents FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON teacher_documents FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON teacher_documents FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- 18. System Settings (إعدادات النظام)
-- ==========================================

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
ON system_settings FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON system_settings FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users"
ON system_settings FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users"
ON system_settings FOR DELETE
USING (auth.role() = 'authenticated');

-- ==========================================
-- ملاحظات مهمة
-- ==========================================
--
-- 1. للتطوير:
--    - Policies الحالية تسمح بالقراءة للجميع
--    - هذا يسهل التطوير والاختبار
--
-- 2. للإنتاج (يُنصح بتشديد الأمان):
--    - تقييد القراءة حسب المستخدم
--    - إضافة roles (admin, teacher, student)
--    - تقييد الحذف للـ admin فقط
--
-- 3. مثال على Policy أكثر أماناً:
--    CREATE POLICY "Users can read their own data"
--    ON students FOR SELECT
--    USING (auth.uid() = user_id);
--
-- 4. لتعطيل RLS مؤقتاً (للتطوير فقط):
--    ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
--
-- 5. للتحقق من Policies الموجودة:
--    SELECT * FROM pg_policies WHERE tablename = 'table_name';
--
-- ==========================================

-- ==========================================
-- Script للتحقق من تفعيل RLS
-- ==========================================

-- عرض جميع الجداول مع حالة RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- عرض جميع Policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==========================================
-- تم إنشاء هذا الملف بواسطة: Kiro AI
-- التاريخ: يناير 2026
-- الإصدار: 1.0.0
-- الحالة: ✅ جاهز للتنفيذ
-- ==========================================
