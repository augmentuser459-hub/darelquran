-- ============================================================================
-- إعادة هيكلة أنظمة التسعير - فصلها عن الدول
-- Restructure Pricing Plans - Separate from Countries
-- ============================================================================

-- الخطوة 1: جعل country_id اختياري (nullable)
ALTER TABLE pricing_plans 
ALTER COLUMN country_id DROP NOT NULL;

-- الخطوة 2: حذف جميع الخطط القديمة
DELETE FROM pricing_plans;

-- الخطوة 3: إضافة الخطط الثلاث العامة (بدون ربط بدولة)
INSERT INTO pricing_plans (
    country_id, 
    sessions_per_week, 
    monthly_price, 
    plan_name_ar, 
    plan_name_en, 
    description, 
    is_active, 
    is_default
)
VALUES 
    (NULL, 2, 200.00, 'خطة حصتين أسبوعياً', '2 Sessions per Week', 'حصتان في الأسبوع - مناسبة للمبتدئين', true, false),
    (NULL, 3, 280.00, 'خطة ثلاث حصص أسبوعياً', '3 Sessions per Week', 'ثلاث حصص في الأسبوع - مناسبة للمتوسطين', true, true),
    (NULL, 4, 350.00, 'خطة أربع حصص أسبوعياً', '4 Sessions per Week', 'أربع حصص في الأسبوع - مناسبة للمتقدمين', true, false);

-- الخطوة 4: تعديل القيد الفريد ليسمح بخطط عامة
ALTER TABLE pricing_plans 
DROP CONSTRAINT IF EXISTS pricing_plans_country_id_sessions_per_week_key;

-- إضافة قيد جديد: إما country_id موجود أو sessions_per_week فريد للخطط العامة
CREATE UNIQUE INDEX pricing_plans_unique_sessions 
ON pricing_plans (sessions_per_week) 
WHERE country_id IS NULL;

-- عرض الخطط المتاحة
SELECT 
    CASE 
        WHEN country_id IS NULL THEN 'عام (جميع الدول)'
        ELSE (SELECT name_ar FROM countries WHERE id = country_id)
    END as "النطاق",
    plan_name_ar as "اسم الخطة",
    sessions_per_week as "عدد الحصص",
    monthly_price as "السعر",
    is_active as "نشط",
    is_default as "افتراضي"
FROM pricing_plans
ORDER BY sessions_per_week;

-- ملاحظة: الآن السعر ثابت بالريال السعودي
-- العملة ستأتي من جدول الدول حسب اختيار الطالب
