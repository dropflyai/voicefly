-- =============================================
-- CLEAN DATABASE FIX - VoiceFly
-- This safely drops and recreates all tables
-- =============================================

-- Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS daily_metrics CASCADE;
DROP TABLE IF EXISTS voice_ai_calls CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS business_customers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS business_users CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- Drop types if they exist
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS staff_role CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CUSTOM TYPES
-- =============================================

CREATE TYPE subscription_tier AS ENUM ('starter', 'professional', 'business', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'cancelled', 'past_due', 'suspended');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partially_paid', 'refunded', 'failed');
CREATE TYPE staff_role AS ENUM ('owner', 'manager', 'technician', 'receptionist', 'admin');

-- =============================================
-- BUSINESSES TABLE (Core tenant table)
-- =============================================

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Business identity
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    business_type VARCHAR(50) DEFAULT 'beauty_salon',

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
    postal_code VARCHAR(20),
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
    subscription_tier subscription_tier DEFAULT 'starter',
    subscription_status subscription_status DEFAULT 'trial',
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    subscription_starts_at TIMESTAMP WITH TIME ZONE,
    monthly_price DECIMAL(10,2),

    -- Multi-location support
    parent_business_id UUID REFERENCES businesses(id),
    location_name VARCHAR(255),
    is_location BOOLEAN DEFAULT FALSE,

    -- Metadata
    onboarding_completed BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    integrations JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CUSTOMERS TABLE (Platform-wide)
-- =============================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Customer info
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Metrics
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,

    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BUSINESS_CUSTOMERS (Tenant-specific customer data)
-- =============================================

CREATE TABLE business_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Business-specific customer data
    customer_notes TEXT,
    internal_notes TEXT,
    vip_status BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(business_id, customer_id)
);

-- =============================================
-- SERVICES TABLE
-- =============================================

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Service details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,

    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    buffer_time_minutes INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STAFF TABLE
-- =============================================

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Staff info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role staff_role DEFAULT 'technician',

    -- Settings
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- APPOINTMENTS TABLE
-- =============================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    service_id UUID REFERENCES services(id),
    staff_id UUID REFERENCES staff(id),

    -- Appointment details
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status appointment_status DEFAULT 'pending',

    -- Customer info (denormalized for voice bookings)
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),

    -- Voice AI tracking
    voice_call_id VARCHAR(255),
    booking_source VARCHAR(50) DEFAULT 'web',

    -- Notifications
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PAYMENTS TABLE
-- =============================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    customer_id UUID REFERENCES customers(id),

    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),

    -- External references
    stripe_payment_id VARCHAR(255),
    square_payment_id VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- VOICE_AI_CALLS TABLE
-- =============================================

CREATE TABLE voice_ai_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),

    -- Call details
    call_id VARCHAR(255),
    phone_number VARCHAR(50),
    duration_seconds INTEGER,
    transcript TEXT,
    summary TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BUSINESS_USERS TABLE
-- =============================================

CREATE TABLE business_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'member',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(business_id, user_id)
);

-- =============================================
-- DAILY_METRICS TABLE
-- =============================================

CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,

    -- Metrics
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(business_id, metric_date)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_business_customers_business ON business_customers(business_id);
CREATE INDEX idx_business_customers_customer ON business_customers(customer_id);
CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_staff_business ON staff(business_id);
CREATE INDEX idx_appointments_business ON appointments(business_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_payments_business ON payments(business_id);
CREATE INDEX idx_voice_calls_business ON voice_ai_calls(business_id);
CREATE INDEX idx_business_users_business ON business_users(business_id);
CREATE INDEX idx_daily_metrics_business ON daily_metrics(business_id);
CREATE INDEX idx_daily_metrics_date ON daily_metrics(metric_date);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_ai_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for server-side operations)
CREATE POLICY "Service role bypass" ON businesses FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON customers FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON business_customers FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON services FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON staff FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON appointments FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON payments FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON voice_ai_calls FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON business_users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON daily_metrics FOR ALL TO service_role USING (true);

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ VoiceFly Database Schema Complete!';
  RAISE NOTICE '   Tables: 10 core tables created';
  RAISE NOTICE '   Indexes: 15+ indexes created';
  RAISE NOTICE '   RLS: Enabled on all tables';
  RAISE NOTICE '   Ready to use!';
END $$;
