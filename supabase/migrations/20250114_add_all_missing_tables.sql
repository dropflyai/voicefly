-- Add call_logs table for VAPI call tracking
-- Tracks all incoming/outgoing calls handled by voice AI

CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,

  -- Call metadata
  call_id TEXT UNIQUE, -- VAPI call ID
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'busy', 'no_answer')),

  -- Call timing
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- Total call duration

  -- Call details
  from_number TEXT,
  to_number TEXT,
  assistant_id TEXT, -- VAPI assistant used
  recording_url TEXT,
  transcript TEXT,

  -- AI metrics
  sentiment TEXT, -- positive, neutral, negative
  intent TEXT, -- appointment_booking, inquiry, complaint, etc.
  outcome TEXT, -- booked, callback_requested, no_action, etc.

  -- Cost tracking
  cost_cents INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_business_id ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_customer_id ON call_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_phone_number ON call_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_direction ON call_logs(direction);
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_call_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER call_logs_updated_at
  BEFORE UPDATE ON call_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_call_logs_updated_at();

-- RLS policies
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view call logs from their businesses"
  ON call_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = call_logs.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert call logs for their businesses"
  ON call_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = call_logs.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update call logs from their businesses"
  ON call_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = call_logs.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE call_logs IS 'Tracks all voice AI calls (inbound and outbound)';
COMMENT ON COLUMN call_logs.call_id IS 'External call ID from VAPI';
COMMENT ON COLUMN call_logs.sentiment IS 'AI-detected sentiment of the call';
COMMENT ON COLUMN call_logs.intent IS 'Primary intent/reason for the call';
COMMENT ON COLUMN call_logs.outcome IS 'Result of the call';
-- Add sms_messages table for SMS/text message tracking
-- Tracks all SMS communications with customers

CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Message details
  message_sid TEXT UNIQUE, -- Twilio message SID
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'undelivered', 'received')),

  -- Phone numbers
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,

  -- Message content
  body TEXT NOT NULL,
  media_url TEXT[], -- Array of media URLs (MMS)

  -- Message type
  message_type TEXT DEFAULT 'transactional' CHECK (message_type IN ('transactional', 'marketing', 'reminder', 'support')),

  -- Related records
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  campaign_id UUID, -- For marketing campaigns

  -- Delivery tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,

  -- Cost tracking
  cost_cents INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 1,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_messages_business_id ON sms_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_customer_id ON sms_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_from_number ON sms_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to_number ON sms_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_message_sid ON sms_messages(message_sid);
CREATE INDEX IF NOT EXISTS idx_sms_messages_direction ON sms_messages(direction);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_appointment_id ON sms_messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created_at ON sms_messages(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_sms_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sms_messages_updated_at
  BEFORE UPDATE ON sms_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_messages_updated_at();

-- RLS policies
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SMS from their businesses"
  ON sms_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = sms_messages.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert SMS for their businesses"
  ON sms_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = sms_messages.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update SMS from their businesses"
  ON sms_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = sms_messages.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE sms_messages IS 'Tracks all SMS/text messages sent and received';
COMMENT ON COLUMN sms_messages.message_sid IS 'Twilio message ID';
COMMENT ON COLUMN sms_messages.message_type IS 'Type of message for filtering and compliance';
COMMENT ON COLUMN sms_messages.media_url IS 'URLs of any attached media (MMS)';
-- Add activity_logs table for user activity tracking
-- Tracks all user actions across the platform for audit and analytics

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Activity details
  action TEXT NOT NULL, -- create, update, delete, view, export, login, etc.
  entity_type TEXT NOT NULL, -- appointment, customer, service, staff, etc.
  entity_id UUID, -- ID of the affected record
  entity_name TEXT, -- Friendly name of the entity

  -- Context
  description TEXT, -- Human-readable description
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,

  -- Changes tracking
  changes JSONB, -- Before/after values for updates

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_id ON activity_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_composite ON activity_logs(business_id, entity_type, created_at DESC);

-- RLS policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity logs from their businesses"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = activity_logs.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activity logs for their businesses"
  ON activity_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = activity_logs.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Helper function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_business_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (
    business_id,
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    description,
    changes,
    metadata
  ) VALUES (
    p_business_id,
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_description,
    p_changes,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_activity TO authenticated;

-- Comments
COMMENT ON TABLE activity_logs IS 'Tracks all user actions for audit and analytics';
COMMENT ON COLUMN activity_logs.action IS 'Type of action performed (create, update, delete, view, etc.)';
COMMENT ON COLUMN activity_logs.entity_type IS 'Type of entity affected (appointment, customer, etc.)';
COMMENT ON COLUMN activity_logs.changes IS 'JSON object showing before/after values';
COMMENT ON FUNCTION log_activity IS 'Helper function to easily log user activities';
-- Add credits table for credit balance tracking
-- Tracks current credit balance for each business

CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,

  -- Credit balance
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,

  -- Subscription credits (monthly allocation)
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  rollover_credits INTEGER NOT NULL DEFAULT 0,

  -- Credit expiration
  credits_expire_at TIMESTAMPTZ,
  last_reset_at TIMESTAMPTZ,
  next_reset_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_business_id ON credits(business_id);
CREATE INDEX IF NOT EXISTS idx_credits_balance ON credits(balance);
CREATE INDEX IF NOT EXISTS idx_credits_expires ON credits(credits_expire_at);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW
  EXECUTE FUNCTION update_credits_updated_at();

-- RLS policies
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credits for their businesses"
  ON credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = credits.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update credits for their businesses"
  ON credits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = credits.business_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('owner', 'admin')
    )
  );

-- Helper function to get credit balance
CREATE OR REPLACE FUNCTION get_credit_balance(p_business_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance
  FROM credits
  WHERE business_id = p_business_id;

  RETURN COALESCE(v_balance, 0);
END;
$$;

-- Helper function to deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(
  p_business_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM credits
  WHERE business_id = p_business_id
  FOR UPDATE; -- Lock the row

  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Update credits
  UPDATE credits
  SET
    balance = v_new_balance,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE business_id = p_business_id;

  -- Log transaction
  INSERT INTO credit_transactions (
    business_id,
    type,
    amount,
    balance_after,
    description
  ) VALUES (
    p_business_id,
    'deduction',
    -p_amount,
    v_new_balance,
    p_description
  );

  RETURN TRUE;
END;
$$;

-- Helper function to add credits
CREATE OR REPLACE FUNCTION add_credits(
  p_business_id UUID,
  p_amount INTEGER,
  p_credit_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update credits
  UPDATE credits
  SET
    balance = balance + p_amount,
    total_earned = total_earned + p_amount,
    updated_at = NOW()
  WHERE business_id = p_business_id
  RETURNING balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO credit_transactions (
    business_id,
    type,
    amount,
    balance_after,
    description
  ) VALUES (
    p_business_id,
    p_credit_type,
    p_amount,
    v_new_balance,
    p_description
  );

  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_credit_balance TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits TO authenticated;
GRANT EXECUTE ON FUNCTION add_credits TO authenticated;

-- Comments
COMMENT ON TABLE credits IS 'Tracks current credit balance for each business';
COMMENT ON COLUMN credits.balance IS 'Current available credits';
COMMENT ON COLUMN credits.monthly_credits IS 'Monthly credit allocation from subscription';
COMMENT ON COLUMN credits.bonus_credits IS 'Bonus credits from promotions';
COMMENT ON COLUMN credits.rollover_credits IS 'Unused credits rolled over from previous month';
COMMENT ON FUNCTION get_credit_balance IS 'Get current credit balance for a business';
COMMENT ON FUNCTION deduct_credits IS 'Deduct credits from a business account';
COMMENT ON FUNCTION add_credits IS 'Add credits to a business account';
-- Add bookings and booking_slots tables for web booking system
-- Separate from appointments to support multi-step booking flow

-- booking_slots: Available time slots for booking
CREATE TABLE IF NOT EXISTS booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,

  -- Time slot
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,

  -- Availability
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'unavailable')),
  max_bookings INTEGER DEFAULT 1, -- For group sessions
  current_bookings INTEGER DEFAULT 0,

  -- Pricing
  price_cents INTEGER,

  -- Recurrence (for recurring slots)
  recurrence_rule TEXT, -- RRULE format
  recurrence_end_date DATE,
  is_recurring BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- bookings: Customer booking records (pre-appointment)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  booking_slot_id UUID REFERENCES booking_slots(id) ON DELETE SET NULL,

  -- Customer info (before customer record created)
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,

  -- Booking details
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,

  -- Time
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'converted')),

  -- Payment
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partially_paid', 'refunded')),
  payment_amount_cents INTEGER DEFAULT 0,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,

  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,

  -- Conversion tracking
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL, -- If converted to appointment
  converted_at TIMESTAMPTZ,

  -- Source tracking
  booking_source TEXT DEFAULT 'web_widget' CHECK (booking_source IN ('web_widget', 'embedded_form', 'landing_page', 'direct_link', 'mobile_app')),
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Confirmation
  confirmation_code TEXT UNIQUE, -- Unique code for booking confirmation
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Reminders
  reminder_sent_at TIMESTAMPTZ,
  followup_sent_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for booking_slots
CREATE INDEX IF NOT EXISTS idx_booking_slots_business_id ON booking_slots(business_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_service_id ON booking_slots(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_staff_id ON booking_slots(staff_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_date ON booking_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_booking_slots_status ON booking_slots(status);
CREATE INDEX IF NOT EXISTS idx_booking_slots_composite ON booking_slots(business_id, slot_date, status);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_slot_id ON bookings(booking_slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_code ON bookings(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_booking_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_slots_updated_at
  BEFORE UPDATE ON booking_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_slots_updated_at();

CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- Auto-generate confirmation code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_generate_confirmation_code
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_confirmation_code();

-- RLS policies for booking_slots
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available booking slots"
  ON booking_slots FOR SELECT
  USING (status = 'available');

CREATE POLICY "Users can manage booking slots for their businesses"
  ON booking_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = booking_slots.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- RLS policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bookings for their businesses"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = bookings.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true); -- Public booking creation

CREATE POLICY "Users can update bookings for their businesses"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = bookings.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE booking_slots IS 'Available time slots for web booking';
COMMENT ON TABLE bookings IS 'Customer bookings from web (before converted to appointments)';
COMMENT ON COLUMN bookings.confirmation_code IS 'Unique code sent to customer for confirmation';
COMMENT ON COLUMN bookings.appointment_id IS 'If converted to full appointment record';
COMMENT ON COLUMN bookings.booking_source IS 'Where the booking originated from';
