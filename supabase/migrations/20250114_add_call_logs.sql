-- Add call_logs table for VAPI call tracking
-- Tracks all incoming/outgoing calls handled by voice AI

CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,

  -- Call metadata
  call_id TEXT UNIQUE, -- VAPI call ID
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'busy', 'no_answer')),

  -- Call timing
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- Total call duration

  -- Call details
  from_number TEXT,
  to_number TEXT,
  assistant_id TEXT, -- VAPI assistant used
  recording_url TEXT,
  transcript TEXT,

  -- AI metrics
  sentiment TEXT, -- positive, neutral, negative
  intent TEXT, -- appointment_booking, inquiry, complaint, etc.
  outcome TEXT, -- booked, callback_requested, no_action, etc.

  -- Cost tracking
  cost_cents INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_business_id ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_customer_id ON call_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_phone_number ON call_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_direction ON call_logs(direction);
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_call_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER call_logs_updated_at
  BEFORE UPDATE ON call_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_call_logs_updated_at();

-- RLS policies
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view call logs from their businesses"
  ON call_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = call_logs.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert call logs for their businesses"
  ON call_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = call_logs.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update call logs from their businesses"
  ON call_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = call_logs.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE call_logs IS 'Tracks all voice AI calls (inbound and outbound)';
COMMENT ON COLUMN call_logs.call_id IS 'External call ID from VAPI';
COMMENT ON COLUMN call_logs.sentiment IS 'AI-detected sentiment of the call';
COMMENT ON COLUMN call_logs.intent IS 'Primary intent/reason for the call';
COMMENT ON COLUMN call_logs.outcome IS 'Result of the call';
