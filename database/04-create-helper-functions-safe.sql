-- Step 4: Create Helper Functions and Views (SAFE VERSION)
-- This version handles different possible column names

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
        ROUND(AVG(
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'base_price') 
                THEN base_price
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'price') 
                THEN price
                ELSE 0
            END
        ), 2) as average_price,
        (SELECT name FROM services WHERE business_id = business_uuid ORDER BY 
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'base_price') 
                THEN base_price
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'price') 
                THEN price
                ELSE 0
            END DESC LIMIT 1
        ) as most_expensive_service,
        (SELECT category FROM services WHERE business_id = business_uuid GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1) as most_popular_category
    FROM services 
    WHERE business_id = business_uuid;
END;
$$ LANGUAGE plpgsql;

-- Simplified function that doesn't depend on specific column names
CREATE OR REPLACE FUNCTION duplicate_services_for_location_basic(
    source_business_uuid UUID,
    target_business_uuid UUID
)
RETURNS INTEGER AS $$
DECLARE
    services_copied INTEGER := 0;
    service_record RECORD;
BEGIN
    -- Get all active services from source business
    FOR service_record IN 
        SELECT name, description, duration_minutes, category, is_active, requires_deposit, deposit_amount
        FROM services 
        WHERE business_id = source_business_uuid AND is_active = true
    LOOP
        -- Insert basic service info (price will need to be set manually)
        INSERT INTO services (
            business_id, name, description, duration_minutes,
            category, is_active, requires_deposit, deposit_amount
        ) VALUES (
            target_business_uuid, service_record.name, service_record.description, 
            service_record.duration_minutes, service_record.category, 
            service_record.is_active, service_record.requires_deposit, 
            service_record.deposit_amount
        );
        
        services_copied := services_copied + 1;
    END LOOP;
    
    RETURN services_copied;
END;
$$ LANGUAGE plpgsql;

-- Safe view that handles different column names
CREATE OR REPLACE VIEW active_services_by_business AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    s.id as service_id,
    s.name as service_name,
    s.category,
    s.duration_minutes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'display_order') 
        THEN COALESCE(s.display_order, 0)
        ELSE 0
    END as display_order
FROM businesses b
JOIN services s ON b.id = s.business_id
WHERE s.is_active = true
ORDER BY b.name, s.name;