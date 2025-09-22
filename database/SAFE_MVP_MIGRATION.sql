-- ==============================================
-- SAFE MVP FEATURES MIGRATION
-- Designed to work with existing database structure
-- ==============================================

-- First, let's safely update the businesses table plan constraint
-- Drop the existing constraint if it exists
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_plan_type_check;

-- Add the new constraint that includes existing + new plan types
ALTER TABLE businesses 
ADD CONSTRAINT businesses_plan_type_check 
CHECK (plan_type IN ('starter', 'professional', 'business', 'enterprise'));

-- ==============================================
-- 1. CREATE NEW TABLES (These don't exist yet)
-- ==============================================

-- LOCATIONS TABLE (Multi-location support)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    
    -- Address Information
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(10) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) DEFAULT 'US',
    
    -- Contact Info
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Settings
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    
    -- Integration IDs
    square_location_id VARCHAR(255),
    stripe_account_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, slug)
);

CREATE INDEX idx_locations_business ON locations(business_id);
CREATE INDEX idx_locations_active ON locations(business_id, is_active);

-- PAYMENT PROCESSORS TABLE
CREATE TABLE payment_processors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    
    processor_type VARCHAR(20) NOT NULL,
    
    -- Configuration
    is_active BOOLEAN DEFAULT false,
    is_live_mode BOOLEAN DEFAULT false,
    
    -- API Keys
    api_key_public VARCHAR(500),
    api_key_secret VARCHAR(500),
    webhook_secret VARCHAR(500),
    
    -- IDs
    account_id VARCHAR(255),
    application_id VARCHAR(255),
    
    -- Settings
    auto_capture BOOLEAN DEFAULT true,
    allow_tips BOOLEAN DEFAULT true,
    default_tip_percentages INTEGER[] DEFAULT ARRAY[15, 18, 20, 25],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(location_id, processor_type)
);

CREATE INDEX idx_payment_processors_business ON payment_processors(business_id);
CREATE INDEX idx_payment_processors_location ON payment_processors(location_id);

-- PAYMENTS TABLE (New table - doesn't exist yet)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Amounts in cents
    subtotal_amount INTEGER NOT NULL DEFAULT 0,
    tip_amount INTEGER DEFAULT 0,
    tax_amount INTEGER DEFAULT 0,
    discount_amount INTEGER DEFAULT 0,
    total_amount INTEGER NOT NULL,
    
    -- Processing
    processor_type VARCHAR(20) NOT NULL,
    processor_transaction_id VARCHAR(255),
    processor_fee_amount INTEGER DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_method_details JSONB DEFAULT '{}',
    
    -- Timestamps
    authorized_at TIMESTAMP WITH TIME ZONE,
    captured_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional
    receipt_url TEXT,
    refund_reason TEXT,
    processor_webhook_data JSONB DEFAULT '{}',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_business ON payments(business_id);
CREATE INDEX idx_payments_location ON payments(location_id);
CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_status ON payments(status);

-- LOYALTY PROGRAMS TABLE
CREATE TABLE loyalty_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    is_active BOOLEAN DEFAULT true,
    program_name VARCHAR(255) DEFAULT 'Loyalty Rewards',
    
    -- Points config
    points_per_dollar INTEGER DEFAULT 1,
    points_per_visit INTEGER DEFAULT 0,
    
    -- Reward tiers
    reward_tiers JSONB DEFAULT '[
        {"points": 100, "reward": "$5 Off", "discount_amount": 500},
        {"points": 200, "reward": "$10 Off", "discount_amount": 1000},
        {"points": 500, "reward": "$25 Off", "discount_amount": 2500}
    ]'::jsonb,
    
    -- Rules
    points_expire_days INTEGER DEFAULT 365,
    minimum_purchase_for_points INTEGER DEFAULT 0,
    max_points_per_transaction INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id)
);

-- CUSTOMER LOYALTY POINTS TABLE
CREATE TABLE customer_loyalty_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    total_points_earned INTEGER DEFAULT 0,
    total_points_redeemed INTEGER DEFAULT 0,
    current_balance INTEGER DEFAULT 0,
    
    last_earned_at TIMESTAMP WITH TIME ZONE,
    last_redeemed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, customer_id)
);

CREATE INDEX idx_customer_loyalty_business ON customer_loyalty_points(business_id);
CREATE INDEX idx_customer_loyalty_customer ON customer_loyalty_points(customer_id);

-- LOYALTY TRANSACTIONS TABLE
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    transaction_type VARCHAR(20) NOT NULL,
    points_amount INTEGER NOT NULL,
    description TEXT,
    reference_amount INTEGER,
    balance_after INTEGER NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loyalty_transactions_business ON loyalty_transactions(business_id);
CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_transactions_date ON loyalty_transactions(created_at);

-- ==============================================
-- 2. SAFELY UPDATE EXISTING TABLES
-- ==============================================

-- Add new columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS max_locations INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payment_processors_enabled TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS loyalty_program_enabled BOOLEAN DEFAULT false;

-- Add location_id to existing tables (safely)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_staff_location ON staff(location_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_location ON business_hours(location_id);
CREATE INDEX IF NOT EXISTS idx_appointments_location ON appointments(location_id);

-- ==============================================
-- 3. ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Locations viewable by business owner" ON locations
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Payment processors viewable by business owner" ON payment_processors
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Payments viewable by business owner" ON payments
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Loyalty programs viewable by business owner" ON loyalty_programs
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Customer loyalty viewable by business owner" ON customer_loyalty_points
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Loyalty transactions viewable by business owner" ON loyalty_transactions
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

-- ==============================================
-- 4. CREATE FUNCTIONS
-- ==============================================

-- Function to create default location for a business
CREATE OR REPLACE FUNCTION create_default_location_safe(business_uuid UUID)
RETURNS UUID AS $$
DECLARE
    location_id UUID;
    business_info RECORD;
BEGIN
    -- Check if business already has a location
    SELECT id INTO location_id FROM locations WHERE business_id = business_uuid LIMIT 1;
    IF FOUND THEN
        RETURN location_id; -- Already has a location
    END IF;
    
    -- Get business information 
    SELECT name, address_line1, address, city, state, postal_code, zip_code, phone, email, timezone 
    INTO business_info 
    FROM businesses 
    WHERE id = business_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Business not found: %', business_uuid;
    END IF;
    
    -- Create primary location using business data
    INSERT INTO locations (
        business_id, name, slug, 
        address_line1, city, state, postal_code, 
        phone, email, timezone, is_primary, is_active
    ) VALUES (
        business_uuid,
        business_info.name || ' - Main Location',
        'main-location',
        COALESCE(business_info.address_line1, business_info.address, '123 Main St'),
        COALESCE(business_info.city, 'City'),
        COALESCE(business_info.state, 'CA'),
        COALESCE(business_info.postal_code, business_info.zip_code, '90210'),
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

-- Function to migrate existing businesses safely
CREATE OR REPLACE FUNCTION migrate_existing_businesses_safe()
RETURNS TEXT AS $$
DECLARE
    business_record RECORD;
    location_id UUID;
    result_text TEXT := '';
    migrated_count INTEGER := 0;
BEGIN
    FOR business_record IN SELECT * FROM businesses LOOP
        -- Create default location for each business
        location_id := create_default_location_safe(business_record.id);
        
        -- Update existing records to be associated with this location
        UPDATE staff 
        SET location_id = location_id 
        WHERE business_id = business_record.id AND location_id IS NULL;
        
        UPDATE business_hours 
        SET location_id = location_id 
        WHERE business_id = business_record.id AND location_id IS NULL;
        
        UPDATE appointments 
        SET location_id = location_id 
        WHERE business_id = business_record.id AND location_id IS NULL;
        
        result_text := result_text || 'Migrated: ' || COALESCE(business_record.name, 'Unnamed Business') || E'\n';
        migrated_count := migrated_count + 1;
    END LOOP;
    
    RETURN result_text || E'\nTotal migrated: ' || migrated_count || ' businesses';
END;
$$ LANGUAGE plpgsql;

-- Loyalty functions (same as before)
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
    current_balance INTEGER;
BEGIN
    SELECT * INTO loyalty_config 
    FROM loyalty_programs 
    WHERE business_id = p_business_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    points_to_award := 0;
    
    IF p_purchase_amount > 0 AND loyalty_config.points_per_dollar > 0 THEN
        points_to_award := points_to_award + (p_purchase_amount / 100) * loyalty_config.points_per_dollar;
    END IF;
    
    IF loyalty_config.points_per_visit > 0 THEN
        points_to_award := points_to_award + loyalty_config.points_per_visit;
    END IF;
    
    IF loyalty_config.max_points_per_transaction IS NOT NULL THEN
        points_to_award := LEAST(points_to_award, loyalty_config.max_points_per_transaction);
    END IF;
    
    IF points_to_award <= 0 THEN
        RETURN 0;
    END IF;
    
    INSERT INTO customer_loyalty_points (business_id, customer_id, total_points_earned, current_balance)
    VALUES (p_business_id, p_customer_id, 0, 0)
    ON CONFLICT (business_id, customer_id) DO NOTHING;
    
    UPDATE customer_loyalty_points 
    SET 
        total_points_earned = total_points_earned + points_to_award,
        current_balance = current_balance + points_to_award,
        last_earned_at = NOW(),
        updated_at = NOW()
    WHERE business_id = p_business_id AND customer_id = p_customer_id
    RETURNING current_balance INTO current_balance;
    
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

-- ==============================================
-- 5. ADD TRIGGERS
-- ==============================================

-- Add updated_at triggers for new tables
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_processors_updated_at BEFORE UPDATE ON payment_processors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_programs_updated_at BEFORE UPDATE ON loyalty_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_loyalty_points_updated_at BEFORE UPDATE ON customer_loyalty_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-award loyalty points trigger
CREATE OR REPLACE FUNCTION auto_award_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
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

-- Success message
SELECT 'Safe MVP migration completed! No existing data was affected.' as status;