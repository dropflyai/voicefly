-- Business Integrations
-- Stores third-party platform connections per business (Toast, Square, Calendly, Shopify, etc.)

CREATE TABLE IF NOT EXISTS business_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,  -- 'square' | 'toast' | 'calendly' | 'shopify' | etc.
  status TEXT NOT NULL DEFAULT 'disconnected', -- 'connected' | 'disconnected' | 'error' | 'syncing'
  credentials JSONB NOT NULL DEFAULT '{}', -- encrypted at app level before storage
  config JSONB NOT NULL DEFAULT '{}',  -- platform-specific settings
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, platform)
);

ALTER TABLE business_integrations ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY "service_role_bypass_integrations" ON business_integrations
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can only see their own business integrations
CREATE POLICY "users_view_own_integrations" ON business_integrations
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_business_integrations_business ON business_integrations(business_id);
CREATE INDEX idx_business_integrations_platform ON business_integrations(platform);
