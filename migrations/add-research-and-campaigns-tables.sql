-- Migration: Add Research & Campaigns Tables
-- Description: Add tables for AI research, lead management, and marketing campaigns
-- Date: 2025-10-01

-- ============================================
-- LEADS & PROSPECTS
-- ============================================

-- Leads table (prospects in sales pipeline)
create table if not exists leads (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,

    -- Contact info
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    email varchar(255),
    phone varchar(20),
    company_name varchar(255),
    job_title varchar(255),
    linkedin_url varchar(500),
    website varchar(500),

    -- Lead details
    industry varchar(100),
    company_size varchar(50), -- '1-10', '11-50', '51-200', '201-500', '501+'
    location varchar(255),

    -- Qualification
    lead_source varchar(100), -- 'linkedin', 'referral', 'inbound', 'cold_outreach'
    lead_status varchar(50) default 'new', -- 'new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'closed_won', 'closed_lost'
    qualification_score integer default 0, -- 0-100

    -- Engagement
    last_contacted_at timestamp with time zone,
    next_follow_up_at timestamp with time zone,
    demo_scheduled_at timestamp with time zone,

    -- Financials
    estimated_deal_value decimal(10,2),
    estimated_close_date date,

    -- Owner
    assigned_to_staff_id uuid references staff(id) on delete set null,

    -- Notes
    notes text,
    tags text[], -- Array of tags like 'hot_lead', 'decision_maker', etc.

    -- Metadata
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Lead notes (research & interaction history)
create table if not exists lead_notes (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    lead_id uuid references leads(id) on delete cascade,

    note_type varchar(50) default 'general', -- 'general', 'research', 'call', 'email', 'meeting'
    title varchar(255),
    content text not null,

    -- Research-specific fields
    research_query text, -- If note came from AI research
    research_mode varchar(50), -- 'prospect', 'competitor', 'market', etc.

    -- Metadata
    created_by_staff_id uuid references staff(id) on delete set null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- ============================================
-- AI RESEARCH SYSTEM
-- ============================================

-- Research history (all queries & results)
create table if not exists research_history (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,

    -- Query details
    query text not null,
    mode varchar(50) not null, -- 'deep', 'quick', 'prospect', 'competitor', 'market'

    -- Results
    result_content text,
    result_summary text, -- Short summary for listings
    sources_count integer default 0,
    confidence_score decimal(3,2), -- 0.00 to 1.00

    -- Context
    related_lead_id uuid references leads(id) on delete set null,
    related_customer_id uuid references customers(id) on delete set null,
    page_context varchar(100), -- Where research was triggered from

    -- Performance
    duration_ms integer, -- How long research took
    tokens_used integer, -- AI tokens consumed

    -- Metadata
    created_by_staff_id uuid references staff(id) on delete set null,
    created_at timestamp with time zone default now()
);

-- Research templates (saved queries)
create table if not exists research_templates (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,

    -- Template details
    name varchar(255) not null,
    description text,
    query_template text not null, -- With placeholders like {prospect_name}, {industry}
    mode varchar(50) not null,

    -- Usage
    use_count integer default 0,
    last_used_at timestamp with time zone,

    -- Sharing
    is_shared boolean default false, -- Share with team
    created_by_staff_id uuid references staff(id) on delete set null,

    -- Metadata
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- ============================================
-- MARKETING CAMPAIGNS
-- ============================================

-- Email campaigns
create table if not exists marketing_campaigns (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,

    -- Campaign details
    name varchar(255) not null,
    campaign_type varchar(50) default 'email', -- 'email', 'sms', 'voice'
    status varchar(50) default 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'paused'

    -- Email content
    subject_line varchar(500),
    preview_text varchar(500),
    email_content text,

    -- Research connection
    source_research_id uuid references research_history(id) on delete set null,
    research_insights jsonb, -- Key insights extracted from research

    -- Targeting
    target_segment varchar(100), -- 'all_customers', 'new_leads', 'qualified_leads', 'custom'
    target_lead_status varchar(50), -- Filter by lead status
    target_tags text[], -- Filter by tags

    -- Scheduling
    scheduled_send_at timestamp with time zone,
    sent_at timestamp with time zone,

    -- Performance
    recipients_count integer default 0,
    opens_count integer default 0,
    clicks_count integer default 0,
    replies_count integer default 0,
    conversions_count integer default 0,

    -- Metadata
    created_by_staff_id uuid references staff(id) on delete set null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Campaign recipients tracking
create table if not exists campaign_recipients (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    campaign_id uuid references marketing_campaigns(id) on delete cascade,

    -- Recipient
    lead_id uuid references leads(id) on delete cascade,
    customer_id uuid references customers(id) on delete set null,
    email varchar(255) not null,

    -- Delivery
    status varchar(50) default 'pending', -- 'pending', 'sent', 'delivered', 'bounced', 'failed'
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,

    -- Engagement
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    replied_at timestamp with time zone,
    converted_at timestamp with time zone,

    -- Email service
    email_provider_id varchar(255), -- Resend/Sendgrid message ID
    bounce_reason text,

    -- Metadata
    created_at timestamp with time zone default now()
);

-- ============================================
-- VOICE CAMPAIGNS (VAPI)
-- ============================================

-- Voice campaigns (AI calling campaigns)
create table if not exists voice_campaigns (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,

    -- Campaign details
    name varchar(255) not null,
    description text,
    status varchar(50) default 'draft', -- 'draft', 'active', 'paused', 'completed'

    -- VAPI configuration
    vapi_assistant_id varchar(255),
    vapi_phone_number_id uuid references phone_numbers(id) on delete set null,

    -- Script
    greeting_script text,
    value_proposition text,
    qualifying_questions jsonb, -- Array of questions
    objection_handling jsonb, -- Key/value objections and responses
    closing_script text,

    -- Research connection
    source_research_id uuid references research_history(id) on delete set null,
    competitor_insights jsonb,

    -- Targeting
    target_segment varchar(100),
    target_lead_status varchar(50),
    max_calls_per_day integer default 50,

    -- Performance
    total_calls integer default 0,
    successful_connections integer default 0,
    demos_booked integer default 0,
    deals_closed integer default 0,

    -- Metadata
    created_by_staff_id uuid references staff(id) on delete set null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Voice campaign calls (individual call tracking)
create table if not exists voice_campaign_calls (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references businesses(id) on delete cascade,
    campaign_id uuid references voice_campaigns(id) on delete cascade,

    -- Recipient
    lead_id uuid references leads(id) on delete cascade,
    phone_number varchar(20) not null,

    -- Call details
    vapi_call_id varchar(255) unique,
    call_status varchar(50), -- 'queued', 'in_progress', 'completed', 'failed', 'no_answer'
    call_outcome varchar(100), -- 'demo_booked', 'interested', 'not_interested', 'callback_requested', 'no_answer'

    -- Call data
    duration_seconds integer,
    transcript text,
    call_recording_url text,
    sentiment_score decimal(3,2), -- 0.00 to 1.00 (negative to positive)

    -- Follow-up
    demo_scheduled_at timestamp with time zone,
    follow_up_required boolean default false,
    follow_up_notes text,

    -- Metadata
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Leads indexes
create index if not exists idx_leads_business on leads(business_id);
create index if not exists idx_leads_status on leads(lead_status);
create index if not exists idx_leads_email on leads(email);
create index if not exists idx_leads_assigned on leads(assigned_to_staff_id);
create index if not exists idx_leads_next_followup on leads(next_follow_up_at);

-- Lead notes indexes
create index if not exists idx_lead_notes_lead on lead_notes(lead_id);
create index if not exists idx_lead_notes_type on lead_notes(note_type);

-- Research indexes
create index if not exists idx_research_history_business on research_history(business_id);
create index if not exists idx_research_history_lead on research_history(related_lead_id);
create index if not exists idx_research_history_created on research_history(created_at);

-- Campaign indexes
create index if not exists idx_campaigns_business on marketing_campaigns(business_id);
create index if not exists idx_campaigns_status on marketing_campaigns(status);
create index if not exists idx_campaign_recipients_campaign on campaign_recipients(campaign_id);
create index if not exists idx_campaign_recipients_lead on campaign_recipients(lead_id);

-- Voice campaign indexes
create index if not exists idx_voice_campaigns_business on voice_campaigns(business_id);
create index if not exists idx_voice_campaign_calls_campaign on voice_campaign_calls(campaign_id);
create index if not exists idx_voice_campaign_calls_lead on voice_campaign_calls(lead_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

create trigger update_leads_updated_at before update on leads
    for each row execute function update_updated_at_column();

create trigger update_lead_notes_updated_at before update on lead_notes
    for each row execute function update_updated_at_column();

create trigger update_research_templates_updated_at before update on research_templates
    for each row execute function update_updated_at_column();

create trigger update_marketing_campaigns_updated_at before update on marketing_campaigns
    for each row execute function update_updated_at_column();

create trigger update_voice_campaigns_updated_at before update on voice_campaigns
    for each row execute function update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table leads enable row level security;
alter table lead_notes enable row level security;
alter table research_history enable row level security;
alter table research_templates enable row level security;
alter table marketing_campaigns enable row level security;
alter table campaign_recipients enable row level security;
alter table voice_campaigns enable row level security;
alter table voice_campaign_calls enable row level security;

-- Policies: Users can only access data for their business

-- Leads policies
create policy "Users can view leads for their business"
    on leads for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can insert leads for their business"
    on leads for insert
    with check (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can update leads for their business"
    on leads for update
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- Lead notes policies
create policy "Users can view lead notes for their business"
    on lead_notes for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can insert lead notes for their business"
    on lead_notes for insert
    with check (business_id in (
        select id from businesses where id = business_id
    ));

-- Research history policies
create policy "Users can view research for their business"
    on research_history for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can insert research for their business"
    on research_history for insert
    with check (business_id in (
        select id from businesses where id = business_id
    ));

-- Research templates policies
create policy "Users can view templates for their business"
    on research_templates for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can manage templates for their business"
    on research_templates for all
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- Marketing campaigns policies
create policy "Users can view campaigns for their business"
    on marketing_campaigns for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can manage campaigns for their business"
    on marketing_campaigns for all
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- Campaign recipients policies
create policy "Users can view recipients for their business"
    on campaign_recipients for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can manage recipients for their business"
    on campaign_recipients for all
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- Voice campaigns policies
create policy "Users can view voice campaigns for their business"
    on voice_campaigns for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can manage voice campaigns for their business"
    on voice_campaigns for all
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- Voice campaign calls policies
create policy "Users can view voice calls for their business"
    on voice_campaign_calls for select
    using (business_id in (
        select id from businesses where id = business_id
    ));

create policy "Users can manage voice calls for their business"
    on voice_campaign_calls for all
    using (business_id in (
        select id from businesses where id = business_id
    ));

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- View: Lead pipeline summary
create or replace view lead_pipeline_summary as
select
    business_id,
    lead_status,
    count(*) as lead_count,
    sum(estimated_deal_value) as total_pipeline_value,
    avg(qualification_score) as avg_qualification_score
from leads
group by business_id, lead_status;

-- View: Campaign performance summary
create or replace view campaign_performance as
select
    c.id as campaign_id,
    c.name as campaign_name,
    c.business_id,
    c.recipients_count,
    c.opens_count,
    c.clicks_count,
    c.conversions_count,
    round((c.opens_count::decimal / nullif(c.recipients_count, 0)) * 100, 2) as open_rate,
    round((c.clicks_count::decimal / nullif(c.opens_count, 0)) * 100, 2) as click_through_rate,
    round((c.conversions_count::decimal / nullif(c.recipients_count, 0)) * 100, 2) as conversion_rate
from marketing_campaigns c
where c.status = 'sent';

-- View: Research usage by mode
create or replace view research_usage_stats as
select
    business_id,
    mode,
    count(*) as query_count,
    avg(duration_ms) as avg_duration_ms,
    avg(confidence_score) as avg_confidence,
    sum(tokens_used) as total_tokens
from research_history
group by business_id, mode;
