-- ============================================================================
-- RESET SCRIPT: DELETE ALL OPERATIONAL DATA (KEEP CONFIGURATION)
-- ============================================================================
-- هذا السكربت يقوم بمسح جميع بيانات النظام (الطلاب، المعلمين، الحصص، الفواتير، الخ)
-- ويحتفظ فقط بالبيانات الأساسية (الدول، العملات، إعدادات النظام، وباقات التسعير).
-- ============================================================================

-- مسح بيانات المعلمين وما يرتبط بها (رواتب، حصص، توفر، الخ)
TRUNCATE TABLE teachers CASCADE;

-- مسح بيانات الطلاب وما يرتبط بها (فواتير، مدفوعات، حضور، الخ)
TRUNCATE TABLE students CASCADE;

-- مسح بيانات الخزينة والمصروفات
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE treasury_transactions CASCADE;
TRUNCATE TABLE treasury_transfers CASCADE;

-- مسح سجلات النظام الأخرى (التدقيق، الإشعارات، التواصل، العطلات)
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE communication_log CASCADE;
TRUNCATE TABLE holidays CASCADE;

-- تصفير عدادات الأرقام التلقائية (الفواتير، المدفوعات، التحذيرات)
ALTER SEQUENCE IF EXISTS invoice_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payment_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS warning_seq RESTART WITH 1;

SELECT 'تم مسح جميع البيانات بنجاح، النظام الآن جاهز للاستخدام كأنه جديد!' as status;
