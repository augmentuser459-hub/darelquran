-- ============================================================================
-- Fix duplicate sessions and improve performance
-- ============================================================================

-- 1. Remove Duplicate Sessions (keep the first created one)
-- Using ROW_NUMBER window function to identify duplicates for the same student on the same date and time.
DELETE FROM sessions
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY student_id, session_date, session_time 
                   ORDER BY created_at ASC
               ) as rn
        FROM sessions
    ) t
    WHERE t.rn > 1
);

-- 2. Add Unique Constraint to prevent future duplicates
-- A student cannot have multiple sessions at the same date and time unless it's a specific edge-case (which we can control, but generally it's one session per time slot).
ALTER TABLE sessions 
DROP CONSTRAINT IF EXISTS unique_student_session_time;

ALTER TABLE sessions
ADD CONSTRAINT unique_student_session_time UNIQUE (student_id, session_date, session_time);

-- 3. Add Performance Indexes
-- These indexes will heavily speed up the queries used by the frontend filters.
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Optional: Combined index for common filtering patterns (date + status, date + student)
CREATE INDEX IF NOT EXISTS idx_sessions_date_status ON sessions(session_date, status);
