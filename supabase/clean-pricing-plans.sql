-- ============================================================================
-- تنظيف أنظمة التسعير - الإبقاء على خطط السعودية فقط
-- Clean Pricing Plans - Keep Saudi Arabia Plans Only
-- ============================================================================

-- حذف جميع أنظمة التسعير
DELETE FROM pricing_plans;

-- إضافة الخطط الثلاث للسعودية فقط
DO $$
DECLARE
    saudi_id UUID;
BEGIN
    -- الحصول على معرف السعودية
    SELECT id INTO saudi_id FROM countries WHERE name = 'السعودية';

    IF saudi_id IS NOT NULL THEN
        -- إضافة الخطط الثلاث
        INSERT INTO pricing_plans (country_id, sessions_per_week, monthly_price, plan_name_ar, plan_name_en, description, is_active, is_default)
        VALUES 
            (saudi_id, 2, 200.00, 'خطة حصتين أسبوعياً', '2 Sessions per Week', 'حصتان في الأسبوع - مناسبة للمبتدئين', true, false),
            (saudi_id, 3, 280.00, 'خطة ثلاث حصص أسبوعياً', '3 Sessions per Week', 'ثلاث حصص في الأسبوع - مناسبة للمتوسطين', true, true),
            (saudi_id, 4, 350.00, 'خطة أربع حصص أسبوعياً', '4 Sessions per Week', 'أربع حصص في الأسبوع - مناسبة للمتقدمين', true, false);
        
        RAISE NOTICE 'تم إضافة 3 خطط للسعودية بنجاح';
    ELSE
        RAISE NOTICE 'لم يتم العثور على السعودية في جدول الدول';
    END IF;
END $$;

-- عرض جميع الخطط المتاحة
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
ORDER BY c.name_ar, p.sessions_per_week;

-- عرض عدد الخطط لكل دولة
SELECT 
    c.name_ar as "الدولة",
    COUNT(p.id) as "عدد الخطط"
FROM countries c
LEFT JOIN pricing_plans p ON c.id = p.country_id
GROUP BY c.name_ar
ORDER BY c.name_ar;
