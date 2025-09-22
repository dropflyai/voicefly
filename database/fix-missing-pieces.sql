-- Fix Missing Pieces
-- Add the missing settings column and populate service categories

-- 1. Add missing settings column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- 2. Populate service categories with defaults for existing businesses
-- (This will only add categories if businesses exist)
INSERT INTO service_categories (business_id, name, description, display_order)
SELECT b.id, 'Manicure Services', 'Professional manicure services', 1
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM service_categories sc 
    WHERE sc.business_id = b.id AND sc.name = 'Manicure Services'
);

INSERT INTO service_categories (business_id, name, description, display_order)
SELECT b.id, 'Pedicure Services', 'Professional pedicure services', 2
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM service_categories sc 
    WHERE sc.business_id = b.id AND sc.name = 'Pedicure Services'
);

INSERT INTO service_categories (business_id, name, description, display_order)
SELECT b.id, 'Combo Packages', 'Money-saving combination services', 3
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM service_categories sc 
    WHERE sc.business_id = b.id AND sc.name = 'Combo Packages'
);

INSERT INTO service_categories (business_id, name, description, display_order)
SELECT b.id, 'Add-on Services', 'Enhancement and specialty services', 4
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM service_categories sc 
    WHERE sc.business_id = b.id AND sc.name = 'Add-on Services'
);

-- 3. Verify the fixes
SELECT 'Settings column added to services table' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'settings'
);

SELECT COUNT(*) as total_service_categories FROM service_categories;
SELECT COUNT(*) as total_businesses FROM businesses;