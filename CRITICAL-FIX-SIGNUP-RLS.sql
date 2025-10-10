-- ⚠️  CRITICAL FIX: Allow user signup by fixing RLS policies
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kumocwwziopyilwhfiwb/sql/new

-- Step 1: Add policy to allow authenticated users to create businesses
CREATE POLICY "authenticated_users_can_create_business"
ON businesses
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 2: Add policy to allow users to view their own businesses
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

-- Step 3: Add policy to allow users to update their own businesses
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

-- Verify the policies were created
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'businesses'
ORDER BY policyname;
