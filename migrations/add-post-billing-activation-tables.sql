-- Post-Billing Activation System Tables
-- Phase 3: Psychology-driven feature unlock campaigns

-- Feature usage tracking table
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  feature VARCHAR(100) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for fast lookups
  INDEX idx_feature_usage_business (business_id),
  INDEX idx_feature_usage_feature (feature),
  INDEX idx_feature_usage_date (used_at)
);

-- Email campaigns tracking
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  campaign_id VARCHAR(100) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'sent',
  priority VARCHAR(20) DEFAULT 'normal',
  metadata JSONB,
  
  INDEX idx_email_campaigns_business (business_id),
  INDEX idx_email_campaigns_status (status),
  INDEX idx_email_campaigns_date (sent_at)
);

-- Dashboard notifications for psychology triggers
CREATE TABLE IF NOT EXISTS dashboard_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'activation', 'warning', 'success', 'roi'
  priority VARCHAR(20) NOT NULL, -- 'high', 'medium', 'low'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  cta_text VARCHAR(100),
  cta_action VARCHAR(100),
  dismissible BOOLEAN DEFAULT true,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_notifications_business (business_id),
  INDEX idx_notifications_priority (priority),
  INDEX idx_notifications_dismissed (dismissed_at)
);

-- Support interventions for at-risk customers
CREATE TABLE IF NOT EXISTS support_interventions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  risk_level VARCHAR(20) NOT NULL, -- 'high', 'medium', 'low'
  intervention_type VARCHAR(50) NOT NULL,
  unused_features TEXT[],
  engagement_score INTEGER,
  messages TEXT[],
  incentives TEXT[],
  status VARCHAR(50) DEFAULT 'pending',
  resolved_at TIMESTAMP WITH TIME ZONE,
  outcome VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_interventions_business (business_id),
  INDEX idx_interventions_status (status),
  INDEX idx_interventions_risk (risk_level)
);

-- Business milestones tracking
CREATE TABLE IF NOT EXISTS business_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  milestone VARCHAR(100) NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  engagement_score INTEGER,
  risk_level VARCHAR(20),
  message TEXT,
  metadata JSONB,
  
  INDEX idx_milestones_business (business_id),
  INDEX idx_milestones_type (milestone)
);

-- Support tickets for retention
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  assigned_to VARCHAR(255),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_tickets_business (business_id),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_priority (priority)
);

-- Add new columns to businesses table if they don't exist
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS billing_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_engagement_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS feature_adoption_rate DECIMAL(5,2) DEFAULT 0;

-- Row Level Security (RLS) Policies

-- Feature usage RLS
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can view own feature usage" ON feature_usage
  FOR SELECT USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "System can track feature usage" ON feature_usage
  FOR INSERT WITH CHECK (true);

-- Email campaigns RLS
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can view own campaigns" ON email_campaigns
  FOR SELECT USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "System can create campaigns" ON email_campaigns
  FOR INSERT WITH CHECK (true);

-- Dashboard notifications RLS
ALTER TABLE dashboard_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can view own notifications" ON dashboard_notifications
  FOR SELECT USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "Businesses can dismiss notifications" ON dashboard_notifications
  FOR UPDATE USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "System can create notifications" ON dashboard_notifications
  FOR INSERT WITH CHECK (true);

-- Support interventions RLS
ALTER TABLE support_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support can view all interventions" ON support_interventions
  FOR ALL USING (current_setting('app.user_role') = 'support');

CREATE POLICY "System can create interventions" ON support_interventions
  FOR INSERT WITH CHECK (true);

-- Business milestones RLS
ALTER TABLE business_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can view own milestones" ON business_milestones
  FOR SELECT USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "System can track milestones" ON business_milestones
  FOR INSERT WITH CHECK (true);

-- Support tickets RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can view own tickets" ON support_tickets
  FOR SELECT USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "Businesses can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY "Support can manage all tickets" ON support_tickets
  FOR ALL USING (current_setting('app.user_role') = 'support');

-- Create functions for automated processes

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_business_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_feature_count INTEGER;
  v_recent_usage_count INTEGER;
BEGIN
  -- Count unique features used
  SELECT COUNT(DISTINCT feature) INTO v_feature_count
  FROM feature_usage
  WHERE business_id = p_business_id;
  
  -- Count recent usage (last 7 days)
  SELECT COUNT(*) INTO v_recent_usage_count
  FROM feature_usage
  WHERE business_id = p_business_id
    AND used_at > NOW() - INTERVAL '7 days';
  
  -- Calculate score (simplified version)
  v_score := (v_feature_count * 10) + (v_recent_usage_count * 5);
  
  -- Update business record
  UPDATE businesses
  SET engagement_score = v_score,
      last_engagement_date = NOW()
  WHERE id = p_business_id;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function to identify at-risk customers
CREATE OR REPLACE FUNCTION identify_at_risk_customers()
RETURNS TABLE(business_id UUID, risk_level VARCHAR, reason TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    CASE 
      WHEN b.engagement_score < 50 THEN 'high'
      WHEN b.engagement_score < 100 THEN 'medium'
      ELSE 'low'
    END as risk_level,
    CASE
      WHEN b.engagement_score < 50 THEN 'Very low engagement - immediate intervention needed'
      WHEN NOT EXISTS (
        SELECT 1 FROM feature_usage fu 
        WHERE fu.business_id = b.id 
        AND fu.feature = 'phone_forwarding'
      ) THEN 'Critical feature (phone forwarding) not activated'
      WHEN b.last_engagement_date < NOW() - INTERVAL '7 days' THEN 'No engagement in 7+ days'
      ELSE 'Monitoring for prevention'
    END as reason
  FROM businesses b
  WHERE b.subscription_status = 'active'
    AND b.billing_start_date IS NOT NULL
    AND (
      b.engagement_score < 100
      OR b.last_engagement_date < NOW() - INTERVAL '7 days'
      OR NOT EXISTS (
        SELECT 1 FROM feature_usage fu 
        WHERE fu.business_id = b.id 
        AND fu.feature = 'phone_forwarding'
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_engagement ON businesses(engagement_score);
CREATE INDEX IF NOT EXISTS idx_businesses_last_engagement ON businesses(last_engagement_date);
CREATE INDEX IF NOT EXISTS idx_businesses_billing_start ON businesses(billing_start_date);

-- Sample data for testing (optional)
-- INSERT INTO feature_usage (business_id, feature) VALUES
-- ('your-business-id', 'dashboard_login'),
-- ('your-business-id', 'test_call_made');

COMMENT ON TABLE feature_usage IS 'Tracks all feature usage for engagement scoring and targeted campaigns';
COMMENT ON TABLE email_campaigns IS 'Stores all email campaigns sent for post-billing activation';
COMMENT ON TABLE dashboard_notifications IS 'Psychology-driven notifications shown in dashboard';
COMMENT ON TABLE support_interventions IS 'Tracks intervention strategies for at-risk customers';
COMMENT ON TABLE business_milestones IS 'Records important milestones in customer journey';
COMMENT ON TABLE support_tickets IS 'Support tickets for retention and assistance';