-- COMPLETE ENTERPRISE SCHEMA ADDITIONS

-- Voice Scripts & Templates
CREATE TABLE voice_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  script_type TEXT CHECK (script_type IN ('cold_call', 'follow_up', 'qualification', 'demo_booking', 'custom')),
  industry TEXT,
  persona TEXT, -- 'ceo', 'cto', 'sales_director', etc
  script_content TEXT NOT NULL,
  variables JSONB, -- Dynamic variables like {company_name}, {pain_point}
  objection_handlers JSONB, -- Common objections and responses
  success_rate DECIMAL(5,2),
  is_template BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call Recordings & Transcripts
CREATE TABLE call_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID REFERENCES voice_calls(id) ON DELETE CASCADE NOT NULL,
  recording_url TEXT NOT NULL,
  transcript_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  storage_provider TEXT DEFAULT 's3',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Enrichment Data
CREATE TABLE lead_enrichment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  -- Company data
  company_revenue TEXT,
  company_employees TEXT,
  company_founded_year INTEGER,
  company_description TEXT,
  company_technologies JSONB, -- Tech stack
  company_funding JSONB, -- Funding rounds
  company_news JSONB, -- Recent news
  -- Contact data
  contact_linkedin TEXT,
  contact_twitter TEXT,
  contact_title TEXT,
  contact_seniority TEXT,
  contact_department TEXT,
  -- Intelligence
  buying_signals JSONB,
  competitor_usage JSONB,
  pain_points JSONB,
  enriched_at TIMESTAMPTZ DEFAULT NOW(),
  enrichment_source TEXT, -- 'manual', 'clearbit', 'apollo', 'leadfly'
  UNIQUE(lead_id)
);

-- Email Templates & Sequences
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  template_type TEXT CHECK (template_type IN ('follow_up', 'introduction', 'meeting_request', 'thank_you', 'custom')),
  variables JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up Sequences
CREATE TABLE follow_up_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger_event TEXT CHECK (trigger_event IN ('call_completed', 'no_answer', 'qualified', 'not_qualified', 'meeting_scheduled')),
  steps JSONB NOT NULL, -- Array of {delay_hours, action_type, template_id}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings & Calendar Integration
CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  call_id UUID REFERENCES voice_calls(id),
  scheduled_by UUID REFERENCES auth.users(id),
  meeting_type TEXT CHECK (meeting_type IN ('demo', 'discovery', 'follow_up', 'closing', 'check_in')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_url TEXT, -- Zoom/Teams/Google Meet link
  calendar_event_id TEXT, -- External calendar ID
  notes TEXT,
  outcome TEXT,
  attended BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations Configuration
CREATE TABLE integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  integration_type TEXT CHECK (integration_type IN ('salesforce', 'hubspot', 'pipedrive', 'slack', 'teams', 'zapier', 'webhook', 'calendly', 'zoom')),
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- Encrypted credentials and settings
  field_mappings JSONB, -- Map VoiceFly fields to CRM fields
  sync_frequency TEXT CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'manual')),
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, integration_type)
);

-- Webhooks for real-time updates
CREATE TABLE webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['call.started', 'call.completed', 'lead.qualified']
  headers JSONB,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Performance Analytics
CREATE TABLE team_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  period_date DATE NOT NULL,
  -- Metrics
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  total_minutes DECIMAL(10,2) DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  meetings_scheduled INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  average_call_duration DECIMAL(10,2),
  -- Rankings
  team_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_date)
);

-- Custom Fields for Leads (Dynamic schema)
CREATE TABLE custom_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect')),
  field_options JSONB, -- For select/multiselect
  is_required BOOLEAN DEFAULT false,
  applies_to TEXT CHECK (applies_to IN ('lead', 'campaign', 'call')),
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, field_name, applies_to)
);

-- Custom Field Values
CREATE TABLE custom_field_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID REFERENCES custom_fields(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID NOT NULL, -- ID of lead, campaign, or call
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_id, entity_id)
);

-- AI Training Data (for improving voice AI)
CREATE TABLE ai_training_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  call_id UUID REFERENCES voice_calls(id) NOT NULL,
  feedback_type TEXT CHECK (feedback_type IN ('positive', 'negative', 'correction')),
  segment_start_time INTEGER, -- Seconds into call
  segment_end_time INTEGER,
  original_response TEXT,
  suggested_response TEXT,
  feedback_notes TEXT,
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  -- Channels
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  -- Events
  notify_call_completed BOOLEAN DEFAULT true,
  notify_lead_qualified BOOLEAN DEFAULT true,
  notify_meeting_scheduled BOOLEAN DEFAULT true,
  notify_campaign_completed BOOLEAN DEFAULT true,
  notify_daily_summary BOOLEAN DEFAULT true,
  notify_weekly_report BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Tags for organization and filtering
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#gray',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Tag associations (polymorphic)
CREATE TABLE tag_associations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('lead', 'campaign', 'call')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tag_id, entity_type, entity_id)
);

-- Call Queue Management
CREATE TABLE call_queues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES voice_campaigns(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  priority INTEGER DEFAULT 0,
  scheduled_for TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);

-- AB Testing for Scripts
CREATE TABLE ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  test_type TEXT CHECK (test_type IN ('script', 'voice', 'timing', 'opener')),
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  traffic_split DECIMAL(3,2) DEFAULT 0.50, -- Percentage to variant A
  success_metric TEXT, -- 'qualification_rate', 'meeting_rate', etc
  -- Results
  variant_a_trials INTEGER DEFAULT 0,
  variant_a_successes INTEGER DEFAULT 0,
  variant_b_trials INTEGER DEFAULT 0,
  variant_b_successes INTEGER DEFAULT 0,
  statistical_significance DECIMAL(5,4),
  winner TEXT CHECK (winner IN ('a', 'b', 'none')),
  status TEXT CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create all indexes
CREATE INDEX idx_voice_scripts_org ON voice_scripts(organization_id);
CREATE INDEX idx_lead_enrichment_lead ON lead_enrichment(lead_id);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX idx_integrations_org ON integrations(organization_id);
CREATE INDEX idx_team_performance_user ON team_performance(user_id);
CREATE INDEX idx_team_performance_period ON team_performance(period_date);
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_id);
CREATE INDEX idx_tag_associations_entity ON tag_associations(entity_type, entity_id);
CREATE INDEX idx_call_queues_status ON call_queues(status);
CREATE INDEX idx_call_queues_scheduled ON call_queues(scheduled_for);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);