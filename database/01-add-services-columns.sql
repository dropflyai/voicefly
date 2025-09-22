-- Step 1: Add Essential Columns to Services Table
-- These are the core columns needed for service customization

-- Add new columns to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_consultation BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 30;
ALTER TABLE services ADD COLUMN IF NOT EXISTS min_advance_booking_hours INTEGER DEFAULT 2;

-- Add settings column for additional service configuration
ALTER TABLE services ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(business_id, display_order);
CREATE INDEX IF NOT EXISTS idx_services_featured ON services(business_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_services_type ON services(business_id, service_type);

-- Update existing services to have proper display order
UPDATE services 
SET display_order = (
  SELECT ROW_NUMBER() OVER (PARTITION BY business_id ORDER BY created_at)
  FROM services s2 
  WHERE s2.id = services.id
)
WHERE display_order = 0;