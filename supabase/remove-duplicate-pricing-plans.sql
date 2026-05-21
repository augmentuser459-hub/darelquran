-- ============================================================================
-- حذف خطط التسعير المكررة
-- Remove Duplicate Pricing Plans
-- ============================================================================
-- الغرض: حذف الباقات المكررة والحفاظ على باقة واحدة فقط لكل دولة وعدد حصص
-- Purpose: Remove duplicate plans and keep only one plan per country per sessions count
-- ============================================================================

DO $$
DECLARE
    deleted_count INTEGER := 0;
    country_rec RECORD;
BEGIN
    RAISE NOTICE '🔍 البحث عن الباقات المكررة...';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    -- عرض الباقات المكررة قبل الحذف
    FOR country_rec IN 
        SELECT 
            c.name_ar,
            pp.sessions_per_week,
            COUNT(*) as duplicate_count
        FROM pricing_plans pp
        JOIN countries c ON pp.country_id = c.id
        GROUP BY c.name_ar, pp.sessions_per_week, c.display_order
        HAVING COUNT(*) > 1
        ORDER BY c.display_order, pp.sessions_per_week
    LOOP
        RAISE NOTICE '⚠️  % - % حصص/أسبوع: % باقات مكررة', 
            country_rec.name_ar,
            country_rec.sessions_per_week,
            country_rec.duplicate_count;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🗑️  بدء حذف الباقات المكررة...';
    RAISE NOTICE '';
    
    -- حذف الباقات المكررة (الحفاظ على الأقدم فقط)
    WITH duplicates AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY country_id, sessions_per_week 
                ORDER BY created_at ASC, id ASC
            ) as rn
        FROM pricing_plans
    )
    DELETE FROM pricing_plans
    WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE '✅ تم حذف % باقة مكررة', deleted_count;
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📊 الباقات المتبقية:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    -- عرض الباقات المتبقية
    FOR country_rec IN 
        SELECT 
            c.name_ar,
            c.currency_symbol,
            pp.sessions_per_week,
            pp.monthly_price,
            COUNT(*) OVER (PARTITION BY c.id, pp.sessions_per_week) as count_check
        FROM pricing_plans pp
        JOIN countries c ON pp.country_id = c.id
        WHERE pp.is_active = true
        ORDER BY c.display_order, pp.sessions_per_week
    LOOP
        IF country_rec.count_check > 1 THEN
            RAISE NOTICE '⚠️  % - % حصص/أسبوع = % % (لا يزال مكرر!)', 
                country_rec.name_ar,
                country_rec.sessions_per_week,
                country_rec.monthly_price,
                country_rec.currency_symbol;
        ELSE
            RAISE NOTICE '✅ % - % حصص/أسبوع = % %', 
                country_rec.name_ar,
                country_rec.sessions_per_week,
                country_rec.monthly_price,
                country_rec.currency_symbol;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    IF deleted_count > 0 THEN
        RAISE NOTICE '✨ تم إصلاح المشكلة بنجاح!';
    ELSE
        RAISE NOTICE 'ℹ️  لا توجد باقات مكررة';
    END IF;
    
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
END $$;

-- ============================================================================
-- إضافة قيد فريد لمنع التكرار في المستقبل
-- Add unique constraint to prevent future duplicates
-- ============================================================================

DO $$
BEGIN
    -- التحقق من وجود القيد
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'unique_country_sessions_per_week'
    ) THEN
        -- إضافة القيد الفريد
        ALTER TABLE pricing_plans 
        ADD CONSTRAINT unique_country_sessions_per_week 
        UNIQUE (country_id, sessions_per_week);
        
        RAISE NOTICE '';
        RAISE NOTICE '🔒 تم إضافة قيد فريد لمنع تكرار الباقات في المستقبل';
        RAISE NOTICE '   (unique_country_sessions_per_week)';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'ℹ️  القيد الفريد موجود بالفعل';
    END IF;
END $$;

-- ============================================================================
-- التحقق النهائي
-- Final Verification
-- ============================================================================

DO $$
DECLARE
    total_plans INTEGER;
    total_countries INTEGER;
    expected_plans INTEGER;
    duplicate_check INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🔍 التحقق النهائي:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    -- عد الباقات والدول
    SELECT COUNT(*) INTO total_plans FROM pricing_plans WHERE is_active = true;
    SELECT COUNT(*) INTO total_countries FROM countries WHERE is_active = true;
    
    -- الباقات المتوقعة (كل دولة لها 5 باقات: 1، 2، 3، 4، 5 حصص/أسبوع)
    expected_plans := total_countries * 5;
    
    -- البحث عن أي تكرار متبقي
    SELECT COUNT(*) INTO duplicate_check
    FROM (
        SELECT country_id, sessions_per_week, COUNT(*) as cnt
        FROM pricing_plans
        WHERE is_active = true
        GROUP BY country_id, sessions_per_week
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE '📊 الإحصائيات:';
    RAISE NOTICE '   • عدد الدول النشطة: %', total_countries;
    RAISE NOTICE '   • عدد الباقات الحالية: %', total_plans;
    RAISE NOTICE '   • عدد الباقات المتوقعة: %', expected_plans;
    RAISE NOTICE '   • باقات مكررة متبقية: %', duplicate_check;
    RAISE NOTICE '';
    
    IF duplicate_check = 0 THEN
        RAISE NOTICE '✅ ممتاز! لا توجد باقات مكررة';
    ELSE
        RAISE NOTICE '⚠️  تحذير: لا تزال هناك % باقات مكررة!', duplicate_check;
        RAISE NOTICE '   يُرجى تشغيل السكريبت مرة أخرى';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✨ اكتمل التنظيف!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
END $$;
