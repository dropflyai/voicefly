-- HubSpot CRM Integration Migration
-- Run this migration to add HubSpot integration support to VoiceFly

-- ============================================
-- HUBSPOT CONNECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hubspot_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Auth configuration
  auth_type VARCHAR(20) DEFAULT 'private_token',  -- private_token, oauth
  private_token VARCHAR(500),
  access_token VARCHAR(500),
  refresh_token VARCHAR(500),
  token_expires_at TIMESTAMPTZ,

  -- HubSpot account info
  portal_id VARCHAR(100),

  -- Connection status
  is_connected BOOLEAN DEFAULT false,

  -- Sync settings
  sync_contacts BOOLEAN DEFAULT true,
  sync_calls BOOLEAN DEFAULT true,
  sync_deals BOOLEAN DEFAULT true,
  create_tasks BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for hubspot_connections
CREATE INDEX IF NOT EXISTS idx_hubspot_connections_business ON hubspot_connections(business_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_connections_portal ON hubspot_connections(portal_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_connections_connected ON hubspot_connections(is_connected);

-- ============================================
-- HUBSPOT SYNC LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hubspot_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Sync details
  entity_type VARCHAR(50) NOT NULL,   -- contact, call, deal, task
  entity_id VARCHAR(255),             -- local ID of the entity
  hubspot_id VARCHAR(255),            -- HubSpot object ID
  action VARCHAR(50) NOT NULL,        -- create, update, upsert, associate
  status VARCHAR(30) NOT NULL,        -- success, error, skipped
  error_details TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for hubspot_sync_logs
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_logs_business ON hubspot_sync_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_logs_entity_type ON hubspot_sync_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_logs_status ON hubspot_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_logs_created ON hubspot_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_logs_hubspot_id ON hubspot_sync_logs(hubspot_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE hubspot_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubspot_sync_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own business hubspot_connections" ON hubspot_connections;
DROP POLICY IF EXISTS "Users can insert own business hubspot_connections" ON hubspot_connections;
DROP POLICY IF EXISTS "Users can update own business hubspot_connections" ON hubspot_connections;
DROP POLICY IF EXISTS "Users can delete own business hubspot_connections" ON hubspot_connections;
DROP POLICY IF EXISTS "Service role full access to hubspot_connections" ON hubspot_connections;

DROP POLICY IF EXISTS "Users can view own business hubspot_sync_logs" ON hubspot_sync_logs;
DROP POLICY IF EXISTS "Service role full access to hubspot_sync_logs" ON hubspot_sync_logs;

-- Policies for hubspot_connections
CREATE POLICY "Users can view own business hubspot_connections"
  ON hubspot_connections FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own business hubspot_connections"
  ON hubspot_connections FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own business hubspot_connections"
  ON hubspot_connections FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own business hubspot_connections"
  ON hubspot_connections FOR DELETE
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

-- Service role bypass for API routes and webhook handlers
CREATE POLICY "Service role full access to hubspot_connections"
  ON hubspot_connections FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for hubspot_sync_logs (read-only for users, full for service role)
CREATE POLICY "Users can view own business hubspot_sync_logs"
  ON hubspot_sync_logs FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to hubspot_sync_logs"
  ON hubspot_sync_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'HubSpot integration migration completed successfully!';
  RAISE NOTICE 'Tables created: hubspot_connections, hubspot_sync_logs';
END $$;
