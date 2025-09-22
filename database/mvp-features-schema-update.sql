-- ==============================================
-- MVP FEATURES SCHEMA UPDATE
-- Payment Processing + Multi-Location + Loyalty Program
-- ==============================================

-- ==============================================
-- 1. LOCATIONS (Multi-location support)
-- ==============================================
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL, -- "Downtown Location", "Mall Location"
    slug VARCHAR(255) NOT NULL, -- URL-friendly identifier per business
    
    -- Address Information
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(10) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) DEFAULT 'US',
    
    -- Contact Info (can be different per location)
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Location-specific settings
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false, -- One primary location per business
    
    -- Integration IDs (per location)
    square_location_id VARCHAR(255),
    stripe_account_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique slug per business
    UNIQUE(business_id, slug)
);

CREATE INDEX idx_locations_business ON locations(business_id);
CREATE INDEX idx_locations_active ON locations(business_id, is_active);

-- ==============================================
-- 2. PAYMENT PROCESSORS (Square + Stripe config)
-- ==============================================
CREATE TABLE payment_processors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    
    processor_type VARCHAR(20) NOT NULL, -- 'square', 'stripe'
    
    -- Processor Configuration
    is_active BOOLEAN DEFAULT false,
    is_live_mode BOOLEAN DEFAULT false, -- false = sandbox/test mode
    
    -- API Keys (encrypted in production)
    api_key_public VARCHAR(500), -- Public/publishable key
    api_key_secret VARCHAR(500), -- Secret key (should be encrypted)
    webhook_secret VARCHAR(500), -- Webhook signature verification
    
    -- Processor-specific IDs
    account_id VARCHAR(255), -- Square location ID or Stripe account ID
    application_id VARCHAR(255), -- For Square apps
    
    -- Settings
    auto_capture BOOLEAN DEFAULT true,
    allow_tips BOOLEAN DEFAULT true,
    default_tip_percentages INTEGER[] DEFAULT ARRAY[15, 18, 20, 25],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one processor type per location
    UNIQUE(location_id, processor_type)
);

CREATE INDEX idx_payment_processors_business ON payment_processors(business_id);
CREATE INDEX idx_payment_processors_location ON payment_processors(location_id);

-- ==============================================
-- 3. PAYMENTS (Enhanced payment tracking)
-- ==============================================
-- Update existing payments table with new columns
ALTER TABLE IF EXISTS payments 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id),
ADD COLUMN IF NOT EXISTS processor_type VARCHAR(20), -- 'square', 'stripe', 'cash'
ADD COLUMN IF NOT EXISTS processor_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS processor_fee_amount INTEGER DEFAULT 0, -- in cents
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS payment_method_details JSONB DEFAULT '{}', -- card brand, last 4, etc.
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS processor_webhook_data JSONB DEFAULT '{}';

-- If payments table doesn't exist, create it
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Payment amounts (in cents to avoid float precision issues)
    subtotal_amount INTEGER NOT NULL DEFAULT 0,
    tip_amount INTEGER DEFAULT 0,
    tax_amount INTEGER DEFAULT 0,
    discount_amount INTEGER DEFAULT 0,
    total_amount INTEGER NOT NULL,
    
    -- Payment processing
    processor_type VARCHAR(20) NOT NULL, -- 'square', 'stripe', 'cash'
    processor_transaction_id VARCHAR(255),
    processor_fee_amount INTEGER DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status and tracking
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, paid, failed, refunded, partially_refunded
    payment_method VARCHAR(50), -- 'card', 'cash', 'apple_pay', etc.
    payment_method_details JSONB DEFAULT '{}',
    
    -- Timestamps
    authorized_at TIMESTAMP WITH TIME ZONE,
    captured_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional data
    receipt_url TEXT,
    refund_reason TEXT,
    processor_webhook_data JSONB DEFAULT '{}',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_business ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_location ON payments(location_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_processor_id ON payments(processor_transaction_id);

-- ==============================================
-- 4. LOYALTY PROGRAM CONFIGURATION
-- ==============================================
CREATE TABLE loyalty_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Program Settings
    is_active BOOLEAN DEFAULT true,
    program_name VARCHAR(255) DEFAULT 'Loyalty Rewards',
    
    -- Points Configuration
    points_per_dollar INTEGER DEFAULT 1, -- 1 point per $1 spent
    points_per_visit INTEGER DEFAULT 0, -- bonus points just for visiting
    
    -- Reward Tiers (simple point-based rewards)
    reward_tiers JSONB DEFAULT '[
        {"points": 100, "reward": "$5 Off", "discount_amount": 500},
        {"points": 200, "reward": "$10 Off", "discount_amount": 1000},
        {"points": 500, "reward": "$25 Off", "discount_amount": 2500}
    ]'::jsonb,
    
    -- Program Rules
    points_expire_days INTEGER DEFAULT 365, -- points expire after 1 year
    minimum_purchase_for_points INTEGER DEFAULT 0, -- minimum spend to earn points
    max_points_per_transaction INTEGER, -- cap on points per transaction
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Only one program per business for now
    UNIQUE(business_id)
);

-- ==============================================
-- 5. CUSTOMER LOYALTY POINTS
-- ==============================================
CREATE TABLE customer_loyalty_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Points Balance
    total_points_earned INTEGER DEFAULT 0,
    total_points_redeemed INTEGER DEFAULT 0,
    current_balance INTEGER DEFAULT 0,
    
    -- Tracking
    last_earned_at TIMESTAMP WITH TIME ZONE,
    last_redeemed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One record per customer per business
    UNIQUE(business_id, customer_id)
);

CREATE INDEX idx_customer_loyalty_business ON customer_loyalty_points(business_id);
CREATE INDEX idx_customer_loyalty_customer ON customer_loyalty_points(customer_id);

-- ==============================================
-- 6. LOYALTY TRANSACTIONS (Point history)
-- ==============================================
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    -- Transaction Details
    transaction_type VARCHAR(20) NOT NULL, -- 'earned', 'redeemed', 'expired', 'adjusted'
    points_amount INTEGER NOT NULL, -- positive for earned, negative for redeemed
    
    -- Context
    description TEXT, -- "Earned 25 points for $25 purchase", "Redeemed 100 points for $5 off"
    reference_amount INTEGER, -- the dollar amount that generated these points
    
    -- Balance after this transaction
    balance_after INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loyalty_transactions_business ON loyalty_transactions(business_id);
CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_transactions_date ON loyalty_transactions(created_at);

-- ==============================================
-- 7. UPDATE EXISTING TABLES FOR MULTI-LOCATION
-- ==============================================

-- Add location_id to existing tables
ALTER TABLE staff ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Create indexes for the new location_id columns
CREATE INDEX IF NOT EXISTS idx_staff_location ON staff(location_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_location ON business_hours(location_id);
CREATE INDEX IF NOT EXISTS idx_appointments_location ON appointments(location_id);

-- ==============================================
-- 8. UPDATE BUSINESSES TABLE FOR NEW FEATURES
-- ==============================================

-- Add location and payment settings to businesses
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS max_locations INTEGER DEFAULT 1, -- based on plan tier
ADD COLUMN IF NOT EXISTS payment_processors_enabled TEXT[] DEFAULT '{}', -- ['square', 'stripe']
ADD COLUMN IF NOT EXISTS loyalty_program_enabled BOOLEAN DEFAULT false;

-- Update plan types to match new tiers
ALTER TABLE businesses 
ADD CONSTRAINT businesses_plan_type_check 
CHECK (plan_type IN ('starter', 'professional', 'business', 'enterprise'));

-- ==============================================
-- 9. FUNCTIONS FOR LOYALTY PROGRAM
-- ==============================================

-- Function to award loyalty points
CREATE OR REPLACE FUNCTION award_loyalty_points(
    p_business_id UUID,
    p_customer_id UUID,
    p_appointment_id UUID DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL,
    p_purchase_amount INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
    loyalty_config RECORD;
    points_to_award INTEGER;
    customer_loyalty_id UUID;
    current_balance INTEGER;
BEGIN
    -- Get loyalty program configuration
    SELECT * INTO loyalty_config 
    FROM loyalty_programs 
    WHERE business_id = p_business_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN 0; -- No active loyalty program
    END IF;
    
    -- Calculate points to award
    points_to_award := 0;
    
    -- Points per dollar spent
    IF p_purchase_amount > 0 AND loyalty_config.points_per_dollar > 0 THEN
        points_to_award := points_to_award + (p_purchase_amount / 100) * loyalty_config.points_per_dollar;
    END IF;
    
    -- Bonus points per visit
    IF loyalty_config.points_per_visit > 0 THEN
        points_to_award := points_to_award + loyalty_config.points_per_visit;
    END IF;
    
    -- Apply maximum points per transaction cap
    IF loyalty_config.max_points_per_transaction IS NOT NULL THEN
        points_to_award := LEAST(points_to_award, loyalty_config.max_points_per_transaction);
    END IF;
    
    IF points_to_award <= 0 THEN
        RETURN 0;
    END IF;
    
    -- Get or create customer loyalty record
    INSERT INTO customer_loyalty_points (business_id, customer_id, total_points_earned, current_balance)
    VALUES (p_business_id, p_customer_id, 0, 0)
    ON CONFLICT (business_id, customer_id) DO NOTHING;
    
    -- Update customer points
    UPDATE customer_loyalty_points 
    SET 
        total_points_earned = total_points_earned + points_to_award,
        current_balance = current_balance + points_to_award,
        last_earned_at = NOW(),
        updated_at = NOW()
    WHERE business_id = p_business_id AND customer_id = p_customer_id
    RETURNING current_balance INTO current_balance;
    
    -- Record the transaction
    INSERT INTO loyalty_transactions (
        business_id, customer_id, appointment_id, payment_id,
        transaction_type, points_amount, description, reference_amount, balance_after
    ) VALUES (
        p_business_id, p_customer_id, p_appointment_id, p_payment_id,
        'earned', points_to_award, 
        'Earned ' || points_to_award || ' points for $' || (p_purchase_amount / 100.0) || ' purchase',
        p_purchase_amount, current_balance
    );
    
    RETURN points_to_award;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem loyalty points
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
    p_business_id UUID,
    p_customer_id UUID,
    p_points_to_redeem INTEGER,
    p_appointment_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT 'Points redeemed for discount'
) RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT current_balance INTO current_balance
    FROM customer_loyalty_points 
    WHERE business_id = p_business_id AND customer_id = p_customer_id;
    
    IF NOT FOUND OR current_balance < p_points_to_redeem THEN
        RETURN false; -- Insufficient points
    END IF;
    
    new_balance := current_balance - p_points_to_redeem;
    
    -- Update customer points
    UPDATE customer_loyalty_points 
    SET 
        total_points_redeemed = total_points_redeemed + p_points_to_redeem,
        current_balance = new_balance,
        last_redeemed_at = NOW(),
        updated_at = NOW()
    WHERE business_id = p_business_id AND customer_id = p_customer_id;
    
    -- Record the transaction
    INSERT INTO loyalty_transactions (
        business_id, customer_id, appointment_id,
        transaction_type, points_amount, description, balance_after
    ) VALUES (
        p_business_id, p_customer_id, p_appointment_id,
        'redeemed', -p_points_to_redeem, p_description, new_balance
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 10. UPDATE TRIGGERS
-- ==============================================

-- Add updated_at triggers for new tables
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_processors_updated_at BEFORE UPDATE ON payment_processors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_programs_updated_at BEFORE UPDATE ON loyalty_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_loyalty_points_updated_at BEFORE UPDATE ON customer_loyalty_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically award loyalty points when payment is completed
CREATE OR REPLACE FUNCTION auto_award_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Only award points when payment status changes to 'paid'
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        PERFORM award_loyalty_points(
            NEW.business_id,
            NEW.customer_id,
            NEW.appointment_id,
            NEW.id,
            NEW.total_amount
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_loyalty_points_trigger 
    AFTER INSERT OR UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION auto_award_loyalty_points();

-- ==============================================
-- 11. ROW LEVEL SECURITY FOR NEW TABLES
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (same pattern as existing tables)
CREATE POLICY "Locations viewable by business owner" ON locations
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Payment processors viewable by business owner" ON payment_processors
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Loyalty programs viewable by business owner" ON loyalty_programs
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Customer loyalty viewable by business owner" ON customer_loyalty_points
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Loyalty transactions viewable by business owner" ON loyalty_transactions
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

-- ==============================================
-- 12. SEED FUNCTIONS FOR NEW FEATURES
-- ==============================================

-- Function to create default location for existing businesses
CREATE OR REPLACE FUNCTION create_default_location(business_uuid UUID)
RETURNS UUID AS $$
DECLARE
    location_id UUID;
    business_info RECORD;
BEGIN
    -- Get business information
    SELECT name, address, city, state, postal_code, country, phone, email, timezone 
    INTO business_info 
    FROM businesses 
    WHERE id = business_uuid;
    
    -- Create primary location using business data
    INSERT INTO locations (
        business_id, name, slug, address_line1, city, state, postal_code, 
        country, phone, email, timezone, is_primary, is_active
    ) VALUES (
        business_uuid,
        business_info.name || ' - Main Location',
        'main-location',
        COALESCE(business_info.address, '123 Main St'),
        COALESCE(business_info.city, 'City'),
        COALESCE(business_info.state, 'CA'),
        COALESCE(business_info.postal_code, '90210'),
        COALESCE(business_info.country, 'US'),
        business_info.phone,
        business_info.email,
        COALESCE(business_info.timezone, 'America/Los_Angeles'),
        true,
        true
    ) RETURNING id INTO location_id;
    
    -- Create default loyalty program
    INSERT INTO loyalty_programs (business_id, is_active)
    VALUES (business_uuid, true)
    ON CONFLICT (business_id) DO NOTHING;
    
    RETURN location_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 13. MIGRATION HELPER
-- ==============================================

-- Function to migrate existing businesses to multi-location structure
CREATE OR REPLACE FUNCTION migrate_existing_businesses_to_multi_location()
RETURNS TEXT AS $$
DECLARE
    business_record RECORD;
    location_id UUID;
    result_text TEXT := '';
BEGIN
    FOR business_record IN SELECT * FROM businesses LOOP
        -- Create default location for each business
        location_id := create_default_location(business_record.id);
        
        -- Update existing staff to be associated with this location
        UPDATE staff 
        SET location_id = location_id 
        WHERE business_id = business_record.id AND location_id IS NULL;
        
        -- Update existing business hours to be associated with this location
        UPDATE business_hours 
        SET location_id = location_id 
        WHERE business_id = business_record.id AND location_id IS NULL;
        
        -- Update existing appointments to be associated with this location
        UPDATE appointments 
        SET location_id = location_id 
        WHERE business_id = business_record.id AND location_id IS NULL;
        
        result_text := result_text || 'Migrated business: ' || business_record.name || E'\n';
    END LOOP;
    
    RETURN result_text || 'Migration completed successfully!';
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- SCHEMA UPDATE COMPLETE
-- ==============================================

COMMENT ON TABLE locations IS 'Multiple locations per business (up to plan limit)';
COMMENT ON TABLE payment_processors IS 'Square and Stripe payment processor configurations';
COMMENT ON TABLE loyalty_programs IS 'Simple points-based loyalty program configuration';
COMMENT ON TABLE customer_loyalty_points IS 'Customer loyalty points balance and history';
COMMENT ON TABLE loyalty_transactions IS 'Detailed log of all loyalty point transactions';

-- Success message
SELECT 'MVP Features schema update completed! Added: Multi-location, Payment processing, Loyalty program' as status;