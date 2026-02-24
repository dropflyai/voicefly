-- Google Reviews SMS System Migration
-- Tracks review request SMS messages sent to customers after interactions

-- ============================================
-- GOOGLE REVIEW REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS google_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID,
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(255),
  call_id VARCHAR(255),
  order_id UUID,
  review_url TEXT,
  message_sent TEXT,
  status VARCHAR(30) DEFAULT 'sent',  -- sent, delivered, failed, opted_out
  opted_out BOOLEAN DEFAULT false,
  request_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_google_review_requests_business ON google_review_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_google_review_requests_phone ON google_review_requests(customer_phone);
CREATE INDEX IF NOT EXISTS idx_google_review_requests_created ON google_review_requests(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE google_review_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own business google_review_requests" ON google_review_requests;
DROP POLICY IF EXISTS "Users can insert own business google_review_requests" ON google_review_requests;
DROP POLICY IF EXISTS "Users can update own business google_review_requests" ON google_review_requests;
DROP POLICY IF EXISTS "Users can delete own business google_review_requests" ON google_review_requests;

-- User policies (business_users membership check)
CREATE POLICY "Users can view own business google_review_requests"
  ON google_review_requests FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own business google_review_requests"
  ON google_review_requests FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own business google_review_requests"
  ON google_review_requests FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own business google_review_requests"
  ON google_review_requests FOR DELETE
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

-- Service role bypass for webhook handlers and background tasks
CREATE POLICY "Service role full access to google_review_requests"
  ON google_review_requests FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Google Reviews migration completed successfully!';
  RAISE NOTICE 'Table created: google_review_requests';
END $$;
