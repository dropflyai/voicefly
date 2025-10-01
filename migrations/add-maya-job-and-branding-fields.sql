-- Add Maya Job and Branding Fields to Businesses Table
-- This migration adds all the missing fields for Maya job selection and Business tier branding

-- Add Maya job selection field
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS maya_job_id varchar(100);

-- Add Business tier branding fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brand_personality varchar(20) CHECK (brand_personality IN ('professional', 'warm', 'luxury', 'casual'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_description text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS unique_selling_points jsonb DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS target_customer text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS price_range varchar(20) CHECK (price_range IN ('budget', 'mid-range', 'premium', 'luxury'));

-- Add owner name fields (collected during onboarding but not stored)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_first_name varchar(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_last_name varchar(100);

-- Add agent tracking fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS agent_id varchar(255); -- VAPI agent ID
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS agent_type varchar(50) CHECK (agent_type IN ('shared-job-specific', 'custom-business'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone_number varchar(20); -- Dedicated AI phone number

-- Create index on maya_job_id for dashboard queries
CREATE INDEX IF NOT EXISTS idx_businesses_maya_job_id ON businesses(maya_job_id);

-- Create index on subscription tier and agent type for reporting
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_agent ON businesses(subscription_tier, agent_type);

-- Add comments for documentation
COMMENT ON COLUMN businesses.maya_job_id IS 'Selected Maya job role (nail-salon-receptionist, hair-salon-coordinator, etc.)';
COMMENT ON COLUMN businesses.brand_personality IS 'Business tier brand personality for custom agent creation';
COMMENT ON COLUMN businesses.unique_selling_points IS 'JSON array of unique selling points for business';
COMMENT ON COLUMN businesses.agent_id IS 'VAPI assistant ID for this business';
COMMENT ON COLUMN businesses.agent_type IS 'Type of agent: shared-job-specific or custom-business';
COMMENT ON COLUMN businesses.phone_number IS 'Dedicated AI phone number for this business';