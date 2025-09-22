-- Step 3: Create Service Categories Table
-- This helps organize services better for different businesses

-- Create service categories table
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, name)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_service_categories_business ON service_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(business_id, is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_service_categories_updated_at 
    BEFORE UPDATE ON service_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories for existing businesses
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