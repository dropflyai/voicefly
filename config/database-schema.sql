-- Supabase Database Schema for Nail Salon Appointment System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    
    -- Service details
    service_type VARCHAR(100) NOT NULL,
    service_duration INTEGER NOT NULL DEFAULT 60,
    service_price DECIMAL(10,2),
    
    -- Appointment timing
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Staff assignment
    technician_name VARCHAR(255),
    business_location VARCHAR(255) DEFAULT 'Main Location',
    
    -- Status and metadata
    status VARCHAR(50) DEFAULT 'confirmed',
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    CONSTRAINT valid_duration CHECK (service_duration > 0),
    CONSTRAINT valid_price CHECK (service_price >= 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_customer_email ON appointments(customer_email);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_technician ON appointments(technician_name);
CREATE INDEX IF NOT EXISTS idx_appointments_booking_id ON appointments(booking_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create services table for reference
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_addon BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default services
INSERT INTO services (service_code, name, description, duration_minutes, price, category, is_addon) VALUES
('manicure_signature', 'Signature Manicure', 'Our signature manicure with nail shaping, cuticle care, and polish', 60, 45.00, 'manicure', FALSE),
('manicure_gel', 'Gel Manicure', 'Long-lasting gel polish manicure', 75, 55.00, 'manicure', FALSE),
('pedicure_signature', 'Signature Pedicure', 'Relaxing pedicure with foot soak, scrub, and massage', 75, 50.00, 'pedicure', FALSE),
('pedicure_spa', 'Spa Pedicure', 'Luxurious spa pedicure with extended massage and treatment', 90, 65.00, 'pedicure', FALSE),
('combo_mani_pedi', 'Mani + Pedi Combo', 'Complete manicure and pedicure package', 120, 85.00, 'combo', FALSE),
('nail_art', 'Nail Art Design', 'Custom nail art and design service', 30, 25.00, 'enhancement', TRUE),
('gel_removal', 'Gel Polish Removal', 'Safe removal of existing gel polish', 20, 15.00, 'enhancement', TRUE)
ON CONFLICT (service_code) DO NOTHING;

-- Create technicians table
CREATE TABLE IF NOT EXISTS technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    specialties TEXT[], -- Array of specialty categories
    is_active BOOLEAN DEFAULT TRUE,
    schedule JSONB, -- Store weekly schedule as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default technicians
INSERT INTO technicians (name, email, specialties, schedule) VALUES
('Sarah Johnson', 'sarah@dropflybeauty.com', ARRAY['manicure', 'enhancement'], 
 '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}, "saturday": {"start": "09:00", "end": "15:00"}, "sunday": "off"}'),
('Maya Rodriguez', 'maya@dropflybeauty.com', ARRAY['pedicure', 'combo'],
 '{"monday": {"start": "10:00", "end": "18:00"}, "tuesday": {"start": "10:00", "end": "18:00"}, "wednesday": {"start": "10:00", "end": "18:00"}, "thursday": {"start": "10:00", "end": "18:00"}, "friday": {"start": "10:00", "end": "18:00"}, "saturday": {"start": "09:00", "end": "16:00"}, "sunday": "off"}'),
('Jessica Chen', 'jessica@dropflybeauty.com', ARRAY['combo', 'manicure', 'pedicure'],
 '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": "off", "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}, "saturday": {"start": "09:00", "end": "16:00"}, "sunday": {"start": "11:00", "end": "15:00"}}')
ON CONFLICT (email) DO NOTHING;

-- Create RLS (Row Level Security) policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can do everything" ON appointments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON services FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON technicians FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous read access to services and technicians (for booking interface)
CREATE POLICY "Anonymous can read services" ON services FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Anonymous can read technicians" ON technicians FOR SELECT USING (is_active = TRUE);

-- Allow anonymous to insert appointments (for booking)
CREATE POLICY "Anonymous can create appointments" ON appointments FOR INSERT WITH CHECK (TRUE);

-- Create view for available appointment slots
CREATE OR REPLACE VIEW available_slots AS
SELECT 
    date_trunc('day', generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        '1 day'::interval
    )) AS date,
    generate_series(
        '09:00'::time,
        '17:00'::time,
        '30 minutes'::interval
    ) AS time_slot,
    t.name as technician_name,
    t.specialties
FROM technicians t
CROSS JOIN generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    '1 day'::interval
) AS dates
WHERE t.is_active = TRUE;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT ON appointments TO anon;
GRANT SELECT ON services TO anon;
GRANT SELECT ON technicians TO anon;
GRANT SELECT ON available_slots TO anon;