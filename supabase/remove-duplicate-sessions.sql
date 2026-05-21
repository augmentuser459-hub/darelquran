-- Remove duplicate sessions
-- This script will keep only one session per student per date/time

-- First, let's see the duplicates
SELECT 
    student_id,
    session_date,
    session_time,
    COUNT(*) as count
FROM sessions
GROUP BY student_id, session_date, session_time
HAVING COUNT(*) > 1
ORDER BY session_date DESC, session_time;

-- Delete duplicates, keeping only the oldest record (first created)
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

-- Verify no more duplicates
SELECT 
    student_id,
    session_date,
    session_time,
    COUNT(*) as count
FROM sessions
GROUP BY student_id, session_date, session_time
HAVING COUNT(*) > 1;
