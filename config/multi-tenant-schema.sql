-- Multi-Tenant Database Schema for Beauty Booking Platform
-- This extends the existing schema to support multiple businesses

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- BUSINESS/TENANT MANAGEMENT
-- =============================================

-- Main businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Business identity
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- for subdomains like 'salon-name.dropfly.ai'
    business_type VARCHAR(50) DEFAULT 'nail_salon', -- nail_salon, spa, beauty_clinic
    
    -- Contact information
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    
    -- Business settings
    currency VARCHAR(3) DEFAULT 'USD',
    booking_advance_days INTEGER DEFAULT 30,
    booking_notice_hours INTEGER DEFAULT 2,
    cancellation_notice_hours INTEGER DEFAULT 4,
    
    -- Platform integration
    vapi_assistant_id VARCHAR(255),
    vapi_phone_number_id VARCHAR(255),
    webhook_token VARCHAR(255) DEFAULT encode(gen_random_bytes(32), 'hex'),
    n8n_workflow_id VARCHAR(255),
    
    -- Subscription info
    subscription_tier VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
    subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, suspended, cancelled
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    subscription_starts_at TIMESTAMP WITH TIME ZONE,
    monthly_price DECIMAL(10,2),
    
    -- Metadata
    onboarding_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_business_type CHECK (business_type IN ('nail_salon', 'spa', 'beauty_clinic', 'barbershop')),
    CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled'))
);

-- Business hours table (more flexible than JSON)
CREATE TABLE IF NOT EXISTS business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    is_open BOOLEAN DEFAULT TRUE,
    open_time TIME,
    close_time TIME,
    break_start_time TIME, -- optional lunch break
    break_end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, day_of_week)
);

-- Business owner/admin users
CREATE TABLE IF NOT EXISTS business_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- User info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    
    -- Authentication (if not using external auth)
    password_hash VARCHAR(255), -- bcrypt hash
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Role and permissions
    role VARCHAR(50) DEFAULT 'owner', -- owner, admin, manager, staff
    permissions JSONB DEFAULT '{}', -- flexible permissions object
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'manager', 'staff'))
);

-- =============================================
-- ENHANCED SERVICE MANAGEMENT
-- =============================================

-- Update existing services table for multi-tenant
ALTER TABLE services ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_deposit BOOLEAN DEFAULT FALSE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER;

-- Service categories for better organization
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, name)
);

-- Add category reference to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES service_categories(id);

-- Service packages/combos
CREATE TABLE IF NOT EXISTS service_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_duration INTEGER NOT NULL, -- minutes
    price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Package settings
    is_active BOOLEAN DEFAULT TRUE,
    requires_deposit BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services included in packages
CREATE TABLE IF NOT EXISTS package_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    
    UNIQUE(package_id, service_id)
);

-- =============================================
-- ENHANCED STAFF MANAGEMENT
-- =============================================

-- Update existing technicians table
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2); -- percentage
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500);

-- Staff availability/time-off
CREATE TABLE IF NOT EXISTS staff_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    
    -- Date range
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Time (if partial day)
    start_time TIME,
    end_time TIME,
    
    -- Type
    availability_type VARCHAR(50) NOT NULL, -- available, unavailable, vacation, sick, break
    reason VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_availability_type CHECK (availability_type IN ('available', 'unavailable', 'vacation', 'sick', 'break', 'training'))
);

-- =============================================
-- ENHANCED CUSTOMER MANAGEMENT
-- =============================================

-- Customer profiles (across all businesses on platform)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Personal info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE,
    
    -- Preferences
    preferred_communication VARCHAR(50) DEFAULT 'email', -- email, sms, phone
    marketing_opt_in BOOLEAN DEFAULT FALSE,
    
    -- Platform account
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_communication CHECK (preferred_communication IN ('email', 'sms', 'phone', 'none'))
);

-- Customer relationship with specific businesses
CREATE TABLE IF NOT EXISTS business_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Business-specific data
    customer_notes TEXT,
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    
    -- Preferences for this business
    preferred_technician_id UUID REFERENCES technicians(id),
    allergies_notes TEXT,
    special_requests TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, banned
    first_visit_date DATE,
    last_visit_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, customer_id),
    CONSTRAINT valid_customer_status CHECK (status IN ('active', 'inactive', 'banned'))
);

-- =============================================
-- ENHANCED APPOINTMENTS
-- =============================================

-- Update existing appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES service_packages(id);

-- Payment information
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Appointment notes and history
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS staff_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add payment status constraint
ALTER TABLE appointments ADD CONSTRAINT valid_payment_status 
    CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded', 'failed'));

-- Appointment reminders tracking
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    
    reminder_type VARCHAR(50) NOT NULL, -- email, sms, voice
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, sent, failed
    
    -- Message content
    subject VARCHAR(255),
    message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_reminder_type CHECK (reminder_type IN ('email', 'sms', 'voice', 'push')),
    CONSTRAINT valid_reminder_status CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled'))
);

-- =============================================
-- PAYMENT AND BILLING
-- =============================================

-- Business subscription billing
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Invoice details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Billing period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Payment
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    stripe_invoice_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_invoice_status CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded'))
);

-- Customer payments for appointments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- deposit, full_payment, tip, product
    payment_method VARCHAR(50) NOT NULL, -- card, cash, venmo, etc
    
    -- Stripe integration
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_payment_type CHECK (payment_type IN ('deposit', 'full_payment', 'tip', 'product', 'package', 'membership')),
    CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'disputed'))
);

-- =============================================
-- PLATFORM ANALYTICS
-- =============================================

-- Daily business metrics rollup
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    
    -- Appointment metrics
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    no_show_appointments INTEGER DEFAULT 0,
    
    -- Revenue metrics
    total_revenue DECIMAL(10,2) DEFAULT 0,
    cash_revenue DECIMAL(10,2) DEFAULT 0,
    card_revenue DECIMAL(10,2) DEFAULT 0,
    tips_collected DECIMAL(10,2) DEFAULT 0,
    
    -- Customer metrics
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    
    -- Platform usage
    voice_calls_received INTEGER DEFAULT 0,
    online_bookings INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(business_id, metric_date)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Business-related indexes
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status ON businesses(subscription_status);
CREATE INDEX IF NOT EXISTS idx_business_users_business_id ON business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_email ON business_users(email);

-- Multi-tenant data indexes
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_technicians_business_id ON technicians(business_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_appointments_business_date ON appointments(business_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_business_status ON appointments(business_id, status);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_business_date ON daily_metrics(business_id, metric_date);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all business tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for business data isolation
CREATE POLICY "Business users can only see their business data" ON appointments
    FOR ALL USING (business_id = current_setting('app.current_business_id')::UUID);

CREATE POLICY "Business users can only see their services" ON services
    FOR ALL USING (business_id = current_setting('app.current_business_id')::UUID);

-- Service role has full access (for platform administration)
CREATE POLICY "Service role has full access" ON businesses
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update business metrics
CREATE OR REPLACE FUNCTION update_daily_metrics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_metrics (business_id, metric_date, total_appointments, completed_appointments)
    VALUES (NEW.business_id, NEW.appointment_date::DATE, 1, 0)
    ON CONFLICT (business_id, metric_date)
    DO UPDATE SET 
        total_appointments = daily_metrics.total_appointments + 1,
        completed_appointments = CASE 
            WHEN NEW.status = 'completed' THEN daily_metrics.completed_appointments + 1
            ELSE daily_metrics.completed_appointments
        END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update metrics
CREATE TRIGGER trigger_update_daily_metrics
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_metrics();

-- =============================================
-- DEFAULT DATA SETUP
-- =============================================

-- Insert default service categories
INSERT INTO service_categories (business_id, name, description, display_order) 
SELECT 
    b.id,
    category_name,
    category_desc,
    category_order
FROM businesses b,
(VALUES 
    ('Manicures', 'Professional nail care and polish services', 1),
    ('Pedicures', 'Foot care and relaxation treatments', 2),
    ('Nail Enhancements', 'Gel, acrylics, and nail art', 3),
    ('Spa Services', 'Relaxation and wellness treatments', 4)
) AS categories(category_name, category_desc, category_order)
ON CONFLICT DO NOTHING;

-- Insert default business hours (9 AM - 6 PM, Monday-Saturday)
INSERT INTO business_hours (business_id, day_of_week, is_open, open_time, close_time)
SELECT 
    b.id,
    dow,
    CASE WHEN dow = 0 THEN false ELSE true END, -- Sunday closed
    CASE WHEN dow = 0 THEN null ELSE '09:00'::time END,
    CASE WHEN dow = 0 THEN null WHEN dow = 6 THEN '16:00'::time ELSE '18:00'::time END
FROM businesses b,
generate_series(0, 6) AS dow
ON CONFLICT DO NOTHING;