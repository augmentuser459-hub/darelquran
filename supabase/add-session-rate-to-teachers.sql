-- Add session_rate column to teachers table
-- This will store the rate per session for each teacher

ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS session_rate DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN teachers.session_rate IS 'سعر الحصة الواحدة للمحفظ';

-- Update existing teachers with default rate (can be changed later)
UPDATE teachers 
SET session_rate = 0 
WHERE session_rate IS NULL;
