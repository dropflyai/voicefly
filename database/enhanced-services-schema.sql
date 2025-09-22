-- Enhanced Services Schema for Customizable Services
-- This extends the existing services table to better handle user customizations

-- First, let's add some missing columns that would be helpful for customized services
ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'standard'; -- 'standard', 'custom', 'addon'
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_consultation BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 30;
ALTER TABLE services ADD COLUMN IF NOT EXISTS min_advance_booking_hours INTEGER DEFAULT 2;

-- Add a settings column for additional service-specific configuration
ALTER TABLE services ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Update the existing businesses table to store additional settings
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_first_name VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_last_name VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS vapi_assistant_id VARCHAR(255);

-- Create service categories table for better organization
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, name)
);

-- Create service pricing tiers for businesses that want multiple pricing levels
CREATE TABLE IF NOT EXISTS service_pricing_tiers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    tier_name VARCHAR(50) NOT NULL, -- 'basic', 'premium', 'luxury'
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_id, tier_name)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_business_active ON services(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(business_id, display_order);
CREATE INDEX IF NOT EXISTS idx_service_categories_business ON service_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_service_pricing_business ON service_pricing_tiers(business_id);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_service_categories_updated_at ON service_categories;
CREATE TRIGGER update_service_categories_updated_at 
    BEFORE UPDATE ON service_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_pricing_tiers_updated_at ON service_pricing_tiers;
CREATE TRIGGER update_service_pricing_tiers_updated_at 
    BEFORE UPDATE ON service_pricing_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default service categories
INSERT INTO service_categories (business_id, name, description, display_order)
SELECT b.id, 'Manicure Services', 'Professional manicure services', 1
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM service_categories sc 
    WHERE sc.business_id = b.id AND sc.name = 'Manicure Services'
);

INSERT INTO service_categories (business_id, name, description, display_order)
SELECT b.id, 'Pedicure Services', 'Professional pedicure services', 2
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM service_categories sc 
    WHERE sc.business_id = b.id AND sc.name = 'Pedicure Services'
);

INSERT INTO service_categories (business_id, name, description, display_order)
SELECT b.id, 'Combo Packages', 'Money-saving combination services', 3
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM service_categories sc 
    WHERE sc.business_id = b.id AND sc.name = 'Combo Packages'
);

INSERT INTO service_categories (business_id, name, description, display_order)
SELECT b.id, 'Add-on Services', 'Enhancement and specialty services', 4
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM service_categories sc 
    WHERE sc.business_id = b.id AND sc.name = 'Add-on Services'
);

-- Update the subscription_tier enum to include the 'business' tier if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier_new') THEN
        -- Create new enum with all tiers
        CREATE TYPE subscription_tier_new AS ENUM ('starter', 'professional', 'business', 'enterprise');
        
        -- Update the businesses table to use the new enum
        ALTER TABLE businesses ALTER COLUMN subscription_tier DROP DEFAULT;
        ALTER TABLE businesses ALTER COLUMN subscription_tier TYPE subscription_tier_new USING subscription_tier::text::subscription_tier_new;
        ALTER TABLE businesses ALTER COLUMN subscription_tier SET DEFAULT 'starter'::subscription_tier_new;
        
        -- Drop the old enum and rename the new one
        DROP TYPE subscription_tier;
        ALTER TYPE subscription_tier_new RENAME TO subscription_tier;
    END IF;
END $$;

-- Function to get service statistics for a business
CREATE OR REPLACE FUNCTION get_service_stats(business_uuid UUID)
RETURNS TABLE(
    total_services INTEGER,
    active_services INTEGER,
    average_price DECIMAL(10,2),
    most_expensive_service VARCHAR(255),
    most_popular_category VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_services,
        COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_services,
        ROUND(AVG(base_price), 2) as average_price,
        (SELECT name FROM services WHERE business_id = business_uuid ORDER BY base_price DESC LIMIT 1) as most_expensive_service,
        (SELECT category FROM services WHERE business_id = business_uuid GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1) as most_popular_category
    FROM services 
    WHERE business_id = business_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to duplicate services when creating a new location (for Business tier)
CREATE OR REPLACE FUNCTION duplicate_services_for_location(
    source_business_uuid UUID,
    target_business_uuid UUID
)
RETURNS INTEGER AS $$
DECLARE
    services_copied INTEGER := 0;
    service_record RECORD;
BEGIN
    FOR service_record IN 
        SELECT * FROM services WHERE business_id = source_business_uuid AND is_active = true
    LOOP
        INSERT INTO services (
            business_id, name, description, duration_minutes, base_price, 
            category, is_active, requires_deposit, deposit_amount, 
            display_order, service_type, settings
        ) VALUES (
            target_business_uuid, service_record.name, service_record.description, 
            service_record.duration_minutes, service_record.base_price,
            service_record.category, service_record.is_active, 
            service_record.requires_deposit, service_record.deposit_amount,
            service_record.display_order, service_record.service_type, 
            service_record.settings
        );
        
        services_copied := services_copied + 1;
    END LOOP;
    
    RETURN services_copied;
END;
$$ LANGUAGE plpgsql;

-- Views for common service queries
CREATE OR REPLACE VIEW active_services_by_business AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    s.id as service_id,
    s.name as service_name,
    s.category,
    s.base_price,
    s.duration_minutes,
    s.display_order
FROM businesses b
JOIN services s ON b.id = s.business_id
WHERE s.is_active = true
ORDER BY b.name, s.display_order, s.name;

CREATE OR REPLACE VIEW service_revenue_summary AS
SELECT 
    s.business_id,
    s.id as service_id,
    s.name as service_name,
    s.base_price,
    COUNT(a.id) as total_appointments,
    SUM(p.total_amount) as total_revenue,
    AVG(p.total_amount) as average_revenue_per_appointment
FROM services s
LEFT JOIN appointments a ON s.id = a.service_id
LEFT JOIN payments p ON a.id = p.appointment_id AND p.status = 'paid'
GROUP BY s.business_id, s.id, s.name, s.base_price
ORDER BY total_revenue DESC NULLS LAST;