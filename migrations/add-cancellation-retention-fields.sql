-- Add cancellation and phone retention fields to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cancellation_feedback TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS number_retention BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS number_retention_price DECIMAL(10,2) DEFAULT 5.00;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS number_release_date TIMESTAMP;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_number_retention_subscription_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cancellation_token TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS reactivation_token TEXT;

-- Create index for subscription status queries
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status ON businesses(subscription_status);
CREATE INDEX IF NOT EXISTS idx_businesses_number_release_date ON businesses(number_release_date);
CREATE INDEX IF NOT EXISTS idx_businesses_cancellation_token ON businesses(cancellation_token);

-- Create cancellation surveys table for detailed feedback
CREATE TABLE IF NOT EXISTS cancellation_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  detailed_feedback TEXT,
  would_return BOOLEAN,
  missing_features TEXT,
  price_feedback TEXT,
  competitor_switch TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for business_id lookups
CREATE INDEX IF NOT EXISTS idx_cancellation_surveys_business_id ON cancellation_surveys(business_id);

-- Create phone number lifecycle table to track number history
CREATE TABLE IF NOT EXISTS phone_number_lifecycle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  vapi_phone_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, retained, released, recycled
  assigned_at TIMESTAMP DEFAULT NOW(),
  retained_at TIMESTAMP,
  released_at TIMESTAMP,
  retention_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for phone lifecycle queries
CREATE INDEX IF NOT EXISTS idx_phone_lifecycle_business_id ON phone_number_lifecycle(business_id);
CREATE INDEX IF NOT EXISTS idx_phone_lifecycle_phone_number ON phone_number_lifecycle(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_lifecycle_status ON phone_number_lifecycle(status);
CREATE INDEX IF NOT EXISTS idx_phone_lifecycle_retention_end ON phone_number_lifecycle(retention_end_date);

-- Create win-back campaigns table
CREATE TABLE IF NOT EXISTS win_back_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL, -- day_1, day_7, day_14, day_30, day_60
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  converted_at TIMESTAMP,
  offer_code TEXT,
  offer_discount_percent INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for win-back campaign queries
CREATE INDEX IF NOT EXISTS idx_win_back_business_id ON win_back_campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_win_back_campaign_type ON win_back_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_win_back_sent_at ON win_back_campaigns(sent_at);

-- Add RLS policies for new tables
ALTER TABLE cancellation_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_number_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_back_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for cancellation_surveys
CREATE POLICY "Businesses can view own cancellation surveys" 
  ON cancellation_surveys FOR SELECT 
  USING (business_id IN (
    SELECT id FROM businesses WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage all cancellation surveys" 
  ON cancellation_surveys FOR ALL 
  USING (auth.role() = 'service_role');

-- RLS policies for phone_number_lifecycle
CREATE POLICY "Businesses can view own phone lifecycle" 
  ON phone_number_lifecycle FOR SELECT 
  USING (business_id IN (
    SELECT id FROM businesses WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage all phone lifecycle" 
  ON phone_number_lifecycle FOR ALL 
  USING (auth.role() = 'service_role');

-- RLS policies for win_back_campaigns
CREATE POLICY "Businesses can view own win-back campaigns" 
  ON win_back_campaigns FOR SELECT 
  USING (business_id IN (
    SELECT id FROM businesses WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage all win-back campaigns" 
  ON win_back_campaigns FOR ALL 
  USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON COLUMN businesses.subscription_status IS 'Current subscription status: trial, active, cancelled, number_only, expired';
COMMENT ON COLUMN businesses.number_retention IS 'Whether business is paying $5/month to retain phone number';
COMMENT ON COLUMN businesses.number_release_date IS 'Date when phone number will be released if not retained';
COMMENT ON COLUMN businesses.cancellation_token IS 'Secure token for email cancellation links';
COMMENT ON COLUMN businesses.reactivation_token IS 'Secure token for win-back reactivation links';

COMMENT ON TABLE cancellation_surveys IS 'Detailed feedback from cancelled customers';
COMMENT ON TABLE phone_number_lifecycle IS 'Tracks phone number assignment and retention history';
COMMENT ON TABLE win_back_campaigns IS 'Tracks win-back email campaigns and conversion';