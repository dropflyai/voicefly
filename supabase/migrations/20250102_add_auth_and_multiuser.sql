-- Add auth and multi-user support
-- This enables:
-- 1. Proper password authentication via Supabase Auth
-- 2. Multi-tenancy (multiple businesses)
-- 3. Multi-user per business (with roles)

-- Create business_users junction table to link auth users to businesses
CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_users_user_id ON business_users(user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_business_id ON business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_role ON business_users(role);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_business_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_users_updated_at
  BEFORE UPDATE ON business_users
  FOR EACH ROW
  EXECUTE FUNCTION update_business_users_updated_at();

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own business_user records
CREATE POLICY "Users can view their own business associations"
  ON business_users FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile info
CREATE POLICY "Users can update their own profile"
  ON business_users FOR UPDATE
  USING (auth.uid() = user_id);

-- Only business owners/admins can add users to their business
CREATE POLICY "Owners and admins can manage business users"
  ON business_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = business_users.business_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('owner', 'admin')
    )
  );

-- Enable RLS on other tables for tenant isolation
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Services: Users can only access services from their businesses
CREATE POLICY "Users can access services from their businesses"
  ON services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = services.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Customers: Users can only access customers from their businesses
CREATE POLICY "Users can access customers from their businesses"
  ON customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = customers.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Appointments: Users can only access appointments from their businesses
CREATE POLICY "Users can access appointments from their businesses"
  ON appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = appointments.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Staff: Users can only access staff from their businesses
CREATE POLICY "Users can access staff from their businesses"
  ON staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = staff.business_id
        AND bu.user_id = auth.uid()
    )
  );

-- Helper function to get user's businesses
CREATE OR REPLACE FUNCTION get_user_businesses(user_uuid UUID)
RETURNS TABLE (
  business_id UUID,
  business_name TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    bu.role
  FROM businesses b
  JOIN business_users bu ON b.id = bu.business_id
  WHERE bu.user_id = user_uuid
    AND bu.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to a business
CREATE OR REPLACE FUNCTION user_has_business_access(user_uuid UUID, biz_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM business_users
    WHERE user_id = user_uuid
      AND business_id = biz_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role in a business
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID, biz_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM business_users
  WHERE user_id = user_uuid
    AND business_id = biz_id
    AND is_active = true;

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
