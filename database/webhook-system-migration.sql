-- Webhook System Migration
-- Run this migration to add Zapier/Make webhook support to VoiceFly

-- ============================================
-- BUSINESS WEBHOOKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS business_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Webhook configuration
  url TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled_events TEXT[] NOT NULL DEFAULT '{}',
  secret_key VARCHAR(255) NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_webhooks_business ON business_webhooks(business_id);
CREATE INDEX IF NOT EXISTS idx_business_webhooks_active ON business_webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_business_webhooks_events ON business_webhooks USING GIN(enabled_events);

-- ============================================
-- WEBHOOK DELIVERIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES business_webhooks(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Event info
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255) NOT NULL,

  -- Payload and response
  payload JSONB NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',  -- pending, success, failed, retrying
  http_status INTEGER,
  response_body TEXT,

  -- Retry tracking
  attempt_number INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 4,
  error_message TEXT,

  -- Timing
  sent_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_business ON webhook_deliveries(business_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type ON webhook_deliveries(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(status, next_retry_at)
  WHERE status = 'retrying';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on both tables
ALTER TABLE business_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe re-run)
DROP POLICY IF EXISTS "Users can view own business webhooks" ON business_webhooks;
DROP POLICY IF EXISTS "Users can insert own business webhooks" ON business_webhooks;
DROP POLICY IF EXISTS "Users can update own business webhooks" ON business_webhooks;
DROP POLICY IF EXISTS "Users can delete own business webhooks" ON business_webhooks;
DROP POLICY IF EXISTS "Service role full access to business_webhooks" ON business_webhooks;

DROP POLICY IF EXISTS "Users can view own business webhook_deliveries" ON webhook_deliveries;
DROP POLICY IF EXISTS "Service role full access to webhook_deliveries" ON webhook_deliveries;

-- Policies for business_webhooks
CREATE POLICY "Users can view own business webhooks"
  ON business_webhooks FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own business webhooks"
  ON business_webhooks FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own business webhooks"
  ON business_webhooks FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own business webhooks"
  ON business_webhooks FOR DELETE
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

-- Service role bypass for server-side operations
CREATE POLICY "Service role full access to business_webhooks"
  ON business_webhooks FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for webhook_deliveries
CREATE POLICY "Users can view own business webhook_deliveries"
  ON webhook_deliveries FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to webhook_deliveries"
  ON webhook_deliveries FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Webhook system migration completed successfully!';
  RAISE NOTICE 'Tables created: business_webhooks, webhook_deliveries';
END $$;
