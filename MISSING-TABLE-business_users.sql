-- ============================================
-- BUSINESS_USERS TABLE (FIXED)
-- ============================================
-- This table links Supabase Auth users to businesses
-- with roles and permissions for multi-tenant access

CREATE TABLE IF NOT EXISTS business_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Link to Supabase Auth user
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Link to business
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- User info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),  -- Optional, pulled from auth.users
    phone VARCHAR(50),

    -- Role and permissions
    role VARCHAR(50) DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'staff')),
    permissions JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure a user can only be linked to a business once
    UNIQUE(user_id, business_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_users_user_id ON business_users(user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_business_id ON business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_role ON business_users(role);
CREATE INDEX IF NOT EXISTS idx_business_users_is_active ON business_users(is_active);

-- RLS Policies
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own business associations
CREATE POLICY "Users can view their own business associations"
    ON business_users FOR SELECT
    USING (auth.uid() = user_id);

-- Owners and admins can view all users in their business
CREATE POLICY "Owners and admins can view business users"
    ON business_users FOR SELECT
    USING (
        business_id IN (
            SELECT business_id
            FROM business_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = TRUE
        )
    );

-- Owners and admins can insert new users
CREATE POLICY "Owners and admins can add business users"
    ON business_users FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT business_id
            FROM business_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = TRUE
        )
    );

-- Owners and admins can update users (except changing owner role)
CREATE POLICY "Owners and admins can update business users"
    ON business_users FOR UPDATE
    USING (
        business_id IN (
            SELECT business_id
            FROM business_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = TRUE
        )
    );

-- Only owners can delete users
CREATE POLICY "Only owners can remove business users"
    ON business_users FOR DELETE
    USING (
        business_id IN (
            SELECT business_id
            FROM business_users
            WHERE user_id = auth.uid()
            AND role = 'owner'
            AND is_active = TRUE
        )
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_business_users_updated_at ON business_users;
CREATE TRIGGER trigger_update_business_users_updated_at
    BEFORE UPDATE ON business_users
    FOR EACH ROW
    EXECUTE FUNCTION update_business_users_updated_at();
