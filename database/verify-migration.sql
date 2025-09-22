-- Verify Migration Success
-- Run this to confirm all changes were applied correctly

-- 1. Check that 'business' tier was added to enum
SELECT enumlabel as available_tiers
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'subscription_tier'
ORDER BY e.enumsortorder;

-- 2. Check new columns were added to services table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'services' 
AND column_name IN ('display_order', 'service_type', 'is_featured', 'settings')
ORDER BY column_name;

-- 3. Check new columns were added to businesses table  
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'businesses'
AND column_name IN ('settings', 'owner_email', 'owner_first_name', 'owner_last_name', 'vapi_assistant_id')
ORDER BY column_name;

-- 4. Check service_categories table was created
SELECT table_name, 
       (SELECT COUNT(*) FROM service_categories) as total_categories
FROM information_schema.tables 
WHERE table_name = 'service_categories';

-- 5. Test the helper functions
SELECT 'Functions created successfully' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'count_business_services'
) AND EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_business_service_names'
);

-- 6. Check the view was created
SELECT table_name as view_name
FROM information_schema.views 
WHERE table_name = 'business_services_basic';