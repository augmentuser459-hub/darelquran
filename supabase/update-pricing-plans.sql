-- ============================================================================
-- تحديث أنظمة التسعير - 3 خطط فقط
-- Update Pricing Plans - 3 Plans Only
-- ============================================================================

-- حذف جميع خطط الـ 5 حصص
DELETE FROM pricing_plans WHERE sessions_per_week = 5;

-- حذف جميع خطط الـ 1 حصة (إن وجدت)
DELETE FROM pricing_plans WHERE sessions_per_week = 1;

-- تحديث الخطط الموجودة للسعودية فقط (يمكن تطبيقها على دول أخرى لاحقاً)
DO $$
DECLARE
    saudi_id UUID;
BEGIN
    -- الحصول على معرف السعودية
    SELECT id INTO saudi_id FROM countries WHERE name = 'السعودية';

    IF saudi_id IS NOT NULL THEN
        -- حذف جميع الخطط القديمة للسعودية
        DELETE FROM pricing_plans WHERE country_id = saudi_id;
        
        -- إضافة الخطط الثلاث الجديدة
        INSERT INTO pricing_plans (country_id, sessions_per_week, monthly_price, plan_name_ar, plan_name_en, description, is_active, is_default)
        VALUES 
            (saudi_id, 2, 200.00, 'خطة حصتين أسبوعياً', '2 Sessions per Week', 'حصتان في الأسبوع - مناسبة للمبتدئين', true, false),
            (saudi_id, 3, 280.00, 'خطة ثلاث حصص أسبوعياً', '3 Sessions per Week', 'ثلاث حصص في الأسبوع - مناسبة للمتوسطين', true, true),
            (saudi_id, 4, 350.00, 'خطة أربع حصص أسبوعياً', '4 Sessions per Week', 'أربع حصص في الأسبوع - مناسبة للمتقدمين', true, false);
    END IF;
END $$;

-- عرض الخطط المتاحة
SELECT 
    c.name_ar as "الدولة",
    p.plan_name_ar as "اسم الخطة",
    p.sessions_per_week as "عدد الحصص",
    p.monthly_price as "السعر الشهري",
    c.currency_symbol as "العملة",
    p.is_active as "نشط",
    p.is_default as "افتراضي"
FROM pricing_plans p
JOIN countries c ON p.country_id = c.id
WHERE c.name = 'السعودية'
ORDER BY p.sessions_per_week;
