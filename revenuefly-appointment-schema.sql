-- REVENUEFLY COMPLETE SCHEMA - APPOINTMENT BOOKING + REVENUE TRACKING

-- ===== CORE BUSINESS TABLES (Multi-tenant) =====

-- Services (What businesses offer)
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  price_cents INTEGER NOT NULL, -- Store in cents to avoid float issues
  category TEXT, -- 'consultation', 'service', 'product', etc.
  industry_type TEXT, -- 'medical', 'dental', 'beauty', 'auto', 'legal'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff/Providers (Who provides services)
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT, -- 'provider', 'admin', 'assistant'
  specialties TEXT[], -- Array of service categories they can handle
  license_number TEXT, -- For medical/dental providers
  availability_hours JSONB, -- Weekly schedule
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Hours
CREATE TABLE business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  UNIQUE(organization_id, day_of_week)
);

-- Customers (People who book appointments)
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  insurance_provider TEXT, -- For medical/dental
  insurance_id TEXT,
  notes TEXT,
  customer_since TIMESTAMPTZ DEFAULT NOW(),
  total_spent_cents INTEGER DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, phone)
);

-- Appointments (The money-making bookings)
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES staff(id),
  service_id UUID REFERENCES services(id),

  -- Appointment Details
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER,

  -- Pricing & Revenue
  service_price_cents INTEGER,
  additional_charges_cents INTEGER DEFAULT 0,
  discount_cents INTEGER DEFAULT 0,
  total_price_cents INTEGER,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')) DEFAULT 'pending',

  -- Status & Source
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  booking_source TEXT CHECK (booking_source IN ('voice_call', 'web_form', 'phone_call', 'walk_in', 'referral')) DEFAULT 'voice_call',

  -- Call Attribution
  voice_call_id UUID REFERENCES voice_calls(id),
  lead_id UUID REFERENCES leads(id),
  campaign_id UUID REFERENCES voice_campaigns(id),

  -- Notes & Follow-up
  notes TEXT,
  special_requests TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  follow_up_needed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== REVENUE TRACKING TABLES =====

-- Revenue Attribution (Track every dollar)
CREATE TABLE revenue_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Revenue Details
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  revenue_date DATE DEFAULT CURRENT_DATE,

  -- Attribution
  source TEXT CHECK (source IN ('appointment', 'voice_call', 'web_booking', 'upsell', 'referral', 'subscription')) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  voice_call_id UUID REFERENCES voice_calls(id),
  campaign_id UUID REFERENCES voice_campaigns(id),
  customer_id UUID REFERENCES customers(id),

  -- Tracking
  is_recurring BOOLEAN DEFAULT false,
  cost_to_acquire_cents INTEGER, -- CAC for this revenue
  profit_margin_percentage DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Revenue Summary (For fast dashboard queries)
CREATE TABLE daily_revenue_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  summary_date DATE NOT NULL,

  -- Daily Metrics
  total_revenue_cents INTEGER DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  cancelled_appointments INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,

  -- AI Performance
  voice_calls_made INTEGER DEFAULT 0,
  voice_calls_successful INTEGER DEFAULT 0,
  appointments_from_ai INTEGER DEFAULT 0,
  ai_conversion_rate DECIMAL(5,2),

  -- Costs
  ai_costs_cents INTEGER DEFAULT 0,
  total_costs_cents INTEGER DEFAULT 0,
  profit_cents INTEGER DEFAULT 0,
  roi_percentage DECIMAL(8,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, summary_date)
);

-- ===== PAYMENT & BILLING TABLES =====

-- Payment Transactions
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  customer_id UUID REFERENCES customers(id) NOT NULL,

  -- Payment Details
  amount_cents INTEGER NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('credit_card', 'debit_card', 'cash', 'check', 'insurance', 'financing')),
  stripe_payment_intent_id TEXT,

  -- Status
  status TEXT CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
  failure_reason TEXT,

  -- Metadata
  payment_metadata JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== AUTOMATION & WORKFLOW TABLES =====

-- Appointment Reminders
CREATE TABLE appointment_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT CHECK (reminder_type IN ('sms', 'email', 'voice_call')) NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')) DEFAULT 'pending',
  response_received BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up Actions
CREATE TABLE follow_up_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),

  -- Action Details
  action_type TEXT CHECK (action_type IN ('call', 'email', 'sms', 'review_request', 'rebooking')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,

  -- Content
  subject TEXT,
  message_template TEXT,
  personalization_data JSONB,

  -- Status
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== SERVICE-SPECIFIC TABLES =====

-- Treatment Plans (For medical/dental)
CREATE TABLE treatment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  provider_id UUID REFERENCES staff(id),

  -- Plan Details
  diagnosis TEXT,
  treatment_description TEXT,
  estimated_sessions INTEGER,
  total_cost_cents INTEGER,

  -- Timeline
  start_date DATE,
  estimated_completion_date DATE,

  -- Status
  status TEXT CHECK (status IN ('draft', 'approved', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft',
  insurance_approved BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES FOR PERFORMANCE =====

-- Services
CREATE INDEX idx_services_org ON services(organization_id);
CREATE INDEX idx_services_category ON services(organization_id, category);
CREATE INDEX idx_services_active ON services(organization_id, is_active);

-- Staff
CREATE INDEX idx_staff_org ON staff(organization_id);
CREATE INDEX idx_staff_active ON staff(organization_id, is_active);
CREATE INDEX idx_staff_specialties ON staff USING GIN(specialties);

-- Customers
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_phone ON customers(organization_id, phone);
CREATE INDEX idx_customers_email ON customers(organization_id, email);

-- Appointments
CREATE INDEX idx_appointments_org ON appointments(organization_id);
CREATE INDEX idx_appointments_date ON appointments(organization_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(organization_id, status);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);
CREATE INDEX idx_appointments_voice_call ON appointments(voice_call_id);

-- Revenue Tracking
CREATE INDEX idx_revenue_org ON revenue_tracking(organization_id);
CREATE INDEX idx_revenue_date ON revenue_tracking(organization_id, revenue_date);
CREATE INDEX idx_revenue_source ON revenue_tracking(organization_id, source);
CREATE INDEX idx_revenue_appointment ON revenue_tracking(appointment_id);

-- Daily Summary
CREATE INDEX idx_daily_summary_org ON daily_revenue_summary(organization_id);
CREATE INDEX idx_daily_summary_date ON daily_revenue_summary(organization_id, summary_date);

-- Payments
CREATE INDEX idx_payments_org ON payment_transactions(organization_id);
CREATE INDEX idx_payments_appointment ON payment_transactions(appointment_id);
CREATE INDEX idx_payments_status ON payment_transactions(organization_id, status);

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS for all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_revenue_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Organization-based access)
CREATE POLICY "Users can manage their org services" ON services FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their org staff" ON staff FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their org customers" ON customers FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their org appointments" ON appointments FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their org revenue" ON revenue_tracking FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- ===== TRIGGERS FOR AUTOMATION =====

-- Auto-update appointment total price
CREATE OR REPLACE FUNCTION calculate_appointment_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price_cents = COALESCE(NEW.service_price_cents, 0) +
                         COALESCE(NEW.additional_charges_cents, 0) -
                         COALESCE(NEW.discount_cents, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_appointment_total
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_appointment_total();

-- Auto-create revenue tracking when appointment is completed
CREATE OR REPLACE FUNCTION create_revenue_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track revenue when appointment is completed and paid
  IF NEW.status = 'completed' AND NEW.payment_status = 'paid' AND
     (OLD.status IS NULL OR OLD.status != 'completed' OR OLD.payment_status != 'paid') THEN

    INSERT INTO revenue_tracking (
      organization_id,
      amount_cents,
      source,
      appointment_id,
      voice_call_id,
      campaign_id,
      customer_id,
      revenue_date
    ) VALUES (
      NEW.organization_id,
      NEW.total_price_cents,
      'appointment',
      NEW.id,
      NEW.voice_call_id,
      NEW.campaign_id,
      NEW.customer_id,
      NEW.appointment_date
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_revenue_tracking
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_revenue_tracking();

-- Update customer total spent
CREATE OR REPLACE FUNCTION update_customer_total_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.payment_status = 'paid' THEN
    UPDATE customers
    SET total_spent_cents = total_spent_cents + NEW.total_price_cents,
        updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_total_spent
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_total_spent();