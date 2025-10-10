-- VoiceFly Credit System Database Migration (Simplified)
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Add credit columns to businesses table
-- ============================================

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS purchased_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_reset_date TIMESTAMP DEFAULT (NOW() + INTERVAL '1 month');

-- Update all existing businesses with default credits based on tier
UPDATE businesses
SET
  monthly_credits = CASE subscription_tier
    WHEN 'starter' THEN 500
    WHEN 'professional' THEN 2000
    WHEN 'enterprise' THEN 10000
    ELSE 50
  END,
  purchased_credits = COALESCE(purchased_credits, 0),
  credits_used_this_month = COALESCE(credits_used_this_month, 0),
  credits_reset_date = COALESCE(credits_reset_date, NOW() + INTERVAL '1 month');

-- ============================================
-- 2. Create credit_transactions table
-- ============================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  operation TEXT NOT NULL,
  feature TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_business ON credit_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

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
-- 3. Create credit_packs table
-- ============================================

CREATE TABLE IF NOT EXISTS credit_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price INTEGER NOT NULL,
  savings INTEGER DEFAULT 0,
  price_per_credit DECIMAL(10,4) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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

ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view credit packs"
  ON credit_packs
  FOR SELECT
  USING (active = true);

-- ============================================
-- 4. Create credit_purchases table
-- ============================================

CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL REFERENCES credit_packs(id),
  credits_purchased INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  stripe_payment_id TEXT,
  stripe_invoice_id TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_business ON credit_purchases(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created ON credit_purchases(created_at DESC);

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
-- 5. Create helper functions
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
  SELECT (monthly_credits + purchased_credits) INTO v_total_credits
  FROM businesses
  WHERE id = p_business_id;

  RETURN v_total_credits >= p_required_credits;
END;
$$;

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
  FOR v_business IN
    SELECT id, subscription_tier, purchased_credits
    FROM businesses
    WHERE credits_reset_date <= NOW()
  LOOP
    v_monthly_allocation := CASE v_business.subscription_tier
      WHEN 'starter' THEN 500
      WHEN 'professional' THEN 2000
      WHEN 'enterprise' THEN 10000
      ELSE 50
    END;

    UPDATE businesses
    SET
      monthly_credits = v_monthly_allocation,
      credits_used_this_month = 0,
      credits_reset_date = NOW() + INTERVAL '1 month',
      updated_at = NOW()
    WHERE id = v_business.id;

    INSERT INTO credit_transactions (
      business_id, amount, operation, feature, balance_after, metadata
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
-- 6. Grant permissions
-- ============================================

GRANT SELECT ON credit_packs TO authenticated;
GRANT SELECT ON credit_transactions TO authenticated;
GRANT SELECT ON credit_purchases TO authenticated;

-- ============================================
-- 7. Verify migration
-- ============================================

SELECT
  'Migration completed!' as status,
  COUNT(*) as businesses_updated,
  SUM(monthly_credits + purchased_credits) as total_credits_allocated
FROM businesses;
