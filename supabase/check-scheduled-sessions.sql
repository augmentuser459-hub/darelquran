-- فحص الجدول الأسبوعي

-- 1. عدد الحصص المجدولة النشطة
SELECT 
    'عدد الحصص في الجدول الأسبوعي:' as description,
    COUNT(*) as count
FROM scheduled_sessions
WHERE is_active = true;

-- 2. الحصص المجدولة حسب اليوم
SELECT 
    CASE day_of_week
        WHEN 0 THEN 'الأحد'
        WHEN 1 THEN 'الاثنين'
        WHEN 2 THEN 'الثلاثاء'
        WHEN 3 THEN 'الأربعاء'
        WHEN 4 THEN 'الخميس'
        WHEN 5 THEN 'الجمعة'
        WHEN 6 THEN 'السبت'
    END as day_name,
    COUNT(*) as sessions_per_day
FROM scheduled_sessions
WHERE is_active = true
GROUP BY day_of_week
ORDER BY day_of_week;

-- 3. الطلاب وعدد حصصهم الأسبوعية
SELECT 
    s.name as student_name,
    COUNT(ss.id) as weekly_sessions,
    COUNT(ss.id) * 4 as expected_monthly_sessions
FROM students s
LEFT JOIN scheduled_sessions ss ON s.id = ss.student_id AND ss.is_active = true
GROUP BY s.id, s.name
HAVING COUNT(ss.id) > 0
ORDER BY weekly_sessions DESC;

-- 4. إجمالي الحصص المتوقعة شهرياً
SELECT 
    'الحصص المتوقعة شهرياً (من الجدول):' as description,
    COUNT(*) * 4 as expected_monthly_sessions
FROM scheduled_sessions
WHERE is_active = true;

-- 5. الحصص الفعلية المولدة
SELECT 
    'الحصص الفعلية المولدة:' as description,
    COUNT(*) as actual_sessions
FROM sessions
WHERE scheduled_session_id IS NOT NULL
AND session_date >= DATE_TRUNC('month', CURRENT_DATE);

-- 6. فحص إذا كان هناك جدول مكرر
SELECT 
    student_id,
    day_of_week,
    session_time,
    COUNT(*) as duplicate_count
FROM scheduled_sessions
WHERE is_active = true
GROUP BY student_id, day_of_week, session_time
HAVING COUNT(*) > 1;
