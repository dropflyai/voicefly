-- Step 2: Add Essential Columns to Businesses Table
-- These support the enhanced onboarding and tier features

-- Add settings column for business configuration
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Add owner information columns for login compatibility
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_first_name VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_last_name VARCHAR(100);

-- Add Vapi integration column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS vapi_assistant_id VARCHAR(255);

-- Update the subscription_tier enum to include 'business' tier
DO $$ 
BEGIN
    -- Check if 'business' value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'subscription_tier' AND e.enumlabel = 'business'
    ) THEN
        ALTER TYPE subscription_tier ADD VALUE 'business';
    END IF;
EXCEPTION
    WHEN others THEN
        -- If we get an error, it might be because the value already exists
        RAISE NOTICE 'Could not add business tier to enum, it may already exist';
END $$;

-- Add indexes for business queries
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_tier ON businesses(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_email ON businesses(owner_email);
CREATE INDEX IF NOT EXISTS idx_businesses_vapi_assistant ON businesses(vapi_assistant_id);