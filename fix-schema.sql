-- Fix VoiceFly Database Schema - Add Missing Columns
-- Run this in Supabase SQL Editor

-- Add missing columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS parent_business_id UUID REFERENCES businesses(id);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_location BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS webhook_token VARCHAR(255) DEFAULT encode(gen_random_bytes(32), 'hex');
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS n8n_workflow_id VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS vapi_assistant_id VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS vapi_phone_number_id VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}';

-- Add missing columns to other critical tables if needed
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS voice_call_id VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_source VARCHAR(50) DEFAULT 'web';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE customers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Schema fix complete! Missing columns added.';
END $$;
