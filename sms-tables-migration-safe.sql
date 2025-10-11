-- SMS Communication Module Database Tables
-- SAFE VERSION - Uses IF NOT EXISTS to prevent errors
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

CREATE INDEX IF NOT EXISTS idx_incoming_sms_from ON incoming_sms(from_number);
CREATE INDEX IF NOT EXISTS idx_incoming_sms_received ON incoming_sms(received_at);
CREATE INDEX IF NOT EXISTS idx_incoming_sms_processed ON incoming_sms(processed);

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

CREATE INDEX IF NOT EXISTS idx_opt_outs_phone ON sms_opt_outs(phone_number);

-- ========================================
-- 3. SMS Consent Table (TCPA Compliance)
-- ========================================
CREATE TABLE IF NOT EXISTS sms_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID,
  phone_number VARCHAR(20) NOT NULL,
  business_id UUID,
  consent_type VARCHAR(50) NOT NULL,
  consented_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  consent_method VARCHAR(50) NOT NULL,
  purpose TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_phone ON sms_consent(phone_number);
CREATE INDEX IF NOT EXISTS idx_consent_business ON sms_consent(business_id);
CREATE INDEX IF NOT EXISTS idx_consent_active ON sms_consent(is_active);

-- ========================================
-- 4. SMS Compliance Log Table
-- ========================================
CREATE TABLE IF NOT EXISTS sms_compliance_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) NOT NULL,
  business_id UUID,
  check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  allowed BOOLEAN NOT NULL,
  reason TEXT,
  checked_opt_out BOOLEAN DEFAULT TRUE,
  checked_consent BOOLEAN DEFAULT TRUE,
  checked_quiet_hours BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_log_timestamp ON sms_compliance_log(check_timestamp);
CREATE INDEX IF NOT EXISTS idx_compliance_log_business ON sms_compliance_log(business_id);

-- ========================================
-- 5. SMS Campaign Table
-- ========================================
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  template_name VARCHAR(100),
  custom_message TEXT,
  target_audience TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft',
  total_recipients INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_campaigns_business ON sms_campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON sms_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON sms_campaigns(scheduled_for);

-- ========================================
-- 6. SMS Campaign Recipients Table
-- ========================================
CREATE TABLE IF NOT EXISTS sms_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID,
  customer_id UUID,
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  twilio_sid VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON sms_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON sms_campaign_recipients(status);

-- ========================================
-- 7. Update Appointments Table (safely)
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='reminder_24h_sent') THEN
    ALTER TABLE appointments ADD COLUMN reminder_24h_sent BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='reminder_24h_sent_at') THEN
    ALTER TABLE appointments ADD COLUMN reminder_24h_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='reminder_2h_sent') THEN
    ALTER TABLE appointments ADD COLUMN reminder_2h_sent BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='reminder_2h_sent_at') THEN
    ALTER TABLE appointments ADD COLUMN reminder_2h_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='no_show_followup_sent') THEN
    ALTER TABLE appointments ADD COLUMN no_show_followup_sent BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='no_show_followup_sent_at') THEN
    ALTER TABLE appointments ADD COLUMN no_show_followup_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ========================================
-- 8. Update Customers Table (safely)
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='birthday_message_sent_this_year') THEN
    ALTER TABLE customers ADD COLUMN birthday_message_sent_this_year BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='service_reminder_sent') THEN
    ALTER TABLE customers ADD COLUMN service_reminder_sent BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='last_sms_sent_at') THEN
    ALTER TABLE customers ADD COLUMN last_sms_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ========================================
-- DONE! Migration Complete (Safe Version)
-- ========================================
SELECT 'SMS Module Migration Complete!' as status;
