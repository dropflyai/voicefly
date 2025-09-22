-- Step 4B: Create Revenue View (Optional)
-- Only run this if you have the payments and appointments tables set up

-- Check if required tables exist before creating the revenue view
DO $$
BEGIN
    -- Only create revenue view if both required tables exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments') THEN
        
        -- Create the revenue summary view
        CREATE OR REPLACE VIEW service_revenue_summary AS
        SELECT 
            s.business_id,
            s.id as service_id,
            s.name as service_name,
            s.base_price,
            COUNT(a.id) as total_appointments,
            COALESCE(SUM(p.total_amount), 0) as total_revenue,
            COALESCE(AVG(p.total_amount), 0) as average_revenue_per_appointment
        FROM services s
        LEFT JOIN appointments a ON s.id = a.service_id
        LEFT JOIN payments p ON a.id = p.appointment_id AND p.status = 'paid'
        GROUP BY s.business_id, s.id, s.name, s.base_price
        ORDER BY total_revenue DESC NULLS LAST;
        
        RAISE NOTICE 'Revenue summary view created successfully';
    ELSE
        RAISE NOTICE 'Skipping revenue view - required tables (payments/appointments) not found';
    END IF;
END $$;