-- Add credits table for credit balance tracking
-- Tracks current credit balance for each business

CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,

  -- Credit balance
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,

  -- Subscription credits (monthly allocation)
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  rollover_credits INTEGER NOT NULL DEFAULT 0,

  -- Credit expiration
  credits_expire_at TIMESTAMPTZ,
  last_reset_at TIMESTAMPTZ,
  next_reset_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_business_id ON credits(business_id);
CREATE INDEX IF NOT EXISTS idx_credits_balance ON credits(balance);
CREATE INDEX IF NOT EXISTS idx_credits_expires ON credits(credits_expire_at);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW
  EXECUTE FUNCTION update_credits_updated_at();

-- RLS policies
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credits for their businesses"
  ON credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = credits.business_id
        AND bu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update credits for their businesses"
  ON credits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_users bu
      WHERE bu.business_id = credits.business_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('owner', 'admin')
    )
  );

-- Helper function to get credit balance
CREATE OR REPLACE FUNCTION get_credit_balance(p_business_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance
  FROM credits
  WHERE business_id = p_business_id;

  RETURN COALESCE(v_balance, 0);
END;
$$;

-- Helper function to deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(
  p_business_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM credits
  WHERE business_id = p_business_id
  FOR UPDATE; -- Lock the row

  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Update credits
  UPDATE credits
  SET
    balance = v_new_balance,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE business_id = p_business_id;

  -- Log transaction
  INSERT INTO credit_transactions (
    business_id,
    type,
    amount,
    balance_after,
    description
  ) VALUES (
    p_business_id,
    'deduction',
    -p_amount,
    v_new_balance,
    p_description
  );

  RETURN TRUE;
END;
$$;

-- Helper function to add credits
CREATE OR REPLACE FUNCTION add_credits(
  p_business_id UUID,
  p_amount INTEGER,
  p_credit_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update credits
  UPDATE credits
  SET
    balance = balance + p_amount,
    total_earned = total_earned + p_amount,
    updated_at = NOW()
  WHERE business_id = p_business_id
  RETURNING balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO credit_transactions (
    business_id,
    type,
    amount,
    balance_after,
    description
  ) VALUES (
    p_business_id,
    p_credit_type,
    p_amount,
    v_new_balance,
    p_description
  );

  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_credit_balance TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits TO authenticated;
GRANT EXECUTE ON FUNCTION add_credits TO authenticated;

-- Comments
COMMENT ON TABLE credits IS 'Tracks current credit balance for each business';
COMMENT ON COLUMN credits.balance IS 'Current available credits';
COMMENT ON COLUMN credits.monthly_credits IS 'Monthly credit allocation from subscription';
COMMENT ON COLUMN credits.bonus_credits IS 'Bonus credits from promotions';
COMMENT ON COLUMN credits.rollover_credits IS 'Unused credits rolled over from previous month';
COMMENT ON FUNCTION get_credit_balance IS 'Get current credit balance for a business';
COMMENT ON FUNCTION deduct_credits IS 'Deduct credits from a business account';
COMMENT ON FUNCTION add_credits IS 'Add credits to a business account';
