-- Schema Migration: Add Web Booking Support Columns
-- Purpose: Add missing columns expected by webhook-server.js web booking endpoint
-- Date: August 27, 2025

-- Add missing columns to appointments table for web booking compatibility
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS booking_source VARCHAR(50) DEFAULT 'web_widget',
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255), -- Temporary field for web bookings without customer_id
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20), -- Temporary field for web bookings without customer_id  
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255); -- Temporary field for web bookings without customer_id

-- Add comments for clarity
COMMENT ON COLUMN appointments.duration_minutes IS 'Duration of appointment in minutes';
COMMENT ON COLUMN appointments.customer_notes IS 'Notes provided by customer during booking';
COMMENT ON COLUMN appointments.booking_source IS 'Source of booking: web_widget, phone, sms, etc';
COMMENT ON COLUMN appointments.customer_name IS 'Customer name for web bookings (temporary until customer record created)';
COMMENT ON COLUMN appointments.customer_phone IS 'Customer phone for web bookings (temporary until customer record created)';
COMMENT ON COLUMN appointments.customer_email IS 'Customer email for web bookings (temporary until customer record created)';

-- Create index on booking_source for analytics
CREATE INDEX IF NOT EXISTS idx_appointments_booking_source ON appointments(booking_source);

-- Create index on customer_phone for lookups
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);

-- Update the existing appointments table to have better defaults
ALTER TABLE appointments 
ALTER COLUMN notes SET DEFAULT NULL,
ALTER COLUMN internal_notes SET DEFAULT NULL;

-- Add check constraint for appointment status
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'));

-- Ensure business_id is always required
ALTER TABLE appointments 
ALTER COLUMN business_id SET NOT NULL;

-- Create view for web booking analytics
CREATE OR REPLACE VIEW web_booking_analytics AS
SELECT 
    business_id,
    DATE(appointment_date) as booking_date,
    booking_source,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
    AVG(duration_minutes) as avg_duration
FROM appointments 
WHERE booking_source IS NOT NULL
GROUP BY business_id, DATE(appointment_date), booking_source
ORDER BY booking_date DESC;

-- Grant necessary permissions
GRANT SELECT ON web_booking_analytics TO anon, authenticated;

-- Success message
SELECT 'Schema migration completed successfully - web booking columns added' as message;