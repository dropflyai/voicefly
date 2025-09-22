-- Migration: Add phone_numbers table for multi-tenant phone number management
-- This allows tracking which phone number belongs to which business

-- Create phone_numbers table
CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    vapi_phone_id VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    vapi_phone_number_id VARCHAR(50), -- Vapi's internal phone number ID
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_phone_numbers_business_id ON phone_numbers(business_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_vapi_id ON phone_numbers(vapi_phone_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_active ON phone_numbers(is_active) WHERE is_active = true;

-- Add phone number to businesses table (optional - for quick reference)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS primary_phone_number VARCHAR(20);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS vapi_assistant_id VARCHAR(50);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_phone_numbers_updated_at 
    BEFORE UPDATE ON phone_numbers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO phone_numbers (business_id, vapi_phone_id, phone_number, vapi_phone_number_id) 
-- VALUES ('8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad', 'demo_phone_id', '+1234567890', 'ph_demo123');