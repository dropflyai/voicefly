-- Step 4: Minimal Helper Functions (No Dependencies)
-- This version avoids any potential column name issues

-- Simple function to count services for a business
CREATE OR REPLACE FUNCTION count_business_services(business_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*)::INTEGER FROM services WHERE business_id = business_uuid AND is_active = true);
END;
$$ LANGUAGE plpgsql;

-- Function to get service names for a business
CREATE OR REPLACE FUNCTION get_business_service_names(business_uuid UUID)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT name 
        FROM services 
        WHERE business_id = business_uuid AND is_active = true 
        ORDER BY created_at
    );
END;
$$ LANGUAGE plpgsql;

-- Basic view for services (using only guaranteed columns)
CREATE OR REPLACE VIEW business_services_basic AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    b.subscription_tier,
    s.id as service_id,
    s.name as service_name,
    s.category,
    s.duration_minutes,
    s.is_active,
    s.created_at
FROM businesses b
JOIN services s ON b.id = s.business_id
WHERE s.is_active = true
ORDER BY b.name, s.created_at;