-- Setup Sessions Migration
-- Stores conversational setup agent sessions

CREATE TABLE IF NOT EXISTS setup_sessions (
  id VARCHAR(100) PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  phase VARCHAR(50) DEFAULT 'discovery',
  collected_data JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_setup_sessions_business ON setup_sessions(business_id);

-- RLS
ALTER TABLE setup_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business setup_sessions"
  ON setup_sessions FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own business setup_sessions"
  ON setup_sessions FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own business setup_sessions"
  ON setup_sessions FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to setup_sessions"
  ON setup_sessions FOR ALL
  USING (auth.role() = 'service_role');

DO $$
BEGIN
  RAISE NOTICE 'Setup sessions migration completed!';
END $$;
