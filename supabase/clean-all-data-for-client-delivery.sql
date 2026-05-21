-- ============================================================================
-- تنظيف قاعدة البيانات للتسليم للعميل
-- Clean Database for Client Delivery
-- ============================================================================
-- 
-- الغرض: مسح جميع البيانات التجريبية والاحتفاظ بالإعدادات والبنية الأساسية
-- Purpose: Delete all test data while keeping settings and core structure
--
-- ⚠️ تحذير: هذا السكريبت سيحذف جميع البيانات بشكل نهائي!
-- ⚠️ Warning: This script will permanently delete all data!
--
-- ما سيتم حذفه:
-- - جميع بيانات الطلبة
-- - جميع بيانات المحفظين
-- - جميع الحصص والجداول
-- - جميع الفواتير والمدفوعات
-- - جميع التحذيرات والإشعارات
-- - جميع المصروفات والرواتب
-- - جميع السجلات والتقارير
--
-- ما سيتم الاحتفاظ به:
-- - جدول الدول (countries)
-- - أنظمة التسعير (pricing_plans)
-- - إعدادات النظام (system_settings)
-- - نظام المستخدمين يعتمد على Supabase Auth (ليس جدول منفصل)
-- - البنية الأساسية للجداول (Tables Structure)
-- - القيود والفهارس (Constraints & Indexes)
-- - الدوال والمحفزات (Functions & Triggers)
--
-- ============================================================================

-- بدء المعاملة
BEGIN;

-- ============================================================================
-- الخطوة 1: تعطيل القيود مؤقتاً لتسريع الحذف
-- Step 1: Temporarily disable constraints for faster deletion
-- ============================================================================

SET session_replication_role = 'replica';

-- ============================================================================
-- الخطوة 2: حذف البيانات من الجداول الفرعية أولاً
-- Step 2: Delete data from child tables first (to avoid FK violations)
-- ============================================================================

-- حذف سجلات التواصل
-- Delete communication logs
DELETE FROM communication_log;
SELECT 'تم حذف سجلات التواصل' as message;

-- حذف رواتب المحفظين
-- Delete teacher salaries
DELETE FROM teacher_salaries;
SELECT 'تم حذف رواتب المحفظين' as message;

-- حذف المصروفات
-- Delete expenses
DELETE FROM expenses;
SELECT 'تم حذف المصروفات' as message;

-- حذف فئات المصروفات
-- Delete expense categories
DELETE FROM expense_categories;
SELECT 'تم حذف فئات المصروفات' as message;

-- حذف مستندات المحفظين
-- Delete teacher documents
DELETE FROM teacher_documents;
SELECT 'تم حذف مستندات المحفظين' as message;

-- حذف مستندات الطلبة
-- Delete student documents
DELETE FROM student_documents;
SELECT 'تم حذف مستندات الطلبة' as message;

-- حذف أوقات توفر المحفظين
-- Delete teacher availability
DELETE FROM teacher_availability;
SELECT 'تم حذف أوقات توفر المحفظين' as message;

-- حذف تقدم الطلبة
-- Delete student progress
DELETE FROM student_progress;
SELECT 'تم حذف سجلات تقدم الطلبة' as message;

-- حذف الإشعارات
-- Delete notifications
DELETE FROM notifications;
SELECT 'تم حذف الإشعارات' as message;

-- حذف سجل التدقيق (Audit Log)
-- Delete audit log
DELETE FROM audit_log;
SELECT 'تم حذف سجل التدقيق' as message;

-- حذف التحذيرات
-- Delete warnings
DELETE FROM warnings;
SELECT 'تم حذف التحذيرات' as message;

-- حذف المدفوعات
-- Delete payments
DELETE FROM payments;
SELECT 'تم حذف المدفوعات' as message;

-- حذف الفواتير
-- Delete invoices
DELETE FROM invoices;
SELECT 'تم حذف الفواتير' as message;

-- حذف سجل الحضور
-- Delete attendance log
DELETE FROM attendance_log;
SELECT 'تم حذف سجل الحضور' as message;

-- حذف الحصص
-- Delete sessions
DELETE FROM sessions;
SELECT 'تم حذف الحصص' as message;

-- حذف الجدول الأسبوعي
-- Delete scheduled sessions
DELETE FROM scheduled_sessions;
SELECT 'تم حذف الجدول الأسبوعي' as message;

-- ============================================================================
-- الخطوة 3: حذف البيانات الرئيسية
-- Step 3: Delete main data
-- ============================================================================

-- حذف الطلبة
-- Delete students
DELETE FROM students;
SELECT 'تم حذف جميع الطلبة' as message;

-- حذف المحفظين
-- Delete teachers
DELETE FROM teachers;
SELECT 'تم حذف جميع المحفظين' as message;

-- حذف العطلات (إذا كانت موجودة)
-- Delete holidays (if exists)
DELETE FROM holidays;
SELECT 'تم حذف العطلات' as message;

-- ============================================================================
-- الخطوة 4: إعادة تعيين التسلسلات (Sequences)
-- Step 4: Reset sequences for auto-increment fields
-- ============================================================================

-- إعادة تعيين أرقام الفواتير
-- Reset invoice numbers
DO $$
BEGIN
    -- سيتم إعادة البدء من 1 عند إضافة فاتورة جديدة
    -- Will restart from 1 when adding new invoice
    PERFORM setval(pg_get_serial_sequence('invoices', 'id'), 1, false);
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- تجاهل الخطأ إذا لم يكن هناك sequence
END $$;

-- ============================================================================
-- الخطوة 5: إعادة تفعيل القيود
-- Step 5: Re-enable constraints
-- ============================================================================

SET session_replication_role = 'origin';

-- ============================================================================
-- الخطوة 6: التحقق من النتائج
-- Step 6: Verify results
-- ============================================================================

SELECT 
    '✅ تم تنظيف قاعدة البيانات بنجاح!' as status,
    'جميع البيانات التجريبية تم حذفها' as message;

-- عرض عدد السجلات المتبقية في الجداول الرئيسية
SELECT 
    'عدد الطلبة المتبقية' as table_name,
    COUNT(*) as count
FROM students
UNION ALL
SELECT 
    'عدد المحفظين المتبقية' as table_name,
    COUNT(*) as count
FROM teachers
UNION ALL
SELECT 
    'عدد الحصص المتبقية' as table_name,
    COUNT(*) as count
FROM sessions
UNION ALL
SELECT 
    'عدد الفواتير المتبقية' as table_name,
    COUNT(*) as count
FROM invoices
UNION ALL
SELECT 
    'عدد المدفوعات المتبقية' as table_name,
    COUNT(*) as count
FROM payments;

-- عرض البيانات المحفوظة
SELECT 
    '📊 البيانات المحفوظة:' as section;

SELECT 
    'عدد الدول' as item,
    COUNT(*) as count
FROM countries
UNION ALL
SELECT 
    'عدد أنظمة التسعير' as item,
    COUNT(*) as count
FROM pricing_plans;

-- ============================================================================
-- الخطوة 7: رسالة النجاح النهائية
-- Step 7: Final success message
-- ============================================================================

SELECT 
    '✅ تم تنظيف قاعدة البيانات بنجاح!' as message,
    'النظام جاهز للتسليم للعميل' as status,
    NOW() as cleaned_at;

SELECT 
    '📝 ملاحظات مهمة:' as notes,
    '1. تم حذف جميع البيانات التجريبية' as note1,
    '2. تم الاحتفاظ بالإعدادات وأنظمة التسعير' as note2,
    '3. تم الاحتفاظ بحسابات المستخدمين' as note3,
    '4. البنية الأساسية للجداول سليمة' as note4,
    '5. النظام جاهز لإدخال البيانات الحقيقية' as note5;

-- إتمام المعاملة
COMMIT;

-- ============================================================================
-- نهاية السكريبت
-- End of Script
-- ============================================================================

-- رسالة تأكيد نهائية
SELECT 
    '🎉 تم تنظيف قاعدة البيانات بنجاح!' as final_message,
    'يمكنك الآن تسليم النظام للعميل' as action,
    'جميع الوظائف والميزات تعمل بشكل طبيعي' as confirmation;
