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
