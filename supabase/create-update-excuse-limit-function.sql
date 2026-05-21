-- ============================================================================
-- دالة لتحديث القيمة الافتراضية لحد الاعتذارات
-- Function to Update Default Excuse Limit
-- ============================================================================
-- الغرض: تحديث القيمة الافتراضية في جدول students للطلاب الجدد
-- Purpose: Update default value in students table for new students
-- ============================================================================

-- Create or replace the function
CREATE OR REPLACE FUNCTION update_students_default_excuse_limit(new_limit INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update the default value for max_excuses_per_month
    EXECUTE format('ALTER TABLE students ALTER COLUMN max_excuses_per_month SET DEFAULT %s', new_limit);
    
    -- Update the default value for excuse_balance (optional)
    EXECUTE format('ALTER TABLE students ALTER COLUMN excuse_balance SET DEFAULT %s', new_limit);
    
    RETURN format('تم تحديث القيمة الافتراضية إلى %s', new_limit);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_students_default_excuse_limit(INTEGER) TO anon, authenticated;

-- Test the function
DO $$
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ تم إنشاء دالة update_students_default_excuse_limit';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '📝 الاستخدام:';
    RAISE NOTICE '   SELECT update_students_default_excuse_limit(5);';
    RAISE NOTICE '';
    RAISE NOTICE '💡 هذه الدالة تُستدعى تلقائياً من صفحة الإعدادات';
    RAISE NOTICE '   عند تغيير "عدد الاعتذارات المسموحة شهرياً"';
    RAISE NOTICE '';
END $$;
