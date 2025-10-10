-- VoiceFly Credit System Database Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Add credit columns to businesses table
-- ============================================

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS purchased_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_reset_date TIMESTAMP DEFAULT (NOW() + INTERVAL '1 month');

-- Update existing starter businesses
-- Default to 500 credits for all starter tier (we'll handle trial separately if needed)
UPDATE businesses
SET
  monthly_credits = 500,
  purchased_credits = 0,
  credits_used_this_month = 0,
  credits_reset_date = NOW() + INTERVAL '1 month'
WHERE subscription_tier = 'starter' OR subscription_tier IS NULL;

-- Update existing professional businesses
UPDATE businesses
SET
  monthly_credits = 2000,
  credits_reset_date = NOW() + INTERVAL '1 month'
WHERE subscription_tier = 'professional';

-- Update existing enterprise businesses
UPDATE businesses
SET
  monthly_credits = 10000,
  credits_reset_date = NOW() + INTERVAL '1 month'
WHERE subscription_tier = 'enterprise';

-- ============================================
-- 2. Create credit_transactions table
-- ============================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for additions, negative for deductions
  operation TEXT NOT NULL, -- 'deduct', 'purchase', 'reset', 'refund'
  feature TEXT NOT NULL, -- Feature that consumed/added credits
  metadata JSONB DEFAULT '{}', -- Additional context
  balance_after INTEGER NOT NULL, -- Total balance after this transaction
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_business ON credit_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own business transactions
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id
      FROM business_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 3. Create credit_packs table (for add-on purchases)
-- ============================================

CREATE TABLE IF NOT EXISTS credit_packs (
  id TEXT PRIMARY KEY, -- 'pack_small', 'pack_medium', etc.
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price INTEGER NOT NULL, -- Price in cents
  savings INTEGER DEFAULT 0, -- Amount saved vs base price
  price_per_credit DECIMAL(10,4) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default credit packs
INSERT INTO credit_packs (id, name, credits, price, savings, price_per_credit) VALUES
  ('pack_small', 'Small Pack', 100, 1500, 0, 0.15),
  ('pack_medium', 'Medium Pack', 500, 6000, 1500, 0.12),
  ('pack_large', 'Large Pack', 1000, 10000, 5000, 0.10),
  ('pack_enterprise', 'Enterprise Pack', 5000, 40000, 15000, 0.08)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  credits = EXCLUDED.credits,
  price = EXCLUDED.price,
  savings = EXCLUDED.savings,
  price_per_credit = EXCLUDED.price_per_credit,
  updated_at = NOW();

-- Enable RLS (read-only for everyone)
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view credit packs"
  ON credit_packs
  FOR SELECT
  USING (active = true);

-- ============================================
-- 4. Create credit_purchases table (purchase history)
-- ============================================

CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL REFERENCES credit_packs(id),
  credits_purchased INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL, -- In cents
  stripe_payment_id TEXT,
  stripe_invoice_id TEXT,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'refunded'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_purchases_business ON credit_purchases(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created ON credit_purchases(created_at DESC);

-- Enable RLS
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit purchases"
  ON credit_purchases
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id
      FROM business_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Create function to check if business has enough credits
-- ============================================

CREATE OR REPLACE FUNCTION check_credits(
  p_business_id UUID,
  p_required_credits INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_credits INTEGER;
BEGIN
  -- Get total credits (monthly + purchased)
  SELECT (monthly_credits + purchased_credits) INTO v_total_credits
  FROM businesses
  WHERE id = p_business_id;

  -- Return true if enough credits
  RETURN v_total_credits >= p_required_credits;
END;
$$;

-- ============================================
-- 6. Create function to reset monthly credits (cron job)
-- ============================================

CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reset_count INTEGER := 0;
  v_business RECORD;
  v_monthly_allocation INTEGER;
BEGIN
  -- Loop through businesses with expired credits
  -- Note: Trial users have reset_date 10 years in future, so they're auto-excluded
  FOR v_business IN
    SELECT id, subscription_tier, purchased_credits, subscription_status
    FROM businesses
    WHERE credits_reset_date <= NOW()
  LOOP
    -- Determine monthly allocation
    CASE v_business.subscription_tier
      WHEN 'starter' THEN v_monthly_allocation := 500;
      WHEN 'professional' THEN v_monthly_allocation := 2000;
      WHEN 'enterprise' THEN v_monthly_allocation := 10000;
      ELSE v_monthly_allocation := 50;
    END CASE;

    -- Reset monthly credits
    UPDATE businesses
    SET
      monthly_credits = v_monthly_allocation,
      credits_used_this_month = 0,
      credits_reset_date = NOW() + INTERVAL '1 month',
      updated_at = NOW()
    WHERE id = v_business.id;

    -- Log transaction
    INSERT INTO credit_transactions (
      business_id,
      amount,
      operation,
      feature,
      balance_after,
      metadata
    ) VALUES (
      v_business.id,
      v_monthly_allocation,
      'reset',
      'monthly_allocation',
      v_monthly_allocation + v_business.purchased_credits,
      jsonb_build_object('tier', v_business.subscription_tier)
    );

    v_reset_count := v_reset_count + 1;
  END LOOP;

  RETURN v_reset_count;
END;
$$;

-- ============================================
-- 7. Create audit log events for credits
-- ============================================

-- Add new audit event types if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'audit_event_type'
  ) THEN
    CREATE TYPE audit_event_type AS ENUM (
      'signup', 'login_success', 'login_failed', 'logout',
      'password_reset', 'email_verified', 'mfa_enabled',
      'permission_changed', 'role_updated', 'user_invited',
      'data_export', 'data_deleted', 'settings_changed',
      'payment_succeeded', 'payment_failed', 'subscription_changed',
      'credit_deducted', 'credit_purchased', 'credit_reset'
    );
  ELSE
    -- Add new event types to existing enum
    ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'credit_deducted';
    ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'credit_purchased';
    ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'credit_reset';
  END IF;
END$$;

-- ============================================
-- 8. Comments for documentation
-- ============================================

COMMENT ON COLUMN businesses.monthly_credits IS 'Credits that reset each month based on subscription tier';
COMMENT ON COLUMN businesses.purchased_credits IS 'Credits purchased via add-on packs (never expire)';
COMMENT ON COLUMN businesses.credits_used_this_month IS 'Total credits consumed this billing cycle';
COMMENT ON COLUMN businesses.credits_reset_date IS 'Next date when monthly credits reset';

COMMENT ON TABLE credit_transactions IS 'Complete history of all credit additions and deductions';
COMMENT ON TABLE credit_packs IS 'Available credit pack add-ons for purchase';
COMMENT ON TABLE credit_purchases IS 'History of credit pack purchases';

-- ============================================
-- 9. Grant permissions
-- ============================================

GRANT SELECT ON credit_packs TO authenticated;
GRANT SELECT ON credit_transactions TO authenticated;
GRANT SELECT ON credit_purchases TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify migration
SELECT
  'Migration completed successfully!' as status,
  COUNT(*) as total_businesses,
  SUM(monthly_credits + purchased_credits) as total_credits_allocated
FROM businesses;
