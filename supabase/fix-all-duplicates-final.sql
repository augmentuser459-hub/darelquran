-- حل نهائي لجميع التكرارات

-- الخطوة 1: عرض التكرارات الحالية
SELECT 
    'قبل الحذف - عدد الحصص المكررة:' as message,
    COUNT(*) as duplicate_count
FROM (
    SELECT student_id, session_date, session_time
    FROM sessions
    GROUP BY student_id, session_date, session_time
    HAVING COUNT(*) > 1
) duplicates;

-- الخطوة 2: حذف جميع التكرارات (الاحتفاظ بأقدم حصة)
DELETE FROM sessions
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY student_id, session_date, session_time 
                ORDER BY created_at ASC, id ASC
            ) as rn
        FROM sessions
    ) t
    WHERE rn > 1
);

-- الخطوة 3: التحقق من النتيجة
SELECT 
    'بعد الحذف - عدد الحصص المكررة:' as message,
    COUNT(*) as duplicate_count
FROM (
    SELECT student_id, session_date, session_time
    FROM sessions
    GROUP BY student_id, session_date, session_time
    HAVING COUNT(*) > 1
) duplicates;

-- الخطوة 4: إحصائيات نهائية
SELECT 
    'إجمالي الحصص بعد التنظيف:' as message,
    COUNT(*) as total_sessions
FROM sessions;

-- الخطوة 5: إضافة قيد فريد لمنع التكرار في المستقبل
-- (سيفشل إذا كان القيد موجوداً بالفعل - هذا طبيعي)
DO $$ 
BEGIN
    ALTER TABLE sessions 
    ADD CONSTRAINT unique_session_per_student_datetime 
    UNIQUE (student_id, session_date, session_time);
    
    RAISE NOTICE 'تم إضافة القيد الفريد بنجاح';
EXCEPTION 
    WHEN duplicate_table THEN 
        RAISE NOTICE 'القيد الفريد موجود بالفعل';
    WHEN others THEN
        RAISE NOTICE 'خطأ في إضافة القيد: %', SQLERRM;
END $$;

-- الخطوة 6: عرض ملخص نهائي
SELECT 
    'الحصص حسب النوع:' as summary;

SELECT 
    CASE 
        WHEN is_makeup = true THEN '🔄 تعويضية'
        WHEN scheduled_session_id IS NOT NULL THEN '📅 عادية'
        ELSE '➕ إضافية'
    END as session_type,
    COUNT(*) as count
FROM sessions
GROUP BY 
    CASE 
        WHEN is_makeup = true THEN '🔄 تعويضية'
        WHEN scheduled_session_id IS NOT NULL THEN '📅 عادية'
        ELSE '➕ إضافية'
    END
ORDER BY count DESC;
