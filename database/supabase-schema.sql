-- DropFly AI Salon Platform - Multi-Tenant Database Schema
-- Created for Supabase PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- 1. BUSINESSES (Core tenant table)
-- ==============================================
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-safe identifier
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) DEFAULT 'nail_salon',
    
    -- Contact Information
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    website VARCHAR(255),
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(10),
    zip_code VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    
    -- Owner Information
    owner_first_name VARCHAR(100),
    owner_last_name VARCHAR(100),
    owner_email VARCHAR(255),
    owner_phone VARCHAR(20),
    
    -- Subscription & Billing
    plan_type VARCHAR(20) DEFAULT 'starter', -- starter, professional, enterprise
    subscription_status VARCHAR(20) DEFAULT 'trial', -- trial, active, cancelled, suspended
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '14 days',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    
    -- Platform Integration IDs
    vapi_assistant_id VARCHAR(255),
    vapi_phone_number VARCHAR(20),
    twilio_phone_sid VARCHAR(255),
    n8n_workflow_id VARCHAR(255),
    webhook_token VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Metadata
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT businesses_slug_check CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT businesses_email_check CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

-- Create indexes
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_webhook_token ON businesses(webhook_token);
CREATE INDEX idx_businesses_vapi_assistant ON businesses(vapi_assistant_id);

-- ==============================================
-- 2. SERVICES (What each salon offers)
-- ==============================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 30,
    price_cents INTEGER, -- Store in cents to avoid float issues
    category VARCHAR(100), -- manicure, pedicure, nail_art, etc.
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_services_active ON services(business_id, is_active);

-- ==============================================
-- 3. STAFF (Employees who provide services)
-- ==============================================
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    
    specialties TEXT[], -- Array of service categories
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_staff_business ON staff(business_id);
CREATE INDEX idx_staff_active ON staff(business_id, is_active);

-- ==============================================
-- 4. BUSINESS HOURS
-- ==============================================
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    
    UNIQUE(business_id, day_of_week)
);

-- ==============================================
-- 5. CUSTOMERS
-- ==============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique phone per business
    UNIQUE(business_id, phone)
);

CREATE INDEX idx_customers_business ON customers(business_id);
CREATE INDEX idx_customers_phone ON customers(business_id, phone);

-- ==============================================
-- 6. APPOINTMENTS (The main booking data)
-- ==============================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    duration_minutes INTEGER DEFAULT 30,
    
    -- Status Management
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, no_show
    
    -- Booking Details
    customer_notes TEXT,
    internal_notes TEXT,
    booking_source VARCHAR(50) DEFAULT 'phone', -- phone, web, admin, walk_in
    
    -- Contact Information (denormalized for reliability)
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appointments_business ON appointments(business_id);
CREATE INDEX idx_appointments_date ON appointments(business_id, appointment_date);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_status ON appointments(business_id, status);

-- ==============================================
-- 7. SYSTEM LOGS (For debugging and analytics)
-- ==============================================
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    
    event_type VARCHAR(100) NOT NULL, -- vapi_call, booking_created, payment_processed, etc.
    event_data JSONB DEFAULT '{}',
    source VARCHAR(100), -- vapi, n8n, admin, api, etc.
    
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_logs_business ON system_logs(business_id);
CREATE INDEX idx_logs_type ON system_logs(event_type);
CREATE INDEX idx_logs_created ON system_logs(created_at);

-- ==============================================
-- 8. ROW LEVEL SECURITY (Multi-tenant isolation)
-- ==============================================

-- Enable RLS on all tenant tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
-- Note: These will be refined based on your authentication setup

-- Businesses: Only owners can access their business
CREATE POLICY "Businesses are viewable by owner" ON businesses
    FOR ALL USING (owner_email = auth.jwt() ->> 'email');

-- Services: Only viewable by business owner
CREATE POLICY "Services are viewable by business owner" ON services
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'
        )
    );

-- Apply similar pattern to other tables
CREATE POLICY "Staff viewable by business owner" ON staff
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Hours viewable by business owner" ON business_hours
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Customers viewable by business owner" ON customers
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Appointments viewable by business owner" ON appointments
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "Logs viewable by business owner" ON system_logs
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

-- ==============================================
-- 9. FUNCTIONS & TRIGGERS
-- ==============================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create slug from business name
CREATE OR REPLACE FUNCTION generate_business_slug(business_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Create base slug: lowercase, replace spaces/special chars with hyphens
    base_slug := regexp_replace(lower(trim(business_name)), '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g'); -- Remove leading/trailing hyphens
    
    final_slug := base_slug;
    
    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = final_slug) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 10. SEED DATA (Default services for nail salons)
-- ==============================================

-- Create function to seed default services for new businesses
CREATE OR REPLACE FUNCTION seed_default_services(business_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO services (business_id, name, description, duration_minutes, price_cents, category) VALUES
    (business_uuid, 'Basic Manicure', 'Classic nail care and polish', 30, 2500, 'manicure'),
    (business_uuid, 'Gel Manicure', 'Long-lasting gel polish manicure', 45, 3500, 'manicure'),
    (business_uuid, 'Basic Pedicure', 'Relaxing foot care and polish', 45, 3000, 'pedicure'),
    (business_uuid, 'Gel Pedicure', 'Long-lasting gel polish pedicure', 60, 4000, 'pedicure'),
    (business_uuid, 'French Manicure', 'Classic French tip design', 40, 3000, 'manicure'),
    (business_uuid, 'Nail Art', 'Custom nail designs', 60, 5000, 'nail_art'),
    (business_uuid, 'Acrylic Full Set', 'Full set of acrylic nails', 90, 6000, 'extensions'),
    (business_uuid, 'Acrylic Fill', 'Acrylic nail maintenance', 60, 4500, 'extensions');
END;
$$ LANGUAGE plpgsql;

-- Create function to seed default business hours (Tue-Sat, 9AM-7PM)
CREATE OR REPLACE FUNCTION seed_default_hours(business_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO business_hours (business_id, day_of_week, open_time, close_time, is_closed) VALUES
    (business_uuid, 0, NULL, NULL, true),  -- Sunday - Closed
    (business_uuid, 1, NULL, NULL, true),  -- Monday - Closed  
    (business_uuid, 2, '09:00', '19:00', false), -- Tuesday
    (business_uuid, 3, '09:00', '19:00', false), -- Wednesday
    (business_uuid, 4, '09:00', '19:00', false), -- Thursday
    (business_uuid, 5, '09:00', '19:00', false), -- Friday
    (business_uuid, 6, '09:00', '18:00', false); -- Saturday
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 11. VIEWS (Helpful queries)
-- ==============================================

-- View for business dashboard summary
CREATE VIEW business_dashboard_summary AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    b.slug,
    b.vapi_phone_number,
    b.plan_type,
    b.subscription_status,
    COUNT(DISTINCT c.id) as total_customers,
    COUNT(DISTINCT CASE WHEN a.appointment_date >= CURRENT_DATE THEN a.id END) as upcoming_appointments,
    COUNT(DISTINCT CASE WHEN a.appointment_date = CURRENT_DATE THEN a.id END) as today_appointments
FROM businesses b
LEFT JOIN customers c ON c.business_id = b.id
LEFT JOIN appointments a ON a.business_id = b.id
GROUP BY b.id, b.name, b.slug, b.vapi_phone_number, b.plan_type, b.subscription_status;

-- View for today's schedule per business
CREATE VIEW todays_schedule AS
SELECT 
    a.business_id,
    a.id as appointment_id,
    a.customer_name,
    a.customer_phone,
    s.name as service_name,
    st.first_name || ' ' || st.last_name as staff_name,
    a.start_time,
    a.duration_minutes,
    a.status,
    a.customer_notes
FROM appointments a
LEFT JOIN services s ON s.id = a.service_id
LEFT JOIN staff st ON st.id = a.staff_id
WHERE a.appointment_date = CURRENT_DATE
ORDER BY a.business_id, a.start_time;

-- ==============================================
-- SCHEMA COMPLETE
-- ==============================================

COMMENT ON TABLE businesses IS 'Core tenant table - each row represents one nail salon';
COMMENT ON TABLE services IS 'Services offered by each salon (manicures, pedicures, etc.)';
COMMENT ON TABLE staff IS 'Employees who provide services at each salon';
COMMENT ON TABLE business_hours IS 'Operating hours for each day of the week';
COMMENT ON TABLE customers IS 'Customer records, isolated per business';
COMMENT ON TABLE appointments IS 'Main booking records with full appointment details';
COMMENT ON TABLE system_logs IS 'Event logging for debugging and analytics';

-- Success message
SELECT 'Database schema created successfully! Ready for multi-tenant salon platform.' as status;