-- =============================================
-- VoiceFly Complete Database Schema
-- Multi-Tenant SaaS Platform with RLS
-- Version: 2.0
-- Last Updated: October 1, 2025
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CUSTOM TYPES
-- =============================================

-- Only create types if they don't already exist
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('starter', 'professional', 'business', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'cancelled', 'past_due', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partially_paid', 'refunded', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE staff_role AS ENUM ('owner', 'manager', 'technician', 'receptionist', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- CORE TABLES (Level 1 - No dependencies)
-- =============================================

-- Main businesses table (tenants)
CREATE TABLE IF NOT EXISTS businesses (
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

    -- Multi-location support (Business+ tier)
    parent_business_id UUID REFERENCES businesses(id),
    location_name VARCHAR(255),
    is_location BOOLEAN DEFAULT FALSE,

    -- Metadata
    onboarding_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform customers (shared across businesses)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Personal info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    date_of_birth DATE,

    -- Preferences
    preferred_communication VARCHAR(50) DEFAULT 'email',
    marketing_opt_in BOOLEAN DEFAULT FALSE,

    -- Platform account (optional)
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,

    -- Metadata
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BUSINESS-SPECIFIC TABLES (Level 2 - Depend on businesses)
-- =============================================

-- Phone numbers for VAPI integration
CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    vapi_phone_id VARCHAR(255),
    vapi_phone_number_id VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business hours
CREATE TABLE IF NOT EXISTS business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_open BOOLEAN DEFAULT TRUE,
    open_time TIME,
    close_time TIME,
    break_start_time TIME,
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

    -- Authentication
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,

    -- Role and permissions
    role staff_role DEFAULT 'owner',
    permissions JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff/Technicians
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Personal info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),

    -- Employment details
    employee_id VARCHAR(50),
    role staff_role DEFAULT 'technician',
    specialties TEXT[],
    bio TEXT,
    profile_image_url VARCHAR(500),
    avatar_url TEXT,

    -- Compensation
    hourly_rate DECIMAL(10,2),
    commission_rate DECIMAL(5,2) DEFAULT 0.00,

    -- Multi-location support
    assigned_location_id UUID REFERENCES businesses(id),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    hire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff schedules/availability
CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_available BOOLEAN DEFAULT TRUE,
    start_time TIME,
    end_time TIME,
    break_start_time TIME,
    break_end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(staff_id, day_of_week)
);

-- Service categories
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

-- Services
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES service_categories(id),

    -- Service details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),

    -- Display and booking settings
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    requires_deposit BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10,2) DEFAULT 0.00,
    max_advance_booking_days INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service packages
CREATE TABLE IF NOT EXISTS service_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_duration INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,
    requires_deposit BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Package services (many-to-many)
CREATE TABLE IF NOT EXISTS package_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,

    UNIQUE(package_id, service_id)
);

-- Business-specific customer relationships
CREATE TABLE IF NOT EXISTS business_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Business-specific data
    customer_notes TEXT,
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier VARCHAR(50) DEFAULT 'bronze',
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    total_visits INTEGER DEFAULT 0,

    -- Preferences
    preferred_staff_id UUID REFERENCES staff(id),
    allergies_notes TEXT,
    special_requests TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'active',
    first_visit_date DATE,
    last_visit_date DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(business_id, customer_id)
);

-- Loyalty tiers configuration
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    tier_name VARCHAR(50) NOT NULL,
    min_points INTEGER NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    perks JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(business_id, tier_name)
);

-- =============================================
-- APPOINTMENT & PAYMENT TABLES (Level 3)
-- =============================================

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    business_customer_id UUID REFERENCES business_customers(id),
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    package_id UUID REFERENCES service_packages(id),
    location_id UUID REFERENCES businesses(id),

    -- Appointment details
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status appointment_status DEFAULT 'pending',

    -- Notes
    notes TEXT,
    customer_notes TEXT,
    staff_notes TEXT,
    internal_notes TEXT,

    -- Payment information
    total_amount DECIMAL(10,2),
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),

    -- Tracking
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    tip_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,

    payment_type VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,

    -- Stripe integration
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),

    -- Status
    status payment_status DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription invoices (platform billing)
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    stripe_invoice_id VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- VOICE AI & COMMUNICATION TABLES
-- =============================================

-- Voice AI configuration
CREATE TABLE IF NOT EXISTS voice_ai_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    is_enabled BOOLEAN DEFAULT FALSE,
    vapi_assistant_id VARCHAR(255),
    phone_number VARCHAR(20),

    -- AI messages
    greeting_message TEXT,
    business_hours_message TEXT,
    booking_confirmation_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice AI call logs
CREATE TABLE IF NOT EXISTS voice_ai_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    vapi_call_id VARCHAR(255) UNIQUE,
    customer_phone VARCHAR(20),
    call_duration INTEGER,
    call_outcome VARCHAR(100),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    transcript TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointment reminders
CREATE TABLE IF NOT EXISTS appointment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

    reminder_type VARCHAR(50) NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled',

    subject VARCHAR(255),
    message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS TABLES
-- =============================================

-- Daily business metrics
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

-- Business indexes
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status ON businesses(subscription_status);
CREATE INDEX IF NOT EXISTS idx_businesses_parent ON businesses(parent_business_id);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Appointment indexes
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_business_date ON appointments(business_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_business_status ON appointments(business_id, status);

-- Service indexes
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);

-- Staff indexes
CREATE INDEX IF NOT EXISTS idx_staff_business_id ON staff(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_location_id ON staff(assigned_location_id);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

-- Phone number indexes
CREATE INDEX IF NOT EXISTS idx_phone_numbers_business_id ON phone_numbers(business_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_phone ON phone_numbers(phone_number);

-- Business customer indexes
CREATE INDEX IF NOT EXISTS idx_business_customers_business_id ON business_customers(business_id);
CREATE INDEX IF NOT EXISTS idx_business_customers_customer_id ON business_customers(customer_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_daily_metrics_business_date ON daily_metrics(business_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_voice_ai_calls_business_id ON voice_ai_calls(business_id);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_customers_updated_at BEFORE UPDATE ON business_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_ai_config_updated_at BEFORE UPDATE ON voice_ai_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phone_numbers_updated_at BEFORE UPDATE ON phone_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_users_updated_at BEFORE UPDATE ON business_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update daily metrics
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
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all business tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_ai_calls ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for server-side operations)
CREATE POLICY "Service role has full access to businesses" ON businesses
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to appointments" ON appointments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to services" ON services
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to staff" ON staff
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to customers" ON business_customers
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to payments" ON payments
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'VoiceFly Database Schema Setup Complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tables created: 30+';
    RAISE NOTICE 'Indexes created: 25+';
    RAISE NOTICE 'RLS policies: Enabled';
    RAISE NOTICE 'Triggers: Active';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run seed.sql for sample data (optional)';
    RAISE NOTICE '2. Test database connection from app';
    RAISE NOTICE '3. Verify dashboard loads correctly';
    RAISE NOTICE '==============================================';
END $$;


-- ============================================
-- LEADS & CAMPAIGNS SCHEMA
-- ============================================


-- Migration: Add Research & Campaigns Tables
-- Description: Add tables for AI research, lead management, and marketing campaigns
-- Date: 2025-10-01

-- ============================================
-- LEADS & PROSPECTS
-- ============================================

-- Leads table (prospects in sales pipeline)
create table if not exists leads (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,

    -- Contact info
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    email varchar(255),
    phone varchar(20),
    company_name varchar(255),
    job_title varchar(255),
    linkedin_url varchar(500),
    website varchar(500),

    -- Lead details
    industry varchar(100),
    company_size varchar(50), -- '1-10', '11-50', '51-200', '201-500', '501+'
    location varchar(255),

    -- Qualification
    lead_source varchar(100), -- 'linkedin', 'referral', 'inbound', 'cold_outreach'
    lead_status varchar(50) default 'new', -- 'new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'closed_won', 'closed_lost'
    qualification_score integer default 0, -- 0-100

    -- Engagement
    last_contacted_at timestamp with time zone,
    next_follow_up_at timestamp with time zone,
    demo_scheduled_at timestamp with time zone,

    -- Financials
    estimated_deal_value decimal(10,2),
    estimated_close_date date,

    -- Owner
    assigned_to_staff_id uuid references staff(id) on delete set null,

    -- Notes
    notes text,
    tags text[], -- Array of tags like 'hot_lead', 'decision_maker', etc.

    -- Metadata
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Lead notes (research & interaction history)
create table if not exists lead_notes (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    lead_id uuid references leads(id) on delete cascade,

    note_type varchar(50) default 'general', -- 'general', 'research', 'call', 'email', 'meeting'
    title varchar(255),
    content text not null,

    -- Research-specific fields
    research_query text, -- If note came from AI research
    research_mode varchar(50), -- 'prospect', 'competitor', 'market', etc.

    -- Metadata
    created_by_staff_id uuid references staff(id) on delete set null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- ============================================
-- AI RESEARCH SYSTEM
-- ============================================

-- Research history (all queries & results)
create table if not exists research_history (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,

    -- Query details
    query text not null,
    mode varchar(50) not null, -- 'deep', 'quick', 'prospect', 'competitor', 'market'

    -- Results
    result_content text,
    result_summary text, -- Short summary for listings
    sources_count integer default 0,
    confidence_score decimal(3,2), -- 0.00 to 1.00

    -- Context
    related_lead_id uuid references leads(id) on delete set null,
    related_customer_id uuid references customers(id) on delete set null,
    page_context varchar(100), -- Where research was triggered from

    -- Performance
    duration_ms integer, -- How long research took
    tokens_used integer, -- AI tokens consumed

    -- Metadata
    created_by_staff_id uuid references staff(id) on delete set null,
    created_at timestamp with time zone default now()
);

-- Research templates (saved queries)
create table if not exists research_templates (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,

    -- Template details
    name varchar(255) not null,
    description text,
    query_template text not null, -- With placeholders like {prospect_name}, {industry}
    mode varchar(50) not null,

    -- Usage
    use_count integer default 0,
    last_used_at timestamp with time zone,

    -- Sharing
    is_shared boolean default false, -- Share with team
    created_by_staff_id uuid references staff(id) on delete set null,

    -- Metadata
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- ============================================
-- MARKETING CAMPAIGNS
-- ============================================

-- Email campaigns
create table if not exists marketing_campaigns (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,

    -- Campaign details
    name varchar(255) not null,
    campaign_type varchar(50) default 'email', -- 'email', 'sms', 'voice'
    status varchar(50) default 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'paused'

    -- Email content
    subject_line varchar(500),
    preview_text varchar(500),
    email_content text,

    -- Research connection
    source_research_id uuid references research_history(id) on delete set null,
    research_insights jsonb, -- Key insights extracted from research

    -- Targeting
    target_segment varchar(100), -- 'all_customers', 'new_leads', 'qualified_leads', 'custom'
    target_lead_status varchar(50), -- Filter by lead status
    target_tags text[], -- Filter by tags

    -- Scheduling
    scheduled_send_at timestamp with time zone,
    sent_at timestamp with time zone,

    -- Performance
    recipients_count integer default 0,
    opens_count integer default 0,
    clicks_count integer default 0,
    replies_count integer default 0,
    conversions_count integer default 0,

    -- Metadata
    created_by_staff_id uuid references staff(id) on delete set null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Campaign recipients tracking
create table if not exists campaign_recipients (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    campaign_id uuid references marketing_campaigns(id) on delete cascade,

    -- Recipient
    lead_id uuid references leads(id) on delete cascade,
    customer_id uuid references customers(id) on delete set null,
    email varchar(255) not null,

    -- Delivery
    status varchar(50) default 'pending', -- 'pending', 'sent', 'delivered', 'bounced', 'failed'
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,

    -- Engagement
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    replied_at timestamp with time zone,
    converted_at timestamp with time zone,

    -- Email service
    email_provider_id varchar(255), -- Resend/Sendgrid message ID
    bounce_reason text,

    -- Metadata
    created_at timestamp with time zone default now()
);

-- ============================================
-- VOICE CAMPAIGNS (VAPI)
-- ============================================

-- Voice campaigns (AI calling campaigns)
create table if not exists voice_campaigns (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,

    -- Campaign details
    name varchar(255) not null,
    description text,
    status varchar(50) default 'draft', -- 'draft', 'active', 'paused', 'completed'

    -- VAPI configuration
    vapi_assistant_id varchar(255),
    vapi_phone_number_id uuid references phone_numbers(id) on delete set null,

    -- Script
    greeting_script text,
    value_proposition text,
    qualifying_questions jsonb, -- Array of questions
    objection_handling jsonb, -- Key/value objections and responses
    closing_script text,

    -- Research connection
    source_research_id uuid references research_history(id) on delete set null,
    competitor_insights jsonb,

    -- Targeting
    target_segment varchar(100),
    target_lead_status varchar(50),
    max_calls_per_day integer default 50,

    -- Performance
    total_calls integer default 0,
    successful_connections integer default 0,
    demos_booked integer default 0,
    deals_closed integer default 0,

    -- Metadata
    created_by_staff_id uuid references staff(id) on delete set null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Voice campaign calls (individual call tracking)
create table if not exists voice_campaign_calls (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    campaign_id uuid references voice_campaigns(id) on delete cascade,

    -- Recipient
    lead_id uuid references leads(id) on delete cascade,
    phone_number varchar(20) not null,

    -- Call details
    vapi_call_id varchar(255) unique,
    call_status varchar(50), -- 'queued', 'in_progress', 'completed', 'failed', 'no_answer'
    call_outcome varchar(100), -- 'demo_booked', 'interested', 'not_interested', 'callback_requested', 'no_answer'

    -- Call data
    duration_seconds integer,
    transcript text,
    call_recording_url text,
    sentiment_score decimal(3,2), -- 0.00 to 1.00 (negative to positive)

    -- Follow-up
    demo_scheduled_at timestamp with time zone,
    follow_up_required boolean default false,
    follow_up_notes text,

    -- Metadata
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Leads indexes
create index if not exists idx_leads_business on leads(business_id);
create index if not exists idx_leads_status on leads(lead_status);
create index if not exists idx_leads_email on leads(email);
create index if not exists idx_leads_assigned on leads(assigned_to_staff_id);
create index if not exists idx_leads_next_followup on leads(next_follow_up_at);

-- Lead notes indexes
create index if not exists idx_lead_notes_lead on lead_notes(lead_id);
create index if not exists idx_lead_notes_type on lead_notes(note_type);

-- Research indexes
create index if not exists idx_research_history_business on research_history(business_id);
create index if not exists idx_research_history_lead on research_history(related_lead_id);
create index if not exists idx_research_history_created on research_history(created_at);

-- Campaign indexes
create index if not exists idx_campaigns_business on marketing_campaigns(business_id);
create index if not exists idx_campaigns_status on marketing_campaigns(status);
create index if not exists idx_campaign_recipients_campaign on campaign_recipients(campaign_id);
create index if not exists idx_campaign_recipients_lead on campaign_recipients(lead_id);

-- Voice campaign indexes
create index if not exists idx_voice_campaigns_business on voice_campaigns(business_id);
create index if not exists idx_voice_campaign_calls_campaign on voice_campaign_calls(campaign_id);
create index if not exists idx_voice_campaign_calls_lead on voice_campaign_calls(lead_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

create trigger update_leads_updated_at before update on leads
    for each row execute function update_updated_at_column();

create trigger update_lead_notes_updated_at before update on lead_notes
    for each row execute function update_updated_at_column();

create trigger update_research_templates_updated_at before update on research_templates
    for each row execute function update_updated_at_column();

create trigger update_marketing_campaigns_updated_at before update on marketing_campaigns
    for each row execute function update_updated_at_column();

create trigger update_voice_campaigns_updated_at before update on voice_campaigns
    for each row execute function update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table leads enable row level security;
alter table lead_notes enable row level security;
alter table research_history enable row level security;
alter table research_templates enable row level security;
alter table marketing_campaigns enable row level security;
alter table campaign_recipients enable row level security;
alter table voice_campaigns enable row level security;
alter table voice_campaign_calls enable row level security;

-- Policies: Users can only access data for their business

-- Leads policies
create policy "Users can view leads for their business"
    on leads for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can insert leads for their business"
    on leads for insert
    with check (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can update leads for their business"
    on leads for update
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- Lead notes policies
create policy "Users can view lead notes for their business"
    on lead_notes for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can insert lead notes for their business"
    on lead_notes for insert
    with check (business_id in (
        select id from businesses where id = business_id
    ));

-- Research history policies
create policy "Users can view research for their business"
    on research_history for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can insert research for their business"
    on research_history for insert
    with check (business_id in (
        select id from businesses where id = business_id
    ));

-- Research templates policies
create policy "Users can view templates for their business"
    on research_templates for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can manage templates for their business"
    on research_templates for all
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- Marketing campaigns policies
create policy "Users can view campaigns for their business"
    on marketing_campaigns for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can manage campaigns for their business"
    on marketing_campaigns for all
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- Campaign recipients policies
create policy "Users can view recipients for their business"
    on campaign_recipients for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can manage recipients for their business"
    on campaign_recipients for all
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- Voice campaigns policies
create policy "Users can view voice campaigns for their business"
    on voice_campaigns for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can manage voice campaigns for their business"
    on voice_campaigns for all
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- Voice campaign calls policies
create policy "Users can view voice calls for their business"
    on voice_campaign_calls for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can manage voice calls for their business"
    on voice_campaign_calls for all
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- View: Lead pipeline summary
create or replace view lead_pipeline_summary as
select
    business_id,
    lead_status,
    count(*) as lead_count,
    sum(estimated_deal_value) as total_pipeline_value,
    avg(qualification_score) as avg_qualification_score
from leads
group by business_id, lead_status;

-- View: Campaign performance summary
create or replace view campaign_performance as
select
    c.id as campaign_id,
    c.name as campaign_name,
    c.business_id,
    c.recipients_count,
    c.opens_count,
    c.clicks_count,
    c.conversions_count,
    round((c.opens_count::decimal / nullif(c.recipients_count, 0)) * 100, 2) as open_rate,
    round((c.clicks_count::decimal / nullif(c.opens_count, 0)) * 100, 2) as click_through_rate,
    round((c.conversions_count::decimal / nullif(c.recipients_count, 0)) * 100, 2) as conversion_rate
from marketing_campaigns c
where c.status = 'sent';

-- View: Research usage by mode
create or replace view research_usage_stats as
select
    business_id,
    mode,
    count(*) as query_count,
    avg(duration_ms) as avg_duration_ms,
    avg(confidence_score) as avg_confidence,
    sum(tokens_used) as total_tokens
from research_history
group by business_id, mode;


-- ============================================
-- ENTERPRISE EXTENSIONS SCHEMA
-- ============================================


-- COMPLETE ENTERPRISE SCHEMA ADDITIONS

-- Voice Scripts & Templates
CREATE TABLE voice_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  script_type TEXT CHECK (script_type IN ('cold_call', 'follow_up', 'qualification', 'demo_booking', 'custom')),
  industry TEXT,
  persona TEXT, -- 'ceo', 'cto', 'sales_director', etc
  script_content TEXT NOT NULL,
  variables JSONB, -- Dynamic variables like {company_name}, {pain_point}
  objection_handlers JSONB, -- Common objections and responses
  success_rate DECIMAL(5,2),
  is_template BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Recordings & Transcripts
CREATE TABLE call_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID REFERENCES voice_campaign_calls(id) ON DELETE CASCADE NOT NULL,
  recording_url TEXT NOT NULL,
  transcript_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  storage_provider TEXT DEFAULT 's3',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Enrichment Data
CREATE TABLE lead_enrichment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  -- Company data
  company_revenue TEXT,
  company_employees TEXT,
  company_founded_year INTEGER,
  company_description TEXT,
  company_technologies JSONB, -- Tech stack
  company_funding JSONB, -- Funding rounds
  company_news JSONB, -- Recent news
  -- Contact data
  contact_linkedin TEXT,
  contact_twitter TEXT,
  contact_title TEXT,
  contact_seniority TEXT,
  contact_department TEXT,
  -- Intelligence
  buying_signals JSONB,
  competitor_usage JSONB,
  pain_points JSONB,
  enriched_at TIMESTAMPTZ DEFAULT NOW(),
  enrichment_source TEXT, -- 'manual', 'clearbit', 'apollo', 'leadfly'
  UNIQUE(lead_id)
);

-- Email Templates & Sequences
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  template_type TEXT CHECK (template_type IN ('follow_up', 'introduction', 'meeting_request', 'thank_you', 'custom')),
  variables JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up Sequences
CREATE TABLE follow_up_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger_event TEXT CHECK (trigger_event IN ('call_completed', 'no_answer', 'qualified', 'not_qualified', 'meeting_scheduled')),
  steps JSONB NOT NULL, -- Array of {delay_hours, action_type, template_id}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings & Calendar Integration
CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  call_id UUID REFERENCES voice_campaign_calls(id),
  scheduled_by UUID REFERENCES auth.users(id),
  meeting_type TEXT CHECK (meeting_type IN ('demo', 'discovery', 'follow_up', 'closing', 'check_in')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_url TEXT, -- Zoom/Teams/Google Meet link
  calendar_event_id TEXT, -- External calendar ID
  notes TEXT,
  outcome TEXT,
  attended BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations Configuration
CREATE TABLE integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  integration_type TEXT CHECK (integration_type IN ('salesforce', 'hubspot', 'pipedrive', 'slack', 'teams', 'zapier', 'webhook', 'calendly', 'zoom')),
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- Encrypted credentials and settings
  field_mappings JSONB, -- Map VoiceFly fields to CRM fields
  sync_frequency TEXT CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'manual')),
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, integration_type)
);

-- Webhooks for real-time updates
CREATE TABLE webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['call.started', 'call.completed', 'lead.qualified']
  headers JSONB,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Performance Analytics
CREATE TABLE team_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  period_date DATE NOT NULL,
  -- Metrics
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  total_minutes DECIMAL(10,2) DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  meetings_scheduled INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  average_call_duration DECIMAL(10,2),
  -- Rankings
  team_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_date)
);

-- Custom Fields for Leads (Dynamic schema)
CREATE TABLE custom_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect')),
  field_options JSONB, -- For select/multiselect
  is_required BOOLEAN DEFAULT false,
  applies_to TEXT CHECK (applies_to IN ('lead', 'campaign', 'call')),
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, field_name, applies_to)
);

-- Custom Field Values
CREATE TABLE custom_field_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID REFERENCES custom_fields(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID NOT NULL, -- ID of lead, campaign, or call
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_id, entity_id)
);

-- AI Training Data (for improving voice AI)
CREATE TABLE ai_training_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  call_id UUID REFERENCES voice_campaign_calls(id) NOT NULL,
  feedback_type TEXT CHECK (feedback_type IN ('positive', 'negative', 'correction')),
  segment_start_time INTEGER, -- Seconds into call
  segment_end_time INTEGER,
  original_response TEXT,
  suggested_response TEXT,
  feedback_notes TEXT,
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  -- Channels
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  -- Events
  notify_call_completed BOOLEAN DEFAULT true,
  notify_lead_qualified BOOLEAN DEFAULT true,
  notify_meeting_scheduled BOOLEAN DEFAULT true,
  notify_campaign_completed BOOLEAN DEFAULT true,
  notify_daily_summary BOOLEAN DEFAULT true,
  notify_weekly_report BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- Tags for organization and filtering
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#gray',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- Tag associations (polymorphic)
CREATE TABLE tag_associations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('lead', 'campaign', 'call')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tag_id, entity_type, entity_id)
);

-- Call Queue Management
CREATE TABLE call_queues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES voice_campaigns(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  priority INTEGER DEFAULT 0,
  scheduled_for TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);

-- AB Testing for Scripts
CREATE TABLE ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  test_type TEXT CHECK (test_type IN ('script', 'voice', 'timing', 'opener')),
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  traffic_split DECIMAL(3,2) DEFAULT 0.50, -- Percentage to variant A
  success_metric TEXT, -- 'qualification_rate', 'meeting_rate', etc
  -- Results
  variant_a_trials INTEGER DEFAULT 0,
  variant_a_successes INTEGER DEFAULT 0,
  variant_b_trials INTEGER DEFAULT 0,
  variant_b_successes INTEGER DEFAULT 0,
  statistical_significance DECIMAL(5,4),
  winner TEXT CHECK (winner IN ('a', 'b', 'none')),
  status TEXT CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create all indexes
CREATE INDEX idx_voice_scripts_org ON voice_scripts(business_id);
CREATE INDEX idx_lead_enrichment_lead ON lead_enrichment(lead_id);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX idx_integrations_org ON integrations(business_id);
CREATE INDEX idx_team_performance_user ON team_performance(user_id);
CREATE INDEX idx_team_performance_period ON team_performance(period_date);
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_id);
CREATE INDEX idx_tag_associations_entity ON tag_associations(entity_type, entity_id);
CREATE INDEX idx_call_queues_status ON call_queues(status);
CREATE INDEX idx_call_queues_scheduled ON call_queues(scheduled_for);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);