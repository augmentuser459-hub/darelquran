-- ============================================================================
-- إضافة بيانات تجريبية للدول وأنظمة التسعير
-- Sample Data for Countries and Pricing Plans
-- ============================================================================

-- حذف البيانات القديمة إن وجدت (اختياري)
-- DELETE FROM pricing_plans;
-- DELETE FROM countries;

-- ============================================================================
-- إضافة الدول
-- ============================================================================

-- السعودية
INSERT INTO countries (name, name_ar, name_en, currency_code, currency_symbol, currency_name_ar, currency_name_en, country_code, phone_code, is_active, display_order)
VALUES ('السعودية', 'السعودية', 'Saudi Arabia', 'SAR', 'ر.س', 'ريال سعودي', 'Saudi Riyal', 'SA', '+966', true, 1)
ON CONFLICT (name) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    currency_code = EXCLUDED.currency_code,
    currency_symbol = EXCLUDED.currency_symbol,
    is_active = EXCLUDED.is_active;

-- مصر
INSERT INTO countries (name, name_ar, name_en, currency_code, currency_symbol, currency_name_ar, currency_name_en, country_code, phone_code, is_active, display_order)
VALUES ('مصر', 'مصر', 'Egypt', 'EGP', 'ج.م', 'جنيه مصري', 'Egyptian Pound', 'EG', '+20', true, 2)
ON CONFLICT (name) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    currency_code = EXCLUDED.currency_code,
    currency_symbol = EXCLUDED.currency_symbol,
    is_active = EXCLUDED.is_active;

-- الإمارات
INSERT INTO countries (name, name_ar, name_en, currency_code, currency_symbol, currency_name_ar, currency_name_en, country_code, phone_code, is_active, display_order)
VALUES ('الإمارات', 'الإمارات', 'UAE', 'AED', 'د.إ', 'درهم إماراتي', 'UAE Dirham', 'AE', '+971', true, 3)
ON CONFLICT (name) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    currency_code = EXCLUDED.currency_code,
    currency_symbol = EXCLUDED.currency_symbol,
    is_active = EXCLUDED.is_active;

-- الكويت
INSERT INTO countries (name, name_ar, name_en, currency_code, currency_symbol, currency_name_ar, currency_name_en, country_code, phone_code, is_active, display_order)
VALUES ('الكويت', 'الكويت', 'Kuwait', 'KWD', 'د.ك', 'دينار كويتي', 'Kuwaiti Dinar', 'KW', '+965', true, 4)
ON CONFLICT (name) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    currency_code = EXCLUDED.currency_code,
    currency_symbol = EXCLUDED.currency_symbol,
    is_active = EXCLUDED.is_active;

-- ============================================================================
-- إضافة أنظمة التسعير
-- ============================================================================

-- الحصول على معرف السعودية
DO $$
DECLARE
    saudi_id UUID;
    egypt_id UUID;
    uae_id UUID;
    kuwait_id UUID;
BEGIN
    -- الحصول على معرفات الدول
    SELECT id INTO saudi_id FROM countries WHERE name = 'السعودية';
    SELECT id INTO egypt_id FROM countries WHERE name = 'مصر';
    SELECT id INTO uae_id FROM countries WHERE name = 'الإمارات';
    SELECT id INTO kuwait_id FROM countries WHERE name = 'الكويت';

    -- أنظمة التسعير للسعودية
    IF saudi_id IS NOT NULL THEN
        INSERT INTO pricing_plans (country_id, sessions_per_week, monthly_price, plan_name_ar, plan_name_en, description, is_active)
        VALUES 
            (saudi_id, 2, 200.00, 'خطة حصتين أسبوعياً', '2 Sessions per Week', 'حصتان في الأسبوع - مناسبة للمبتدئين', true),
            (saudi_id, 3, 280.00, 'خطة ثلاث حصص أسبوعياً', '3 Sessions per Week', 'ثلاث حصص في الأسبوع - مناسبة للمتوسطين', true),
            (saudi_id, 4, 350.00, 'خطة أربع حصص أسبوعياً', '4 Sessions per Week', 'أربع حصص في الأسبوع - مناسبة للمتقدمين', true),
            (saudi_id, 5, 400.00, 'خطة خمس حصص أسبوعياً', '5 Sessions per Week', 'خمس حصص في الأسبوع - خطة مكثفة', true)
        ON CONFLICT (country_id, sessions_per_week) DO UPDATE SET
            monthly_price = EXCLUDED.monthly_price,
            plan_name_ar = EXCLUDED.plan_name_ar,
            description = EXCLUDED.description,
            is_active = EXCLUDED.is_active;
    END IF;

    -- أنظمة التسعير لمصر
    IF egypt_id IS NOT NULL THEN
        INSERT INTO pricing_plans (country_id, sessions_per_week, monthly_price, plan_name_ar, plan_name_en, description, is_active)
        VALUES 
            (egypt_id, 2, 400.00, 'خطة حصتين أسبوعياً', '2 Sessions per Week', 'حصتان في الأسبوع - مناسبة للمبتدئين', true),
            (egypt_id, 3, 550.00, 'خطة ثلاث حصص أسبوعياً', '3 Sessions per Week', 'ثلاث حصص في الأسبوع - مناسبة للمتوسطين', true),
            (egypt_id, 4, 700.00, 'خطة أربع حصص أسبوعياً', '4 Sessions per Week', 'أربع حصص في الأسبوع - مناسبة للمتقدمين', true),
            (egypt_id, 5, 800.00, 'خطة خمس حصص أسبوعياً', '5 Sessions per Week', 'خمس حصص في الأسبوع - خطة مكثفة', true)
        ON CONFLICT (country_id, sessions_per_week) DO UPDATE SET
            monthly_price = EXCLUDED.monthly_price,
            plan_name_ar = EXCLUDED.plan_name_ar,
            description = EXCLUDED.description,
            is_active = EXCLUDED.is_active;
    END IF;

    -- أنظمة التسعير للإمارات
    IF uae_id IS NOT NULL THEN
        INSERT INTO pricing_plans (country_id, sessions_per_week, monthly_price, plan_name_ar, plan_name_en, description, is_active)
        VALUES 
            (uae_id, 2, 250.00, 'خطة حصتين أسبوعياً', '2 Sessions per Week', 'حصتان في الأسبوع - مناسبة للمبتدئين', true),
            (uae_id, 3, 350.00, 'خطة ثلاث حصص أسبوعياً', '3 Sessions per Week', 'ثلاث حصص في الأسبوع - مناسبة للمتوسطين', true),
            (uae_id, 4, 450.00, 'خطة أربع حصص أسبوعياً', '4 Sessions per Week', 'أربع حصص في الأسبوع - مناسبة للمتقدمين', true),
            (uae_id, 5, 500.00, 'خطة خمس حصص أسبوعياً', '5 Sessions per Week', 'خمس حصص في الأسبوع - خطة مكثفة', true)
        ON CONFLICT (country_id, sessions_per_week) DO UPDATE SET
            monthly_price = EXCLUDED.monthly_price,
            plan_name_ar = EXCLUDED.plan_name_ar,
            description = EXCLUDED.description,
            is_active = EXCLUDED.is_active;
    END IF;

    -- أنظمة التسعير للكويت
    IF kuwait_id IS NOT NULL THEN
        INSERT INTO pricing_plans (country_id, sessions_per_week, monthly_price, plan_name_ar, plan_name_en, description, is_active)
        VALUES 
            (kuwait_id, 2, 15.00, 'خطة حصتين أسبوعياً', '2 Sessions per Week', 'حصتان في الأسبوع - مناسبة للمبتدئين', true),
            (kuwait_id, 3, 20.00, 'خطة ثلاث حصص أسبوعياً', '3 Sessions per Week', 'ثلاث حصص في الأسبوع - مناسبة للمتوسطين', true),
            (kuwait_id, 4, 25.00, 'خطة أربع حصص أسبوعياً', '4 Sessions per Week', 'أربع حصص في الأسبوع - مناسبة للمتقدمين', true),
            (kuwait_id, 5, 30.00, 'خطة خمس حصص أسبوعياً', '5 Sessions per Week', 'خمس حصص في الأسبوع - خطة مكثفة', true)
        ON CONFLICT (country_id, sessions_per_week) DO UPDATE SET
            monthly_price = EXCLUDED.monthly_price,
            plan_name_ar = EXCLUDED.plan_name_ar,
            description = EXCLUDED.description,
            is_active = EXCLUDED.is_active;
    END IF;
END $$;

-- ============================================================================
-- التحقق من البيانات المضافة
-- ============================================================================

SELECT 
    c.name_ar as "الدولة",
    c.currency_symbol as "العملة",
    COUNT(p.id) as "عدد الخطط"
FROM countries c
LEFT JOIN pricing_plans p ON c.id = p.country_id
WHERE c.is_active = true
GROUP BY c.name_ar, c.currency_symbol, c.display_order
ORDER BY c.display_order;
