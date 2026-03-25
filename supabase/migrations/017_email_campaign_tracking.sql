-- Email Campaign Tracking + A/B Testing

CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status text DEFAULT 'draft',
  type text DEFAULT 'single', -- 'single' or 'ab_test'
  variants jsonb DEFAULT '[]',
  target_audience text DEFAULT 'prospects',
  total_recipients int DEFAULT 0,
  sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES email_campaigns(id) ON DELETE CASCADE,
  variant_id text NOT NULL,
  email text NOT NULL,
  name text,
  business_name text,
  industry text,
  status text DEFAULT 'pending', -- pending, sent, opened, clicked, converted, bounced, unsubscribed
  sent_at timestamptz,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count int DEFAULT 0,
  clicked_links jsonb DEFAULT '[]',
  converted_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ecr_campaign_id ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ecr_email ON email_campaign_recipients(email);
CREATE INDEX IF NOT EXISTS idx_ecr_status ON email_campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_ecr_campaign_variant ON email_campaign_recipients(campaign_id, variant_id);
