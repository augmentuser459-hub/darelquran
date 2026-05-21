-- ============================================================================
-- إضافة حقل مدة الحصة لجدول أنظمة التسعير
-- Add session_duration field to pricing_plans table
-- ============================================================================

-- الخطوة 1: إضافة عمود session_duration
ALTER TABLE pricing_plans 
ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 60 CHECK (session_duration > 0);

COMMENT ON COLUMN pricing_plans.session_duration IS 'مدة الحصة بالدقائق (30، 45، 60، 90، إلخ)';

-- الخطوة 2: حذف القيد الفريد القديم
ALTER TABLE pricing_plans 
DROP CONSTRAINT IF EXISTS pricing_plans_country_id_sessions_per_week_key;

-- الخطوة 3: إضافة القيد الفريد الجديد (يشمل مدة الحصة)
ALTER TABLE pricing_plans 
ADD CONSTRAINT pricing_plans_country_sessions_duration_unique 
UNIQUE (country_id, sessions_per_week, session_duration);

-- الخطوة 4: تحديث السجلات الموجودة (إذا كانت session_duration = NULL)
UPDATE pricing_plans 
SET session_duration = 60 
WHERE session_duration IS NULL;

-- الخطوة 5: التحقق من التعديلات
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'pricing_plans' 
AND column_name = 'session_duration';

-- عرض القيود الجديدة
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'pricing_plans'::regclass
AND conname LIKE '%unique%';

-- ============================================================================
-- ملاحظات:
-- ============================================================================
-- 1. الآن يمكن إضافة:
--    - 3 حصص × 60 دقيقة (ساعة واحدة)
--    - 3 حصص × 30 دقيقة (نصف ساعة)
--    - 3 حصص × 45 دقيقة
--    وكلها باقات مختلفة!
--
-- 2. القيد الفريد الجديد: (country_id, sessions_per_week, session_duration)
--    يعني: نفس الدولة + نفس عدد الحصص + نفس المدة = باقة واحدة فقط
--
-- 3. القيمة الافتراضية: 60 دقيقة (ساعة واحدة)
-- ============================================================================
