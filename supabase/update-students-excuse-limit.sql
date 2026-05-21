-- ============================================================================
-- تحديث حد الاعتذارات لجميع الطلاب
-- Update Excuse Limit for All Students
-- ============================================================================
-- الغرض: تحديث max_excuses_per_month لجميع الطلاب إلى القيمة الجديدة
-- Purpose: Update max_excuses_per_month for all students to the new value
-- ============================================================================

DO $$
DECLARE
    new_excuse_limit INTEGER := 5; -- القيمة الجديدة
    updated_count INTEGER;
    student_rec RECORD;
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🔄 تحديث حد الاعتذارات الشهرية للطلاب';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '📋 القيمة الجديدة: % اعتذارات شهرياً', new_excuse_limit;
    RAISE NOTICE '';
    
    -- عرض الطلاب قبل التحديث
    RAISE NOTICE '📊 الطلاب قبل التحديث:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    FOR student_rec IN 
        SELECT 
            name,
            max_excuses_per_month,
            excuse_balance
        FROM students
        WHERE status = 'active'
        ORDER BY name
    LOOP
        RAISE NOTICE '   • %: max_excuses = %, excuse_balance = %', 
            student_rec.name,
            student_rec.max_excuses_per_month,
            student_rec.excuse_balance;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔄 جاري التحديث...';
    RAISE NOTICE '';
    
    -- تحديث جميع الطلاب
    UPDATE students
    SET 
        max_excuses_per_month = new_excuse_limit,
        updated_at = NOW()
    WHERE status = 'active';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ تم تحديث % طالب', updated_count;
    RAISE NOTICE '';
    
    -- عرض الطلاب بعد التحديث
    RAISE NOTICE '📊 الطلاب بعد التحديث:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    FOR student_rec IN 
        SELECT 
            name,
            max_excuses_per_month,
            excuse_balance
        FROM students
        WHERE status = 'active'
        ORDER BY name
    LOOP
        RAISE NOTICE '   • %: max_excuses = %, excuse_balance = %', 
            student_rec.name,
            student_rec.max_excuses_per_month,
            student_rec.excuse_balance;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✨ اكتمل التحديث بنجاح!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '📝 ملاحظة: يمكنك تغيير القيمة في السطر 10 من هذا الملف';
    RAISE NOTICE '   new_excuse_limit := 5; -- غير الرقم حسب الحاجة';
    RAISE NOTICE '';
    
END $$;

-- ============================================================================
-- تحديث القيمة الافتراضية للطلاب الجدد
-- Update Default Value for New Students
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🔧 تحديث القيمة الافتراضية في الجدول';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    
    -- تحديث القيمة الافتراضية في الجدول
    ALTER TABLE students 
    ALTER COLUMN max_excuses_per_month SET DEFAULT 5;
    
    RAISE NOTICE '✅ تم تحديث القيمة الافتراضية إلى 5';
    RAISE NOTICE '   الطلاب الجدد سيحصلون تلقائياً على 5 اعتذارات شهرياً';
    RAISE NOTICE '';
    
    -- تحديث excuse_balance أيضاً
    ALTER TABLE students 
    ALTER COLUMN excuse_balance SET DEFAULT 5;
    
    RAISE NOTICE '✅ تم تحديث excuse_balance الافتراضي إلى 5';
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✨ اكتمل تحديث القيم الافتراضية!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
END $$;
