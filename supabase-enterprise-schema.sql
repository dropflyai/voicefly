-- ENTERPRISE FEATURES FOR VOICEFLY

-- Organizations (Multi-tenancy)
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  size TEXT CHECK (size IN ('startup', 'smb', 'mid-market', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members
CREATE TABLE organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Subscription Plans
CREATE TABLE subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier TEXT CHECK (tier IN ('free', 'starter', 'professional', 'enterprise')) NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  -- Limits
  max_users INTEGER DEFAULT 1,
  max_calls_per_month INTEGER DEFAULT 100,
  max_leads_per_month INTEGER DEFAULT 1000,
  max_campaigns INTEGER DEFAULT 5,
  max_minutes_per_call INTEGER DEFAULT 10,
  -- Features
  features JSONB DEFAULT '{}',
  has_api_access BOOLEAN DEFAULT false,
  has_crm_integration BOOLEAN DEFAULT false,
  has_custom_voice BOOLEAN DEFAULT false,
  has_web_research BOOLEAN DEFAULT false,
  has_advanced_analytics BOOLEAN DEFAULT false,
  has_white_label BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Subscriptions
CREATE TABLE organization_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  status TEXT CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')) DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  trial_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Tracking
CREATE TABLE organization_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- Usage metrics
  total_calls INTEGER DEFAULT 0,
  total_minutes DECIMAL(10,2) DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  leads_imported INTEGER DEFAULT 0,
  leads_enriched INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  -- Costs
  overage_minutes DECIMAL(10,2) DEFAULT 0,
  overage_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, period_start)
);

-- API Keys for Integration
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL, -- Store hashed version
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  permissions JSONB DEFAULT '{"read": true, "write": false}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Audit Logs (Compliance)
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'campaign.created', 'call.initiated', etc.
  resource_type TEXT, -- 'campaign', 'lead', 'call', etc.
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing Events
CREATE TABLE billing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('payment', 'refund', 'credit', 'invoice', 'overage')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  stripe_event_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update existing tables to support multi-tenancy
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES organizations(id);
ALTER TABLE voice_campaigns ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create indexes for performance
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_subscriptions_org_id ON organization_subscriptions(organization_id);
CREATE INDEX idx_org_usage_org_id ON organization_usage(organization_id);
CREATE INDEX idx_org_usage_period ON organization_usage(period_start, period_end);
CREATE INDEX idx_api_keys_org_id ON api_keys(organization_id);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_billing_events_org_id ON billing_events(organization_id);

-- Row Level Security for new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their organizations" ON organizations
  FOR UPDATE USING (owner_id = auth.uid());

-- RLS for organization members
CREATE POLICY "Members can view their organization members" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, tier, price_monthly, price_yearly, max_users, max_calls_per_month, max_leads_per_month, max_campaigns, max_minutes_per_call, has_api_access, has_crm_integration, has_custom_voice, has_web_research, has_advanced_analytics, has_white_label) VALUES
('Free Trial', 'free-trial', 'free', 0, 0, 1, 50, 100, 2, 5, false, false, false, false, false, false),
('Starter', 'starter', 'starter', 299, 2990, 3, 500, 1000, 5, 10, true, false, false, true, false, false),
('Professional', 'professional', 'professional', 999, 9990, 10, 2500, 5000, 20, 15, true, true, true, true, true, false),
('Enterprise', 'enterprise', 'enterprise', 2999, 29990, 9999, 10000, 50000, 9999, 30, true, true, true, true, true, true);