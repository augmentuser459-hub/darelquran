-- فحص شامل للتكرارات في قاعدة البيانات

-- 1. فحص التكرارات في جدول sessions
SELECT 
    '=== تكرارات في جدول sessions ===' as check_type;

SELECT 
    student_id,
    session_date,
    session_time,
    COUNT(*) as count,
    array_agg(id) as session_ids
FROM sessions
GROUP BY student_id, session_date, session_time
HAVING COUNT(*) > 1
ORDER BY count DESC, session_date DESC;

-- 2. إحصائيات عامة عن الحصص
SELECT 
    '=== إحصائيات الحصص ===' as stats_type;

SELECT 
    'إجمالي الحصص' as description,
    COUNT(*) as count
FROM sessions
UNION ALL
SELECT 
    'حصص مكررة' as description,
    COUNT(*) as count
FROM (
    SELECT student_id, session_date, session_time
    FROM sessions
    GROUP BY student_id, session_date, session_time
    HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
    'حصص فريدة' as description,
    COUNT(DISTINCT (student_id, session_date, session_time)) as count
FROM sessions;

-- 3. فحص الحصص حسب النوع
SELECT 
    '=== الحصص حسب النوع ===' as type_breakdown;

SELECT 
    CASE 
        WHEN is_makeup = true THEN 'تعويضية'
        WHEN scheduled_session_id IS NOT NULL THEN 'عادية (من الجدول)'
        ELSE 'إضافية (يدوية)'
    END as session_type,
    COUNT(*) as count
FROM sessions
GROUP BY 
    CASE 
        WHEN is_makeup = true THEN 'تعويضية'
        WHEN scheduled_session_id IS NOT NULL THEN 'عادية (من الجدول)'
        ELSE 'إضافية (يدوية)'
    END
ORDER BY count DESC;

-- 4. فحص الحصص حسب الطالب
SELECT 
    '=== أكثر 10 طلاب لديهم حصص ===' as top_students;

SELECT 
    s.name as student_name,
    COUNT(ses.id) as total_sessions,
    COUNT(CASE WHEN ses.is_makeup = true THEN 1 END) as makeup_sessions,
    COUNT(CASE WHEN ses.scheduled_session_id IS NOT NULL AND ses.is_makeup = false THEN 1 END) as regular_sessions,
    COUNT(CASE WHEN ses.scheduled_session_id IS NULL AND ses.is_makeup = false THEN 1 END) as extra_sessions
FROM students s
LEFT JOIN sessions ses ON s.id = ses.student_id
GROUP BY s.id, s.name
ORDER BY total_sessions DESC
LIMIT 10;

-- 5. فحص التكرارات في scheduled_sessions
SELECT 
    '=== تكرارات في الجدول الأسبوعي ===' as scheduled_check;

SELECT 
    student_id,
    teacher_id,
    day_of_week,
    session_time,
    COUNT(*) as count,
    array_agg(id) as scheduled_ids
FROM scheduled_sessions
WHERE is_active = true
GROUP BY student_id, teacher_id, day_of_week, session_time
HAVING COUNT(*) > 1;

-- 6. فحص الحصص المولدة من نفس scheduled_session
SELECT 
    '=== الحصص المولدة من نفس الجدول ===' as generated_check;

SELECT 
    scheduled_session_id,
    COUNT(*) as sessions_generated,
    MIN(session_date) as first_date,
    MAX(session_date) as last_date
FROM sessions
WHERE scheduled_session_id IS NOT NULL
GROUP BY scheduled_session_id
HAVING COUNT(*) > 50  -- أكثر من 50 حصة من نفس الجدول (مشبوه)
ORDER BY sessions_generated DESC;

-- 7. فحص الحصص في نطاق زمني محدد
SELECT 
    '=== الحصص في آخر 30 يوم ===' as recent_sessions;

SELECT 
    session_date,
    COUNT(*) as sessions_count,
    COUNT(DISTINCT student_id) as unique_students
FROM sessions
WHERE session_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY session_date
ORDER BY session_date DESC;
