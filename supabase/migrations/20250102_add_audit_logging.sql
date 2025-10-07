-- Audit Logging System
-- Tracks all changes made by users in the system

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'logout')),
  entity_type TEXT NOT NULL, -- 'service', 'customer', 'appointment', 'staff', etc.
  entity_id UUID,
  entity_name TEXT,
  changes JSONB, -- Stores before/after values for updates
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view audit logs from their businesses
CREATE POLICY "Users can view audit logs from their businesses"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = audit_logs.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Only system can insert audit logs (via function)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Function to log user actions
CREATE OR REPLACE FUNCTION log_user_action(
  p_business_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_name TEXT;
  v_audit_id UUID;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();

  SELECT
    u.email,
    COALESCE(bu.first_name || ' ' || bu.last_name, u.email)
  INTO v_user_email, v_user_name
  FROM auth.users u
  LEFT JOIN business_users bu ON bu.user_id = u.id AND bu.business_id = p_business_id
  WHERE u.id = v_user_id;

  -- Insert audit log
  INSERT INTO audit_logs (
    business_id,
    user_id,
    user_email,
    user_name,
    action,
    entity_type,
    entity_id,
    entity_name,
    changes,
    ip_address,
    user_agent
  ) VALUES (
    p_business_id,
    v_user_id,
    v_user_email,
    v_user_name,
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_changes,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to auto-log service changes
CREATE OR REPLACE FUNCTION audit_service_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    PERFORM log_user_action(
      NEW.business_id,
      v_action,
      'service',
      NEW.id,
      NEW.name,
      jsonb_build_object('new', row_to_json(NEW))
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_changes := jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    );
    PERFORM log_user_action(
      NEW.business_id,
      v_action,
      'service',
      NEW.id,
      NEW.name,
      v_changes
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    PERFORM log_user_action(
      OLD.business_id,
      v_action,
      'service',
      OLD.id,
      OLD.name,
      jsonb_build_object('old', row_to_json(OLD))
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-log customer changes
CREATE OR REPLACE FUNCTION audit_customer_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB;
  v_action TEXT;
  v_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_name := NEW.first_name || ' ' || NEW.last_name;
    PERFORM log_user_action(
      NEW.business_id,
      v_action,
      'customer',
      NEW.id,
      v_name,
      jsonb_build_object('new', row_to_json(NEW))
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_name := NEW.first_name || ' ' || NEW.last_name;
    v_changes := jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    );
    PERFORM log_user_action(
      NEW.business_id,
      v_action,
      'customer',
      NEW.id,
      v_name,
      v_changes
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_name := OLD.first_name || ' ' || OLD.last_name;
    PERFORM log_user_action(
      OLD.business_id,
      v_action,
      'customer',
      OLD.id,
      v_name,
      jsonb_build_object('old', row_to_json(OLD))
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-log appointment changes
CREATE OR REPLACE FUNCTION audit_appointment_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB;
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    PERFORM log_user_action(
      NEW.business_id,
      v_action,
      'appointment',
      NEW.id,
      'Appointment #' || NEW.id::TEXT,
      jsonb_build_object('new', row_to_json(NEW))
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_changes := jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    );
    PERFORM log_user_action(
      NEW.business_id,
      v_action,
      'appointment',
      NEW.id,
      'Appointment #' || NEW.id::TEXT,
      v_changes
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    PERFORM log_user_action(
      OLD.business_id,
      v_action,
      'appointment',
      OLD.id,
      'Appointment #' || OLD.id::TEXT,
      jsonb_build_object('old', row_to_json(OLD))
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to tables
CREATE TRIGGER services_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW
  EXECUTE FUNCTION audit_service_changes();

CREATE TRIGGER customers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION audit_customer_changes();

CREATE TRIGGER appointments_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION audit_appointment_changes();

-- View for easy audit log reading
CREATE OR REPLACE VIEW audit_logs_readable AS
SELECT
  al.id,
  al.business_id,
  b.name as business_name,
  al.user_name,
  al.user_email,
  al.action,
  al.entity_type,
  al.entity_name,
  al.changes,
  al.created_at,
  al.ip_address
FROM audit_logs al
JOIN businesses b ON b.id = al.business_id
ORDER BY al.created_at DESC;

-- Function to get recent activity for a business
CREATE OR REPLACE FUNCTION get_recent_activity(
  p_business_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_name TEXT,
  action TEXT,
  entity_type TEXT,
  entity_name TEXT,
  created_at TIMESTAMPTZ,
  changes_summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_name,
    al.action,
    al.entity_type,
    al.entity_name,
    al.created_at,
    CASE
      WHEN al.action = 'create' THEN 'Created'
      WHEN al.action = 'update' THEN 'Updated'
      WHEN al.action = 'delete' THEN 'Deleted'
      WHEN al.action = 'login' THEN 'Logged in'
      WHEN al.action = 'logout' THEN 'Logged out'
    END as changes_summary
  FROM audit_logs al
  WHERE al.business_id = p_business_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity history
CREATE OR REPLACE FUNCTION get_user_activity(
  p_user_id UUID,
  p_business_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  action TEXT,
  entity_type TEXT,
  entity_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action,
    al.entity_type,
    al.entity_name,
    al.created_at
  FROM audit_logs al
  WHERE al.user_id = p_user_id
    AND al.business_id = p_business_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment the table
COMMENT ON TABLE audit_logs IS 'Tracks all user actions and changes in the system for compliance and security';
COMMENT ON FUNCTION log_user_action IS 'Logs a user action with context information';
COMMENT ON FUNCTION get_recent_activity IS 'Gets recent activity for a business';
COMMENT ON FUNCTION get_user_activity IS 'Gets activity history for a specific user';
