-- ════════════════════════════════════════════════════════════════
-- VOICEFLY - MINIMAL FIX FOR SIGNUP
-- ════════════════════════════════════════════════════════════════
-- This ONLY fixes the signup issue - nothing else
-- Run in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "authenticated_users_can_create_business" ON businesses;
DROP POLICY IF EXISTS "users_can_view_own_businesses" ON businesses;
DROP POLICY IF EXISTS "users_can_update_own_businesses" ON businesses;

-- Allow authenticated users to create businesses (for signup)
CREATE POLICY "authenticated_users_can_create_business"
ON businesses
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view their own businesses
CREATE POLICY "users_can_view_own_businesses"
ON businesses
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT business_id
    FROM business_users
    WHERE user_id = auth.uid()
  )
);

-- Allow users to update their own businesses
CREATE POLICY "users_can_update_own_businesses"
ON businesses
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT business_id
    FROM business_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  id IN (
    SELECT business_id
    FROM business_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE tablename = 'businesses'
ORDER BY policyname;
