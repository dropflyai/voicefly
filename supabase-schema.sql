-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Leads table (shared with LeadFly)
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  qualification_score INTEGER CHECK (qualification_score >= 0 AND qualification_score <= 100),
  research_data JSONB,
  source TEXT CHECK (source IN ('manual', 'leadfly', 'csv_upload', 'crm_sync')) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice campaigns
CREATE TABLE voice_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
  total_leads INTEGER DEFAULT 0,
  completed_calls INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  script_template TEXT,
  voice_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice calls
CREATE TABLE voice_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES voice_campaigns(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'calling', 'completed', 'failed')) DEFAULT 'pending',
  duration INTEGER, -- in seconds
  transcript TEXT,
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  outcome TEXT CHECK (outcome IN ('qualified', 'not_qualified', 'callback', 'no_answer')),
  research_data JSONB,
  recording_url TEXT,
  vapi_call_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign leads (many-to-many)
CREATE TABLE campaign_leads (
  campaign_id UUID REFERENCES voice_campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (campaign_id, lead_id)
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own leads" ON leads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own campaigns" ON voice_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own calls" ON voice_calls FOR ALL USING (
  EXISTS (SELECT 1 FROM voice_campaigns WHERE voice_campaigns.id = voice_calls.campaign_id AND voice_campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can manage their campaign leads" ON campaign_leads FOR ALL USING (
  EXISTS (SELECT 1 FROM voice_campaigns WHERE voice_campaigns.id = campaign_leads.campaign_id AND voice_campaigns.user_id = auth.uid())
);

-- Indexes
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_voice_campaigns_user_id ON voice_campaigns(user_id);
CREATE INDEX idx_voice_campaigns_status ON voice_campaigns(status);
CREATE INDEX idx_voice_calls_campaign_id ON voice_calls(campaign_id);
CREATE INDEX idx_voice_calls_lead_id ON voice_calls(lead_id);
CREATE INDEX idx_voice_calls_status ON voice_calls(status);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_voice_campaigns_updated_at BEFORE UPDATE ON voice_campaigns FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_voice_calls_updated_at BEFORE UPDATE ON voice_calls FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();