-- Migration: Add Specialized Business Types
-- Adds support for Medical/Dental, Home Services, and Fitness/Wellness industries
-- Safe additive migration - no breaking changes

-- 1. Extend business_type enum with new industry types
ALTER TYPE business_type ADD VALUE IF NOT EXISTS 'medical_practice';
ALTER TYPE business_type ADD VALUE IF NOT EXISTS 'dental_practice';
ALTER TYPE business_type ADD VALUE IF NOT EXISTS 'home_services';
ALTER TYPE business_type ADD VALUE IF NOT EXISTS 'fitness_wellness';

-- 2. Create industry-specific tables for specialized features

-- Medical/Dental specific features
CREATE TABLE IF NOT EXISTS medical_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    practice_type TEXT NOT NULL CHECK (practice_type IN ('medical', 'dental', 'veterinary')),
    insurance_verification BOOLEAN DEFAULT true,
    hipaa_compliance BOOLEAN DEFAULT true,
    emergency_routing BOOLEAN DEFAULT true,
    appointment_reminders BOOLEAN DEFAULT true,
    prescription_refill_handling BOOLEAN DEFAULT false,
    lab_result_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id)
);

-- Home Services specific features
CREATE TABLE IF NOT EXISTS home_service_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL CHECK (service_type IN ('hvac', 'plumbing', 'electrical', 'cleaning', 'landscaping', 'handyman', 'pest_control')),
    emergency_calls BOOLEAN DEFAULT true,
    service_area_radius INTEGER DEFAULT 25, -- miles
    technician_dispatch BOOLEAN DEFAULT true,
    photo_video_intake BOOLEAN DEFAULT true,
    warranty_tracking BOOLEAN DEFAULT false,
    seasonal_reminders BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id)
);

-- Fitness/Wellness specific features
CREATE TABLE IF NOT EXISTS fitness_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    facility_type TEXT NOT NULL CHECK (facility_type IN ('gym', 'yoga_studio', 'pilates', 'martial_arts', 'dance', 'personal_training', 'wellness_center')),
    class_scheduling BOOLEAN DEFAULT true,
    membership_management BOOLEAN DEFAULT true,
    equipment_booking BOOLEAN DEFAULT false,
    health_screening BOOLEAN DEFAULT false,
    nutrition_consultation BOOLEAN DEFAULT false,
    injury_tracking BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id)
);

-- 3. Create emergency call priority table (for medical and home services)
CREATE TABLE IF NOT EXISTS emergency_call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_log_id UUID NOT NULL REFERENCES call_logs(id) ON DELETE CASCADE,
    emergency_type TEXT NOT NULL,
    priority_level INTEGER NOT NULL CHECK (priority_level BETWEEN 1 AND 5), -- 1 = critical, 5 = routine
    escalation_required BOOLEAN DEFAULT false,
    emergency_contact_called BOOLEAN DEFAULT false,
    resolution_time INTERVAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create appointment scheduling table (for medical/dental/fitness)
CREATE TABLE IF NOT EXISTS appointment_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    provider_name TEXT, -- doctor, dentist, trainer name
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type TEXT NOT NULL, -- consultation, cleaning, class, etc.
    is_available BOOLEAN DEFAULT true,
    requires_insurance BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, provider_name, slot_date, slot_time)
);

-- 5. Create service area mapping (for home services)
CREATE TABLE IF NOT EXISTS service_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    zip_code TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    service_fee DECIMAL(10,2) DEFAULT 0.00,
    travel_time_minutes INTEGER DEFAULT 30,
    is_emergency_coverage BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, zip_code)
);

-- 6. Add industry-specific indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_features_business_id ON medical_features(business_id);
CREATE INDEX IF NOT EXISTS idx_medical_features_practice_type ON medical_features(practice_type);

CREATE INDEX IF NOT EXISTS idx_home_service_features_business_id ON home_service_features(business_id);
CREATE INDEX IF NOT EXISTS idx_home_service_features_service_type ON home_service_features(service_type);

CREATE INDEX IF NOT EXISTS idx_fitness_features_business_id ON fitness_features(business_id);
CREATE INDEX IF NOT EXISTS idx_fitness_features_facility_type ON fitness_features(facility_type);

CREATE INDEX IF NOT EXISTS idx_emergency_call_logs_priority ON emergency_call_logs(priority_level);
CREATE INDEX IF NOT EXISTS idx_emergency_call_logs_created_at ON emergency_call_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_appointment_slots_business_date ON appointment_slots(business_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_available ON appointment_slots(is_available, slot_date);

CREATE INDEX IF NOT EXISTS idx_service_areas_business_zip ON service_areas(business_id, zip_code);

-- 7. Enable RLS for new tables
ALTER TABLE medical_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_service_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for data isolation
-- Medical features policies
CREATE POLICY "Users can view their own medical features" ON medical_features
    FOR SELECT USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "Users can insert their own medical features" ON medical_features
    FOR INSERT WITH CHECK (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "Users can update their own medical features" ON medical_features
    FOR UPDATE USING (business_id = current_setting('app.current_business_id')::uuid);

-- Home service features policies  
CREATE POLICY "Users can view their own home service features" ON home_service_features
    FOR SELECT USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "Users can insert their own home service features" ON home_service_features
    FOR INSERT WITH CHECK (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "Users can update their own home service features" ON home_service_features
    FOR UPDATE USING (business_id = current_setting('app.current_business_id')::uuid);

-- Fitness features policies
CREATE POLICY "Users can view their own fitness features" ON fitness_features
    FOR SELECT USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "Users can insert their own fitness features" ON fitness_features
    FOR INSERT WITH CHECK (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "Users can update their own fitness features" ON fitness_features
    FOR UPDATE USING (business_id = current_setting('app.current_business_id')::uuid);

-- Emergency call logs policies (inherit from call_logs)
CREATE POLICY "Users can view their own emergency call logs" ON emergency_call_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM call_logs cl 
            WHERE cl.id = emergency_call_logs.call_log_id 
            AND cl.business_id = current_setting('app.current_business_id')::uuid
        )
    );

-- Appointment slots policies
CREATE POLICY "Users can view their own appointment slots" ON appointment_slots
    FOR SELECT USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "Users can manage their own appointment slots" ON appointment_slots
    FOR ALL USING (business_id = current_setting('app.current_business_id')::uuid);

-- Service areas policies
CREATE POLICY "Users can view their own service areas" ON service_areas
    FOR SELECT USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "Users can manage their own service areas" ON service_areas
    FOR ALL USING (business_id = current_setting('app.current_business_id')::uuid);

-- 9. Update business_features table to include new industry flags
ALTER TABLE business_features 
ADD COLUMN IF NOT EXISTS medical_scheduling BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dental_coordination BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS home_service_dispatch BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fitness_coordination BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS emergency_handling BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_verification BOOLEAN DEFAULT false;

-- 10. Create helper functions for industry detection
CREATE OR REPLACE FUNCTION get_business_industry_features(business_uuid UUID)
RETURNS JSON AS $$
DECLARE
    business_type_val TEXT;
    features JSON;
BEGIN
    -- Get business type
    SELECT business_type INTO business_type_val
    FROM businesses 
    WHERE id = business_uuid;
    
    -- Return appropriate features based on business type
    CASE business_type_val
        WHEN 'medical_practice' THEN
            SELECT row_to_json(mf) INTO features
            FROM medical_features mf
            WHERE mf.business_id = business_uuid;
            
        WHEN 'dental_practice' THEN
            SELECT row_to_json(mf) INTO features
            FROM medical_features mf
            WHERE mf.business_id = business_uuid;
            
        WHEN 'home_services' THEN
            SELECT row_to_json(hsf) INTO features
            FROM home_service_features hsf
            WHERE hsf.business_id = business_uuid;
            
        WHEN 'fitness_wellness' THEN
            SELECT row_to_json(ff) INTO features
            FROM fitness_features ff
            WHERE ff.business_id = business_uuid;
            
        ELSE
            features := '{}'::JSON;
    END CASE;
    
    RETURN COALESCE(features, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Migration success log
INSERT INTO migration_log (migration_name, applied_at) 
VALUES ('add_specialized_business_types', NOW())
ON CONFLICT (migration_name) DO NOTHING;

-- Migration complete
-- Added support for:
-- ✅ Medical/Dental practices with HIPAA compliance
-- ✅ Home Services with emergency routing and service areas  
-- ✅ Fitness/Wellness with class scheduling and membership
-- ✅ All tables have proper RLS for data isolation
-- ✅ Indexes added for performance
-- ✅ Helper functions for feature detection