-- Add sms_messages table for SMS/text message tracking
-- Tracks all SMS communications with customers

CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Message details
  message_sid TEXT UNIQUE, -- Twilio message SID
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'undelivered', 'received')),

  -- Phone numbers
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,

  -- Message content
  body TEXT NOT NULL,
  media_url TEXT[], -- Array of media URLs (MMS)

  -- Message type
  message_type TEXT DEFAULT 'transactional' CHECK (message_type IN ('transactional', 'marketing', 'reminder', 'support')),

  -- Related records
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  campaign_id UUID, -- For marketing campaigns

  -- Delivery tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,

  -- Cost tracking
  cost_cents INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 1,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_messages_business_id ON sms_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_customer_id ON sms_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_from_number ON sms_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to_number ON sms_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_message_sid ON sms_messages(message_sid);
CREATE INDEX IF NOT EXISTS idx_sms_messages_direction ON sms_messages(direction);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_appointment_id ON sms_messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created_at ON sms_messages(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_sms_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sms_messages_updated_at
  BEFORE UPDATE ON sms_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_messages_updated_at();

-- RLS policies
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SMS from their businesses"
  ON sms_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = sms_messages.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert SMS for their businesses"
  ON sms_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = sms_messages.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update SMS from their businesses"
  ON sms_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = sms_messages.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE sms_messages IS 'Tracks all SMS/text messages sent and received';
COMMENT ON COLUMN sms_messages.message_sid IS 'Twilio message ID';
COMMENT ON COLUMN sms_messages.message_type IS 'Type of message for filtering and compliance';
COMMENT ON COLUMN sms_messages.media_url IS 'URLs of any attached media (MMS)';
