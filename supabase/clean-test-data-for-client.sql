-- ============================================
-- تنظيف البيانات التجريبية للعميل
-- Clean Test Data for Client Delivery
-- ============================================
-- هذا الملف يحذف فقط البيانات التجريبية
-- ويحتفظ بـ:
-- 1. جميع الجداول والبنية
-- 2. جميع الـ Functions والـ Triggers
-- 3. جميع الـ RLS Policies
-- 4. إعدادات الدول وخطط التسعير
-- ============================================

-- تعطيل RLS مؤقتاً للسماح بالحذف
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scheduled_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_salaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS warnings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS communication_log DISABLE ROW LEVEL SECURITY;

-- ============================================
-- الجزء 1: حذف البيانات التشغيلية
-- ============================================

-- حذف المدفوعات
DELETE FROM payments;
COMMENT ON TABLE payments IS 'جدول المدفوعات - تم تنظيفه';

-- حذف الفواتير
DELETE FROM invoices;
COMMENT ON TABLE invoices IS 'جدول الفواتير - تم تنظيفه';

-- حذف سجل الحضور
DELETE FROM attendance_log;
COMMENT ON TABLE attendance_log IS 'سجل الحضور - تم تنظيفه';

-- حذف الحصص
DELETE FROM sessions;
COMMENT ON TABLE sessions IS 'جدول الحصص - تم تنظيفه';

-- حذف الجدول الأسبوعي
DELETE FROM scheduled_sessions;
COMMENT ON TABLE scheduled_sessions IS 'جدول الحصص المجدولة - تم تنظيفه';

-- حذف المصروفات
DELETE FROM expenses;
COMMENT ON TABLE expenses IS 'جدول المصروفات - تم تنظيفه';

-- حذف رواتب المحفظين
DELETE FROM teacher_salaries;
COMMENT ON TABLE teacher_salaries IS 'جدول رواتب المحفظين - تم تنظيفه';

-- حذف التحذيرات
DELETE FROM warnings;
COMMENT ON TABLE warnings IS 'جدول التحذيرات - تم تنظيفه';

-- حذف سجل التواصل
DELETE FROM communication_log;
COMMENT ON TABLE communication_log IS 'سجل التواصل - تم تنظيفه';

-- حذف تقدم الطلاب
DELETE FROM student_progress;
COMMENT ON TABLE student_progress IS 'تقدم الطلاب - تم تنظيفه';

-- ============================================
-- الجزء 2: حذف بيانات الطلاب والمحفظين
-- ============================================

-- حذف الطلاب
DELETE FROM students;
COMMENT ON TABLE students IS 'جدول الطلاب - تم تنظيفه';

-- حذف المحفظين
DELETE FROM teachers;
COMMENT ON TABLE teachers IS 'جدول المحفظين - تم تنظيفه';

-- ============================================
-- الجزء 3: إعادة تعيين التسلسلات (Auto-increment)
-- ============================================

-- إعادة تعيين sequences إن وجدت
-- (معظم الجداول تستخدم UUID لذلك لا حاجة لإعادة تعيين)

-- ============================================
-- الجزء 4: إعادة تفعيل RLS
-- ============================================

ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scheduled_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS communication_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- التحقق من البيانات المتبقية (الإعدادات)
-- ============================================

-- عرض عدد الدول المتبقية (يجب أن تبقى كما هي)
SELECT 'countries' as table_name, COUNT(*) as count FROM countries
UNION ALL
-- عرض عدد خطط التسعير المتبقية (يجب أن تبقى كما هي)
SELECT 'pricing_plans' as table_name, COUNT(*) as count FROM pricing_plans
UNION ALL
-- التأكد من حذف الطلاب
SELECT 'students' as table_name, COUNT(*) as count FROM students
UNION ALL
-- التأكد من حذف المحفظين
SELECT 'teachers' as table_name, COUNT(*) as count FROM teachers
UNION ALL
-- التأكد من حذف الحصص
SELECT 'sessions' as table_name, COUNT(*) as count FROM sessions
UNION ALL
-- التأكد من حذف الفواتير
SELECT 'invoices' as table_name, COUNT(*) as count FROM invoices
UNION ALL
-- التأكد من حذف المدفوعات
SELECT 'payments' as table_name, COUNT(*) as count FROM payments
UNION ALL
-- التأكد من حذف الجدول الأسبوعي
SELECT 'scheduled_sessions' as table_name, COUNT(*) as count FROM scheduled_sessions
UNION ALL
-- التأكد من حذف المصروفات
SELECT 'expenses' as table_name, COUNT(*) as count FROM expenses
UNION ALL
-- التأكد من حذف رواتب المحفظين
SELECT 'teacher_salaries' as table_name, COUNT(*) as count FROM teacher_salaries
UNION ALL
-- التأكد من حذف التحذيرات
SELECT 'warnings' as table_name, COUNT(*) as count FROM warnings
UNION ALL
-- التأكد من حذف سجل الحضور
SELECT 'attendance_log' as table_name, COUNT(*) as count FROM attendance_log;

-- ============================================
-- ملاحظات مهمة للعميل
-- ============================================

/*
✅ تم الحفاظ على:
1. جميع الجداول والبنية الكاملة
2. جميع الـ Functions والـ Stored Procedures
3. جميع الـ Triggers
4. جميع الـ RLS Policies
5. بيانات الدول (countries) - 3 دول
6. خطط التسعير (pricing_plans) - 6 خطط

❌ تم حذف:
1. جميع الطلاب
2. جميع المحفظين
3. جميع الحصص
4. جميع الفواتير
5. جميع المدفوعات
6. جميع المصروفات
7. رواتب المحفظين
8. التحذيرات
9. سجل الحضور
10. تقدم الطلاب
11. سجل التواصل
12. الجدول الأسبوعي

📝 الخطوات التالية للعميل:
1. تسجيل المحفظين من صفحة "المحفظين"
2. تسجيل الطلاب من صفحة "الطلبة"
3. إنشاء الجدول الأسبوعي من صفحة "الجدول الأسبوعي"
4. البدء في تسجيل الحصص والحضور

🔒 الأمان:
- جميع سياسات RLS نشطة
- جميع الصلاحيات محفوظة
- النظام جاهز للاستخدام الفوري
*/

-- ============================================
-- نهاية الملف
-- ============================================

SELECT '✅ تم تنظيف البيانات التجريبية بنجاح!' as status,
       'النظام جاهز للتسليم للعميل' as message;
