-- حذف الحصص المكررة - احتفظ بأقدم حصة فقط

DELETE FROM sessions
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY student_id, session_date, session_time 
                ORDER BY created_at ASC
            ) as rn
        FROM sessions
    ) t
    WHERE rn > 1
);

-- عرض عدد الحصص المحذوفة
SELECT 'تم حذف الحصص المكررة بنجاح' as message;

-- التحقق من عدم وجود تكرارات
SELECT 
    student_id,
    session_date,
    session_time,
    COUNT(*) as count
FROM sessions
GROUP BY student_id, session_date, session_time
HAVING COUNT(*) > 1;
