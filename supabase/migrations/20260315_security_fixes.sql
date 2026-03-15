-- Security fixes: restrict overly permissive INSERT policies
-- Date: 2026-03-15
-- Audit: VoiceFly Security Brain Comprehensive Audit

-- FIX 1: Restrict businesses INSERT - only authenticated users, max 5 businesses per user
DROP POLICY IF EXISTS "authenticated_users_can_create_business" ON businesses;
CREATE POLICY "authenticated_users_can_create_business"
ON businesses FOR INSERT TO authenticated
WITH CHECK (
  (SELECT COUNT(*) FROM business_users WHERE user_id = auth.uid()) < 5
);

-- FIX 2: Restrict audit_logs INSERT - only authenticated users can insert
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "authenticated_users_can_insert_audit_logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- Also allow service_role to insert (for system-level logging)
CREATE POLICY "service_role_can_insert_audit_logs"
ON audit_logs FOR INSERT TO service_role
WITH CHECK (true);

-- FIX 3: Restrict anon access to audit_logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "users_can_view_own_audit_logs"
ON audit_logs FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM business_users bu
    WHERE bu.business_id = audit_logs.business_id
    AND bu.user_id = auth.uid()
  )
);
