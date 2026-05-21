-- ============================================================================
-- إصلاح قيود جدول pricing_plans للسماح بإضافة أنظمة تسعير ديناميكية
-- Fix pricing_plans table constraints to allow dynamic pricing plans
-- ============================================================================
-- 
-- المشكلة: القيود الحالية تمنع إضافة باقات جديدة بعدد حصص معين
-- الحل: إزالة القيود القديمة وإضافة قيود جديدة أكثر مرونة
--
-- ============================================================================

-- الخطوة 1: إزالة القيود القديمة
-- Step 1: Drop old constraints
-- ============================================================================

DO $$ 
BEGIN
    -- إزالة قيد sessions_per_week القديم
    ALTER TABLE pricing_plans 
    DROP CONSTRAINT IF EXISTS pricing_plans_sessions_per_week_check;
    
    RAISE NOTICE '✓ تم إزالة قيد sessions_per_week القديم';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ قيد sessions_per_week غير موجود أو تم إزالته مسبقاً';
END $$;

DO $$ 
BEGIN
    -- إزالة قيد monthly_price القديم
    ALTER TABLE pricing_plans 
    DROP CONSTRAINT IF EXISTS pricing_plans_monthly_price_check;
    
    RAISE NOTICE '✓ تم إزالة قيد monthly_price القديم';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ قيد monthly_price غير موجود أو تم إزالته مسبقاً';
END $$;

-- ============================================================================
-- الخطوة 2: إضافة القيود الجديدة
-- Step 2: Add new flexible constraints
-- ============================================================================

DO $$ 
BEGIN
    -- إضافة قيد جديد يسمح بباقات من 1 إلى 20 حصة أسبوعياً
    ALTER TABLE pricing_plans 
    ADD CONSTRAINT pricing_plans_sessions_per_week_check 
    CHECK (sessions_per_week >= 1 AND sessions_per_week <= 20);
    
    RAISE NOTICE '✓ تم إضافة قيد sessions_per_week الجديد (1-20 حصة)';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⚠ القيد موجود مسبقاً';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ خطأ في إضافة القيد: %', SQLERRM;
END $$;

DO $$ 
BEGIN
    -- إضافة قيد جديد يسمح بأسعار >= 0
    ALTER TABLE pricing_plans 
    ADD CONSTRAINT pricing_plans_monthly_price_check 
    CHECK (monthly_price >= 0);
    
    RAISE NOTICE '✓ تم إضافة قيد monthly_price الجديد (>= 0)';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⚠ القيد موجود مسبقاً';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ خطأ في إضافة القيد: %', SQLERRM;
END $$;

-- ============================================================================
-- الخطوة 3: السماح بقيم NULL للأسعار
-- Step 3: Allow NULL values for monthly_price
-- ============================================================================

DO $$ 
BEGIN
    -- السماح بقيم NULL للأسعار (للباقات غير المحددة السعر بعد)
    ALTER TABLE pricing_plans 
    ALTER COLUMN monthly_price DROP NOT NULL;
    
    RAISE NOTICE '✓ تم السماح بقيم NULL للأسعار';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ العمود يسمح بـ NULL مسبقاً';
END $$;

-- ============================================================================
-- الخطوة 4: إنشاء فهرس لتحسين الأداء
-- Step 4: Create index for better performance
-- ============================================================================

DO $$ 
BEGIN
    -- إنشاء فهرس على sessions_per_week لتحسين أداء الاستعلامات
    CREATE INDEX IF NOT EXISTS idx_pricing_plans_sessions 
    ON pricing_plans(sessions_per_week);
    
    RAISE NOTICE '✓ تم إنشاء الفهرس';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ الفهرس موجود مسبقاً';
END $$;

-- ============================================================================
-- الخطوة 5: التحقق من التغييرات
-- Step 5: Verify changes
-- ============================================================================

-- عرض القيود الحالية
SELECT 
    '📋 القيود الحالية على جدول pricing_plans:' as message;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'pricing_plans'::regclass
AND conname LIKE 'pricing_plans_%_check'
ORDER BY conname;

-- عرض معلومات العمود monthly_price
SELECT 
    '📋 معلومات عمود monthly_price:' as message;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pricing_plans'
AND column_name = 'monthly_price';

-- ============================================================================
-- رسالة النجاح
-- Success message
-- ============================================================================

SELECT 
    '✅ تم إصلاح قيود جدول pricing_plans بنجاح!' as message,
    'يمكنك الآن إضافة باقات من 1 إلى 20 حصة أسبوعياً' as note1,
    'يمكنك استخدام قيم NULL أو 0 للأسعار غير المحددة' as note2,
    'افتح صفحة الإعدادات لإضافة أنظمة تسعير جديدة' as note3;

-- ============================================================================
-- نهاية السكريبت
-- End of script
-- ============================================================================
