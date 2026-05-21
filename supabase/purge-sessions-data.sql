-- ============================================================================
-- مسح بيانات الحصص فقط (المجدولة والفعلية)
-- مع الحفاظ الكامل على الجداول والفانكشنز والتريجرز والعمليات
-- ============================================================================

-- الخطوة 1: حذف سجلات الحضور المرتبطة بالحصص
DELETE FROM attendance_log;

-- الخطوة 2: فك ارتباط تقدم الطلبة بالحصص
UPDATE student_progress SET session_id = NULL WHERE session_id IS NOT NULL;

-- الخطوة 3: إزالة مرجع الحصص التعويضية (self-reference)
UPDATE sessions SET makeup_for_session_id = NULL WHERE makeup_for_session_id IS NOT NULL;

-- الخطوة 4: حذف جميع الحصص الفعلية
DELETE FROM sessions;

-- الخطوة 5: حذف جميع الحصص المجدولة
DELETE FROM scheduled_sessions;
