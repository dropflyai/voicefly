-- SMS Communication Module Database Tables
-- Run this migration in Supabase SQL Editor

-- ========================================
-- 1. Incoming SMS Messages Table
-- ========================================
CREATE TABLE IF NOT EXISTS incoming_sms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  message_body TEXT NOT NULL,
  twilio_sid VARCHAR(100) UNIQUE,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'received',
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_incoming_sms_from ON incoming_sms(from_number);
CREATE INDEX idx_incoming_sms_received ON incoming_sms(received_at);
CREATE INDEX idx_incoming_sms_processed ON incoming_sms(processed);

COMMENT ON TABLE incoming_sms IS 'Stores all incoming SMS messages from customers';

-- ========================================
-- 2. SMS Opt-Outs Table (TCPA Compliance)
-- ========================================
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  opted_out_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason VARCHAR(100),
  method VARCHAR(50) DEFAULT 'sms_reply',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_opt_outs_phone ON sms_opt_outs(phone_number);

COMMENT ON TABLE sms_opt_outs IS 'Tracks customers who have opted out of SMS communications (TCPA compliance)';

-- ========================================
-- 3. SMS Consent Table (TCPA Compliance)
-- ========================================
CREATE TABLE IF NOT EXISTS sms_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  phone_number VARCHAR(20) NOT NULL,
  business_id UUID REFERENCES businesses(id),
  consent_type VARCHAR(50) NOT NULL, -- 'express_written', 'express_oral', 'implied'
  consented_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  consent_method VARCHAR(50) NOT NULL, -- 'web_form', 'phone', 'in_person', 'sms_reply'
  purpose TEXT[], -- Array of purposes: ['appointment_reminders', 'promotional', 'transactional']
  is_active BOOLEAN DEFAULT TRUE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consent_phone ON sms_consent(phone_number);
CREATE INDEX idx_consent_business ON sms_consent(business_id);
CREATE INDEX idx_consent_active ON sms_consent(is_active);

COMMENT ON TABLE sms_consent IS 'Tracks customer consent for SMS communications (TCPA compliance)';

-- ========================================
-- 4. SMS Compliance Log Table
-- ========================================
CREATE TABLE IF NOT EXISTS sms_compliance_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) NOT NULL,
  business_id UUID REFERENCES businesses(id),
  check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  allowed BOOLEAN NOT NULL,
  reason TEXT,
  checked_opt_out BOOLEAN DEFAULT TRUE,
  checked_consent BOOLEAN DEFAULT TRUE,
  checked_quiet_hours BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_compliance_log_timestamp ON sms_compliance_log(check_timestamp);
CREATE INDEX idx_compliance_log_business ON sms_compliance_log(business_id);

COMMENT ON TABLE sms_compliance_log IS 'Audit log of TCPA compliance checks before sending SMS';

-- ========================================
-- 5. Update Appointments Table
-- Add columns for SMS reminder tracking
-- ========================================
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_2h_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_2h_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS no_show_followup_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS no_show_followup_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS reschedule_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reschedule_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS confirmation_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- ========================================
-- 6. Update Customers Table
-- Add columns for SMS engagement tracking
-- ========================================
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS birthday_message_sent_this_year BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS service_reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_sms_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sms_opt_in_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sms_opt_out_date TIMESTAMP WITH TIME ZONE;

-- ========================================
-- 7. SMS Campaign Table (for bulk sends)
-- ========================================
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  template_name VARCHAR(100),
  custom_message TEXT,
  target_audience TEXT, -- JSON with filter criteria
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'failed'
  total_recipients INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_campaigns_business ON sms_campaigns(business_id);
CREATE INDEX idx_campaigns_status ON sms_campaigns(status);
CREATE INDEX idx_campaigns_scheduled ON sms_campaigns(scheduled_for);

COMMENT ON TABLE sms_campaigns IS 'Stores SMS marketing campaigns and bulk message sends';

-- ========================================
-- 8. SMS Campaign Recipients Table
-- ========================================
CREATE TABLE IF NOT EXISTS sms_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'opted_out'
  twilio_sid VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_recipients_campaign ON sms_campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_status ON sms_campaign_recipients(status);

COMMENT ON TABLE sms_campaign_recipients IS 'Tracks individual recipients for each SMS campaign';

-- ========================================
-- 9. Row Level Security (RLS) Policies
-- ========================================

-- Enable RLS
ALTER TABLE incoming_sms ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_compliance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Create policies (example - adjust based on your auth setup)
CREATE POLICY "Users can view their business SMS data"
  ON incoming_sms FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM business_users WHERE business_id IN (
      SELECT business_id FROM appointments WHERE customer_phone = from_number
    )
  ));

-- Similar policies for other tables...

-- ========================================
-- 10. Functions for Cleanup
-- ========================================

-- Function to reset birthday flags annually
CREATE OR REPLACE FUNCTION reset_birthday_flags()
RETURNS void AS $$
BEGIN
  UPDATE customers
  SET birthday_message_sent_this_year = FALSE
  WHERE birthday_message_sent_this_year = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old SMS logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_sms_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM incoming_sms
  WHERE created_at < NOW() - INTERVAL '90 days';

  DELETE FROM sms_compliance_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DONE! SMS Module Database Setup Complete
-- ========================================

-- Verify tables created
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%sms%'
ORDER BY tablename;
