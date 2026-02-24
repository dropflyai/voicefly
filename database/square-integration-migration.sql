-- ============================================
-- SQUARE POS INTEGRATION MIGRATION
-- ============================================
-- Adds tables for Square OAuth connections and order syncing.
-- Run via Supabase Management API or psql.
-- ============================================

-- ============================================
-- SQUARE CONNECTIONS TABLE
-- ============================================
-- Stores per-business OAuth credentials for Square.
-- Each business can have at most one active connection.

CREATE TABLE IF NOT EXISTS square_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,

  -- OAuth tokens
  access_token VARCHAR(500) NOT NULL,
  refresh_token VARCHAR(500),
  token_expires_at TIMESTAMPTZ,

  -- Square identifiers
  square_merchant_id VARCHAR(255),
  square_location_id VARCHAR(255),

  -- Connection state
  is_active BOOLEAN DEFAULT true,
  auto_sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_square_connections_business ON square_connections(business_id);
CREATE INDEX IF NOT EXISTS idx_square_connections_merchant ON square_connections(square_merchant_id);
CREATE INDEX IF NOT EXISTS idx_square_connections_active ON square_connections(is_active) WHERE is_active = true;

-- ============================================
-- SQUARE SYNCED ORDERS TABLE
-- ============================================
-- Tracks phone orders that have been pushed to Square.

CREATE TABLE IF NOT EXISTS square_synced_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  phone_order_id UUID NOT NULL REFERENCES phone_orders(id) ON DELETE CASCADE,
  square_order_id VARCHAR(255) NOT NULL,

  -- Sync state
  status VARCHAR(30) DEFAULT 'synced',  -- synced, failed, cancelled
  sync_error TEXT,

  -- Timestamps
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_square_synced_orders_business ON square_synced_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_square_synced_orders_phone ON square_synced_orders(phone_order_id);
CREATE INDEX IF NOT EXISTS idx_square_synced_orders_square ON square_synced_orders(square_order_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE square_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE square_synced_orders ENABLE ROW LEVEL SECURITY;

-- Service role bypass (used by API routes with SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role full access to square_connections"
  ON square_connections FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to square_synced_orders"
  ON square_synced_orders FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- DONE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Square integration migration completed successfully!';
  RAISE NOTICE 'Tables created: square_connections, square_synced_orders';
END $$;
