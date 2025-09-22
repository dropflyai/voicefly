-- Phone Numbers Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    vapi_phone_number_id VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50) NOT NULL,
    phone_number_type VARCHAR(20) DEFAULT 'new', -- 'new' or 'existing'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenancy
CREATE POLICY "Users can view their business phone numbers" ON phone_numbers
    FOR SELECT USING (true); -- Allow read for now, can restrict later

CREATE POLICY "Service key has full access to phone numbers" ON phone_numbers
    FOR ALL USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS phone_numbers_business_id_idx ON phone_numbers(business_id);
CREATE INDEX IF NOT EXISTS phone_numbers_vapi_id_idx ON phone_numbers(vapi_phone_number_id);

-- Insert demo phone number for testing
INSERT INTO phone_numbers (business_id, vapi_phone_number_id, phone_number, phone_number_type)
SELECT 
    id as business_id,
    'demo-vapi-phone-123' as vapi_phone_number_id,
    '+1-555-SPARKLE' as phone_number,
    'new' as phone_number_type
FROM businesses 
WHERE name = 'Sparkle Nails Demo'
ON CONFLICT (vapi_phone_number_id) DO NOTHING;