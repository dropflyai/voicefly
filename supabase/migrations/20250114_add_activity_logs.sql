-- Add activity_logs table for user activity tracking
-- Tracks all user actions across the platform for audit and analytics

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Activity details
  action TEXT NOT NULL, -- create, update, delete, view, export, login, etc.
  entity_type TEXT NOT NULL, -- appointment, customer, service, staff, etc.
  entity_id UUID, -- ID of the affected record
  entity_name TEXT, -- Friendly name of the entity

  -- Context
  description TEXT, -- Human-readable description
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,

  -- Changes tracking
  changes JSONB, -- Before/after values for updates

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_id ON activity_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_composite ON activity_logs(business_id, entity_type, created_at DESC);

-- RLS policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity logs from their businesses"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = activity_logs.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activity logs for their businesses"
  ON activity_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = activity_logs.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Helper function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_business_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (
    business_id,
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    description,
    changes,
    metadata
  ) VALUES (
    p_business_id,
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_description,
    p_changes,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_activity TO authenticated;

-- Comments
COMMENT ON TABLE activity_logs IS 'Tracks all user actions for audit and analytics';
COMMENT ON COLUMN activity_logs.action IS 'Type of action performed (create, update, delete, view, etc.)';
COMMENT ON COLUMN activity_logs.entity_type IS 'Type of entity affected (appointment, customer, etc.)';
COMMENT ON COLUMN activity_logs.changes IS 'JSON object showing before/after values';
COMMENT ON FUNCTION log_activity IS 'Helper function to easily log user activities';
