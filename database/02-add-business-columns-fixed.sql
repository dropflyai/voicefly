-- Step 2 FIXED: Add Business Tier and Columns
-- This version handles the missing 'business' tier properly

-- Add settings column for business configuration
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Add owner information columns for login compatibility
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_first_name VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_last_name VARCHAR(100);

-- Add Vapi integration column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS vapi_assistant_id VARCHAR(255);

-- FIXED: Add 'business' tier to subscription_tier enum
-- First, create the new enum type with all values
CREATE TYPE subscription_tier_new AS ENUM ('starter', 'professional', 'business', 'enterprise');

-- Update the table to use the new enum (this will convert existing data)
ALTER TABLE businesses 
  ALTER COLUMN subscription_tier DROP DEFAULT;

ALTER TABLE businesses 
  ALTER COLUMN subscription_tier TYPE subscription_tier_new 
  USING subscription_tier::text::subscription_tier_new;

ALTER TABLE businesses 
  ALTER COLUMN subscription_tier SET DEFAULT 'starter'::subscription_tier_new;

-- Drop the old enum type and rename the new one
DROP TYPE subscription_tier;
ALTER TYPE subscription_tier_new RENAME TO subscription_tier;

-- Add indexes for business queries
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_tier ON businesses(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_email ON businesses(owner_email);
CREATE INDEX IF NOT EXISTS idx_businesses_vapi_assistant ON businesses(vapi_assistant_id);