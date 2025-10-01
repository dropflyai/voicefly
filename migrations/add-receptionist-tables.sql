-- Migration: Add Receptionist Tables
-- Safe migration that adds new tables without affecting existing beauty salon functionality
-- Created: January 2025

-- 1. Add business_type column to businesses table (safe default)
DO $$ 
BEGIN
  -- Only add business_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'business_type'
  ) THEN
    ALTER TABLE businesses 
    ADD COLUMN business_type VARCHAR(50) DEFAULT 'beauty_salon';
    
    -- Set all existing businesses to beauty_salon (protects current customers)
    UPDATE businesses 
    SET business_type = 'beauty_salon' 
    WHERE business_type IS NULL;
    
    -- Add constraint for valid business types
    ALTER TABLE businesses 
    ADD CONSTRAINT businesses_business_type_check 
    CHECK (business_type IN ('beauty_salon', 'general_business', 'home_services', 'medical_dental', 'professional_services'));
    
    COMMENT ON COLUMN businesses.business_type IS 'Type of business determines dashboard features and Maya personality';
  END IF;
END $$;

-- 2. Create call_logs table for receptionist features
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Caller Information
  caller_name VARCHAR(255),
  caller_phone VARCHAR(20),
  caller_email VARCHAR(255),
  caller_company VARCHAR(255),
  
  -- Call Details
  call_type VARCHAR(50) DEFAULT 'inquiry' CHECK (call_type IN ('inquiry', 'support', 'appointment', 'sales', 'urgent', 'callback')),
  message TEXT NOT NULL,
  call_summary TEXT, -- AI-generated summary
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('urgent', 'high', 'normal', 'low')),
  
  -- Status & Assignment
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'in_progress', 'resolved', 'callback_needed')),
  assigned_to VARCHAR(255), -- Staff member name or email
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,
  callback_scheduled_for TIMESTAMP WITH TIME ZONE,
  
  -- VAPI Integration
  maya_call_id VARCHAR(255), -- VAPI call ID for reference
  call_duration INTEGER DEFAULT 0, -- Duration in seconds
  call_recording_url TEXT,
  call_transcript TEXT,
  
  -- Metadata
  source VARCHAR(50) DEFAULT 'voice' CHECK (source IN ('voice', 'web', 'email', 'chat')),
  tags TEXT[], -- Array of tags for categorization
  internal_notes TEXT, -- Private notes for staff
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_business_id ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_urgency ON call_logs(urgency);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_assigned_to ON call_logs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_call_logs_follow_up_date ON call_logs(follow_up_date) WHERE follow_up_required = true;

-- Add comments
COMMENT ON TABLE call_logs IS 'Stores all incoming calls handled by Maya for general business receptionists';
COMMENT ON COLUMN call_logs.call_type IS 'Type of call: inquiry, support, appointment, sales, urgent, callback';
COMMENT ON COLUMN call_logs.urgency IS 'Priority level determined by Maya based on call content';
COMMENT ON COLUMN call_logs.status IS 'Current status of the call/message';

-- 3. Create leads table for general business lead management
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Lead Information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  job_title VARCHAR(255),
  
  -- Lead Details
  source VARCHAR(50) DEFAULT 'phone' CHECK (source IN ('phone', 'web', 'email', 'referral', 'advertising', 'social', 'walk_in')),
  source_details TEXT, -- How exactly they found the business
  
  -- Qualification
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'won', 'lost', 'nurturing')),
  interest TEXT, -- What they're interested in
  budget_range VARCHAR(50), -- e.g. "$5k-10k", "Under $5k", "$50k+"
  timeline VARCHAR(50), -- e.g. "Immediate", "1-3 months", "Planning for next year"
  decision_maker BOOLEAN DEFAULT false,
  pain_points TEXT, -- What problems they need solved
  
  -- Maya AI Qualification
  maya_qualified BOOLEAN DEFAULT false,
  qualification_score INTEGER CHECK (qualification_score >= 1 AND qualification_score <= 10),
  maya_notes TEXT, -- AI-generated notes about the lead
  
  -- Assignment & Follow-up
  assigned_to VARCHAR(255),
  assigned_at TIMESTAMP WITH TIME ZONE,
  next_follow_up_date DATE,
  follow_up_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (follow_up_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  
  -- Interaction Tracking
  last_contact_date DATE,
  total_interactions INTEGER DEFAULT 1,
  emails_sent INTEGER DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  meetings_held INTEGER DEFAULT 0,
  
  -- Conversion Tracking
  estimated_value DECIMAL(10,2),
  probability_percentage INTEGER CHECK (probability_percentage >= 0 AND probability_percentage <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  close_reason TEXT, -- Why won/lost
  
  -- Metadata
  tags TEXT[], -- Array of tags for categorization
  custom_fields JSONB DEFAULT '{}', -- Flexible field storage
  internal_notes TEXT,
  
  -- Related Records
  related_call_log_id UUID REFERENCES call_logs(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up_date ON leads(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_qualification_score ON leads(qualification_score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone) WHERE phone IS NOT NULL;

-- Add comments
COMMENT ON TABLE leads IS 'Stores leads and prospects for general business receptionist features';
COMMENT ON COLUMN leads.maya_qualified IS 'Whether Maya successfully qualified this lead during initial call';
COMMENT ON COLUMN leads.qualification_score IS 'Maya-generated lead quality score from 1-10';

-- 4. Create business_features table for feature enablement
CREATE TABLE IF NOT EXISTS business_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Feature flags for this specific business
  appointments BOOLEAN DEFAULT false,
  services BOOLEAN DEFAULT false,
  staff BOOLEAN DEFAULT false,
  receptionist BOOLEAN DEFAULT false,
  call_logs BOOLEAN DEFAULT false,
  lead_management BOOLEAN DEFAULT false,
  multi_calendar BOOLEAN DEFAULT false,
  crm_integration BOOLEAN DEFAULT false,
  
  -- Pricing tier
  pricing_tier VARCHAR(50) DEFAULT 'starter' CHECK (pricing_tier IN ('starter', 'professional', 'business', 'enterprise')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(business_id)
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_business_features_business_id ON business_features(business_id);

-- Add comment
COMMENT ON TABLE business_features IS 'Feature enablement per business for multi-product functionality';

-- 5. Enable Row Level Security (RLS) on new tables
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_features ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies to ensure data isolation between businesses

-- Call logs policies
CREATE POLICY "Businesses can view own call logs" ON call_logs
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE id = current_setting('app.current_business_id')::UUID
      OR auth.uid()::TEXT = current_setting('app.current_business_id')
    )
  );

-- Leads policies  
CREATE POLICY "Businesses can view own leads" ON leads
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE id = current_setting('app.current_business_id')::UUID
      OR auth.uid()::TEXT = current_setting('app.current_business_id')
    )
  );

-- Business features policies
CREATE POLICY "Businesses can view own features" ON business_features
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses 
      WHERE id = current_setting('app.current_business_id')::UUID
      OR auth.uid()::TEXT = current_setting('app.current_business_id')
    )
  );

-- 7. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Add updated_at triggers to new tables
DROP TRIGGER IF EXISTS update_call_logs_updated_at ON call_logs;
CREATE TRIGGER update_call_logs_updated_at 
    BEFORE UPDATE ON call_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_features_updated_at ON business_features;
CREATE TRIGGER update_business_features_updated_at 
    BEFORE UPDATE ON business_features 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert default features for existing businesses (beauty salon features)
INSERT INTO business_features (business_id, appointments, services, staff, receptionist, call_logs, lead_management)
SELECT 
  id as business_id,
  true as appointments,
  true as services, 
  true as staff,
  false as receptionist,
  false as call_logs,
  false as lead_management
FROM businesses 
WHERE business_type = 'beauty_salon'
ON CONFLICT (business_id) DO NOTHING;

-- Migration completed successfully
-- All existing beauty salon functionality is preserved
-- New receptionist features are available but disabled by default