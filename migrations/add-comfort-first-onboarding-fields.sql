-- Migration for Comfort-First Onboarding Support
-- Date: September 4, 2025
-- Purpose: Add fields to support phone forwarding strategy, payment authorization, and rapid setup

-- Add new fields to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS existing_business_phone TEXT,
ADD COLUMN IF NOT EXISTS vapi_phone_id TEXT,
ADD COLUMN IF NOT EXISTS assistant_type TEXT CHECK (assistant_type IN ('shared', 'custom')) DEFAULT 'shared',
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS phone_forwarded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS forwarding_setup_date TIMESTAMPTZ;

-- Create payment_methods table for tracking payment method details
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT NOT NULL,
    card_last_four TEXT,
    card_brand TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    is_authorized BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS payment_methods_business_id_idx ON payment_methods(business_id);
CREATE INDEX IF NOT EXISTS payment_methods_stripe_id_idx ON payment_methods(stripe_payment_method_id);

-- Enable Row Level Security on payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policy for payment_methods (businesses can only access their own payment methods)
CREATE POLICY "Businesses can only access their own payment methods" ON payment_methods
    FOR ALL USING (business_id IN (
        SELECT id FROM businesses WHERE id = business_id
    ));

-- Create phone_forwarding_history table for tracking forwarding changes
CREATE TABLE IF NOT EXISTS phone_forwarding_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('forwarded', 'unforwarded', 'updated')),
    from_number TEXT,
    to_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for phone forwarding history
CREATE INDEX IF NOT EXISTS phone_forwarding_history_business_id_idx ON phone_forwarding_history(business_id);
CREATE INDEX IF NOT EXISTS phone_forwarding_history_created_at_idx ON phone_forwarding_history(created_at);

-- Enable RLS on phone forwarding history
ALTER TABLE phone_forwarding_history ENABLE ROW LEVEL SECURITY;

-- RLS policy for phone forwarding history
CREATE POLICY "Businesses can only access their own forwarding history" ON phone_forwarding_history
    FOR ALL USING (business_id IN (
        SELECT id FROM businesses WHERE id = business_id
    ));

-- Update existing businesses to have default values for new fields
UPDATE businesses 
SET 
    assistant_type = 'shared',
    phone_forwarded = FALSE
WHERE assistant_type IS NULL OR phone_forwarded IS NULL;

-- Create function to handle payment method updates
CREATE OR REPLACE FUNCTION update_payment_method_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment method updates
CREATE TRIGGER payment_methods_updated_at_trigger
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_payment_method_timestamp();

-- Add comments for documentation
COMMENT ON COLUMN businesses.existing_business_phone IS 'The current business phone number (stored for future forwarding)';
COMMENT ON COLUMN businesses.vapi_phone_id IS 'Vapi phone number ID for API operations';
COMMENT ON COLUMN businesses.assistant_type IS 'Type of AI assistant: shared (Starter/Pro) or custom (Business)';
COMMENT ON COLUMN businesses.trial_start_date IS 'When the trial period started';
COMMENT ON COLUMN businesses.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN businesses.stripe_payment_method_id IS 'Default Stripe payment method ID';
COMMENT ON COLUMN businesses.phone_forwarded IS 'Whether business phone is forwarded to AI number';
COMMENT ON COLUMN businesses.forwarding_setup_date IS 'When phone forwarding was set up';

COMMENT ON TABLE payment_methods IS 'Stores validated payment methods for businesses';
COMMENT ON TABLE phone_forwarding_history IS 'Tracks all phone forwarding changes for audit trail';

-- Insert sample data for testing (optional - remove in production)
-- This would only run if we're in a development environment
DO $$
BEGIN
    -- Check if we're in development (you can customize this check)
    IF current_database() LIKE '%dev%' OR current_database() LIKE '%test%' THEN
        -- Create a test business record if it doesn't exist
        INSERT INTO businesses (
            id, 
            name, 
            email, 
            phone,
            existing_business_phone,
            business_type,
            plan_type,
            subscription_status,
            assistant_type,
            trial_start_date
        ) VALUES (
            '00000000-1111-2222-3333-444444444444',
            'Test Rapid Setup Salon',
            'test@rapidsalon.com',
            '+14243519999',
            '+15551234567',
            'nail_salon',
            'professional',
            'trial',
            'shared',
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;