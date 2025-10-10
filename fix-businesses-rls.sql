-- Fix RLS policies for businesses table to allow signup
-- This resolves: "new row violates row-level security policy for table businesses"

-- First, check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'businesses';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view businesses they belong to" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update businesses they own" ON businesses;
DROP POLICY IF EXISTS "Service role can do anything" ON businesses;

-- Policy 1: Allow authenticated users to insert (create) businesses during signup
CREATE POLICY "Users can create businesses"
ON businesses
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow any authenticated user to create a business

-- Policy 2: Users can view businesses they are associated with
CREATE POLICY "Users can view businesses they belong to"
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

-- Policy 3: Users can update businesses they own or are admins of
CREATE POLICY "Users can update businesses they own"
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

-- Policy 4: Service role bypass (for server-side operations)
CREATE POLICY "Service role can do anything"
ON businesses
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'businesses'
ORDER BY policyname;
