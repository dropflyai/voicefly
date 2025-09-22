-- Step 4: Create Helper Functions and Views (FIXED VERSION)
-- These provide useful utilities for service management

-- Function to get service statistics for a business
CREATE OR REPLACE FUNCTION get_service_stats(business_uuid UUID)
RETURNS TABLE(
    total_services INTEGER,
    active_services INTEGER,
    average_price DECIMAL(10,2),
    most_expensive_service VARCHAR(255),
    most_popular_category VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_services,
        COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_services,
        ROUND(AVG(base_price), 2) as average_price,
        (SELECT name FROM services WHERE business_id = business_uuid ORDER BY base_price DESC LIMIT 1) as most_expensive_service,
        (SELECT category FROM services WHERE business_id = business_uuid GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1) as most_popular_category
    FROM services 
    WHERE business_id = business_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to duplicate services when creating a new location (for Business tier)
CREATE OR REPLACE FUNCTION duplicate_services_for_location(
    source_business_uuid UUID,
    target_business_uuid UUID
)
RETURNS INTEGER AS $$
DECLARE
    services_copied INTEGER := 0;
    service_record RECORD;
BEGIN
    FOR service_record IN 
        SELECT * FROM services WHERE business_id = source_business_uuid AND is_active = true
    LOOP
        INSERT INTO services (
            business_id, name, description, duration_minutes, base_price, 
            category, is_active, requires_deposit, deposit_amount, 
            display_order, service_type, settings
        ) VALUES (
            target_business_uuid, service_record.name, service_record.description, 
            service_record.duration_minutes, service_record.base_price,
            service_record.category, service_record.is_active, 
            service_record.requires_deposit, service_record.deposit_amount,
            service_record.display_order, 
            COALESCE(service_record.service_type, 'standard'), 
            COALESCE(service_record.settings, '{}'::jsonb)
        );
        
        services_copied := services_copied + 1;
    END LOOP;
    
    RETURN services_copied;
END;
$$ LANGUAGE plpgsql;

-- View for active services by business
CREATE OR REPLACE VIEW active_services_by_business AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    s.id as service_id,
    s.name as service_name,
    s.category,
    s.base_price,
    s.duration_minutes,
    COALESCE(s.display_order, 0) as display_order
FROM businesses b
JOIN services s ON b.id = s.business_id
WHERE s.is_active = true
ORDER BY b.name, s.display_order, s.name;