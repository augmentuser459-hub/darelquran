-- Fix pricing_plans table constraints to allow dynamic pricing plans
-- This allows adding any number of sessions (1-20) and allows 0 prices

-- Drop existing constraints
ALTER TABLE pricing_plans 
DROP CONSTRAINT IF EXISTS pricing_plans_sessions_per_week_check;

ALTER TABLE pricing_plans 
DROP CONSTRAINT IF EXISTS pricing_plans_monthly_price_check;

-- Add new constraints with wider range
ALTER TABLE pricing_plans 
ADD CONSTRAINT pricing_plans_sessions_per_week_check 
CHECK (sessions_per_week >= 1 AND sessions_per_week <= 20);

-- Allow 0 or positive prices (0 means not set yet)
ALTER TABLE pricing_plans 
ADD CONSTRAINT pricing_plans_monthly_price_check 
CHECK (monthly_price >= 0);

-- Also make monthly_price nullable to allow NULL values
ALTER TABLE pricing_plans 
ALTER COLUMN monthly_price DROP NOT NULL;

-- Update existing records with 0 price to NULL if needed
-- UPDATE pricing_plans SET monthly_price = NULL WHERE monthly_price = 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_plans_sessions 
ON pricing_plans(sessions_per_week);

-- Success message
SELECT 'Pricing plans constraints updated successfully!' as message;
