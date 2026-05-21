-- ============================================================================
-- تحسين قاعدة البيانات بعد التنظيف (اختياري)
-- Optimize Database After Cleanup (Optional)
-- ============================================================================
-- 
-- الغرض: تحديث الإحصائيات وتحسين الأداء بعد حذف البيانات
-- Purpose: Update statistics and optimize performance after data deletion
--
-- ملاحظة: هذا السكريبت اختياري ويمكن تشغيله بعد clean-all-data-for-client-delivery.sql
-- Note: This script is optional and can be run after clean-all-data-for-client-delivery.sql
--
-- ============================================================================

-- تحديث إحصائيات الجداول الرئيسية
-- Update statistics for main tables

VACUUM ANALYZE students;
VACUUM ANALYZE teachers;
VACUUM ANALYZE sessions;
VACUUM ANALYZE scheduled_sessions;
VACUUM ANALYZE invoices;
VACUUM ANALYZE payments;
VACUUM ANALYZE warnings;
VACUUM ANALYZE expenses;
VACUUM ANALYZE teacher_salaries;
VACUUM ANALYZE attendance_log;
VACUUM ANALYZE notifications;
VACUUM ANALYZE audit_log;

-- رسالة النجاح
SELECT 
    '✅ تم تحديث إحصائيات قاعدة البيانات بنجاح!' as message,
    'الأداء محسّن والنظام جاهز للاستخدام' as status;
