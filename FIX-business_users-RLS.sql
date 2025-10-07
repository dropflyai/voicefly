-- ============================================
-- FIX: business_users RLS Policies
-- ============================================
-- Remove the recursive policies and create simpler ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own business associations" ON business_users;
DROP POLICY IF EXISTS "Owners and admins can view business users" ON business_users;
DROP POLICY IF EXISTS "Owners and admins can add business users" ON business_users;
DROP POLICY IF EXISTS "Owners and admins can update business users" ON business_users;
DROP POLICY IF EXISTS "Only owners can remove business users" ON business_users;

-- SELECT: Users can view their own associations and associations in their businesses
CREATE POLICY "Users can view business_users"
    ON business_users FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        business_id IN (
            SELECT business_id
            FROM business_users
            WHERE user_id = auth.uid()
            AND is_active = TRUE
        )
    );

-- INSERT: Allow authenticated users to insert themselves (for signup)
-- Also allow service role (for admin operations)
CREATE POLICY "Allow signup and admin inserts"
    ON business_users FOR INSERT
    WITH CHECK (
        -- User can insert themselves
        auth.uid() = user_id
        OR
        -- Service role can insert anyone (bypass RLS)
        auth.jwt() ->> 'role' = 'service_role'
    );

-- UPDATE: Users can update their own records, owners/admins can update their business users
CREATE POLICY "Users can update business_users"
    ON business_users FOR UPDATE
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM business_users bu
            WHERE bu.business_id = business_users.business_id
            AND bu.user_id = auth.uid()
            AND bu.role IN ('owner', 'admin')
            AND bu.is_active = TRUE
        )
    );

-- DELETE: Only owners can delete users
CREATE POLICY "Only owners can delete business_users"
    ON business_users FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM business_users bu
            WHERE bu.business_id = business_users.business_id
            AND bu.user_id = auth.uid()
            AND bu.role = 'owner'
            AND bu.is_active = TRUE
        )
    );
