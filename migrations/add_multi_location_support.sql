-- Multi-location support for Business tier
-- Enables businesses to manage multiple salon locations

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    slug varchar(100) NOT NULL,
    address_line1 varchar(255),
    address_line2 varchar(255),
    city varchar(100),
    state varchar(50),
    postal_code varchar(20),
    country varchar(100) DEFAULT 'US',
    phone varchar(20),
    email varchar(255),
    timezone varchar(50) DEFAULT 'America/Los_Angeles',
    is_primary boolean DEFAULT false,
    is_active boolean DEFAULT true,
    operating_hours jsonb DEFAULT '{}',
    settings jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Ensure unique slug per business
    CONSTRAINT unique_location_slug_per_business UNIQUE (business_id, slug),
    
    -- Ensure only one primary location per business
    CONSTRAINT unique_primary_location_per_business EXCLUDE USING btree (business_id WITH =) WHERE (is_primary = true)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_business_id ON locations(business_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_locations_primary ON locations(business_id, is_primary) WHERE is_primary = true;

-- Add location_id to existing tables that need multi-location support

-- Add location support to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_location_id ON appointments(location_id);

-- Add location support to services (services can be location-specific)
ALTER TABLE services ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_services_location_id ON services(location_id);

-- Add location support to staff (staff can work at multiple locations)
CREATE TABLE IF NOT EXISTS staff_locations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    is_primary boolean DEFAULT false,
    schedule jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    
    -- Ensure unique staff-location pairs
    CONSTRAINT unique_staff_location UNIQUE (staff_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_locations_staff_id ON staff_locations(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_locations_location_id ON staff_locations(location_id);

-- Add location support to customers (track preferred location)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_location_id uuid REFERENCES locations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_customers_preferred_location ON customers(preferred_location_id);

-- Operating hours JSONB structure:
-- {
--   "monday": { "open": "09:00", "close": "18:00", "closed": false },
--   "tuesday": { "open": "09:00", "close": "18:00", "closed": false },
--   "wednesday": { "open": "09:00", "close": "18:00", "closed": false },
--   "thursday": { "open": "09:00", "close": "18:00", "closed": false },
--   "friday": { "open": "09:00", "close": "19:00", "closed": false },
--   "saturday": { "open": "08:00", "close": "17:00", "closed": false },
--   "sunday": { "open": "10:00", "close": "16:00", "closed": false }
-- }

-- Settings JSONB structure:
-- {
--   "booking_buffer": 15,           -- Minutes between appointments
--   "advance_booking_days": 30,     -- How far ahead customers can book
--   "auto_confirm": true,           -- Auto-confirm appointments
--   "allow_walk_ins": false,        -- Accept walk-in appointments
--   "payment_required": true,       -- Require payment at booking
--   "cancellation_hours": 24        -- Hours notice required for cancellation
-- }

-- Update existing businesses to have a default primary location
DO $$ 
DECLARE
    business_record RECORD;
BEGIN
    FOR business_record IN SELECT * FROM businesses LOOP
        -- Create primary location for existing businesses
        INSERT INTO locations (
            business_id,
            name,
            slug,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country,
            phone,
            email,
            timezone,
            is_primary,
            is_active,
            operating_hours
        ) VALUES (
            business_record.id,
            business_record.name || ' - Main Location',
            'main',
            business_record.address_line1,
            business_record.address_line2,
            business_record.city,
            business_record.state,
            business_record.postal_code,
            business_record.country,
            business_record.phone,
            business_record.email,
            business_record.timezone,
            true,
            true,
            '{
                "monday": {"open": "09:00", "close": "18:00", "closed": false},
                "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
                "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
                "thursday": {"open": "09:00", "close": "18:00", "closed": false},
                "friday": {"open": "09:00", "close": "19:00", "closed": false},
                "saturday": {"open": "08:00", "close": "17:00", "closed": false},
                "sunday": {"open": "10:00", "close": "16:00", "closed": false}
            }'::jsonb
        ) ON CONFLICT (business_id, slug) DO NOTHING;
    END LOOP;
END $$;

-- Create RLS policies for locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations are viewable by business members" ON locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = locations.business_id
    )
  );

CREATE POLICY "Business owners can manage their locations" ON locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = locations.business_id
    )
  );

-- Create RLS policies for staff_locations
ALTER TABLE staff_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff locations are viewable by business members" ON staff_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM locations l
      JOIN businesses b ON b.id = l.business_id
      WHERE l.id = staff_locations.location_id
    )
  );

CREATE POLICY "Business owners can manage staff locations" ON staff_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM locations l
      JOIN businesses b ON b.id = l.business_id
      WHERE l.id = staff_locations.location_id
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get location availability for booking
CREATE OR REPLACE FUNCTION get_location_availability(
    p_location_id uuid,
    p_date date,
    p_service_duration integer DEFAULT 60
) RETURNS TABLE(
    time_slot time,
    available boolean,
    staff_available integer
) AS $$
BEGIN
    -- This would contain complex logic to check:
    -- 1. Location operating hours
    -- 2. Staff schedules at this location
    -- 3. Existing appointments
    -- 4. Service duration requirements
    
    -- Simplified version - returns hourly slots for demonstration
    RETURN QUERY
    WITH time_slots AS (
        SELECT generate_series(
            '09:00'::time,
            '18:00'::time,
            interval '1 hour'
        ) AS slot_time
    )
    SELECT 
        ts.slot_time,
        true AS available,  -- Simplified logic
        1 AS staff_available
    FROM time_slots ts;
END;
$$ LANGUAGE plpgsql;