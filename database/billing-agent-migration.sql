-- =============================================
-- BILLING AGENT MIGRATION
-- New tables for billing orchestration
-- =============================================

-- 1. billing_alerts: Track alerts sent to businesses
CREATE TABLE IF NOT EXISTS billing_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    -- alert_type values: 'low_credits', 'credits_exhausted', 'credits_exhausted_soon',
    --   'trial_expiring', 'trial_expired', 'payment_failed', 'usage_spike',
    --   'overage_warning', 'service_suspended'
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    -- severity: 'info', 'warning', 'critical'
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_alerts_business ON billing_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_billing_alerts_type ON billing_alerts(alert_type, created_at);
CREATE INDEX IF NOT EXISTS idx_billing_alerts_unack ON billing_alerts(business_id, acknowledged) WHERE acknowledged = false;
-- Unique constraint to prevent duplicate alerts per business per type per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_alerts_dedup ON billing_alerts(business_id, alert_type, (created_at::date));

-- 2. usage_records: Per-service metering aggregation
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    -- service_type: 'voice_inbound', 'voice_outbound', 'sms_campaign',
    --   'email_campaign', 'ai_chat', 'maya_research', 'appointment',
    --   'workflow', 'automation', 'lead_enrichment', 'overage'
    units_consumed INTEGER NOT NULL DEFAULT 0,
    credits_consumed INTEGER NOT NULL DEFAULT 0,
    cost_dollars DECIMAL(10, 4) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_records_business_period ON usage_records(business_id, period_start);
CREATE INDEX IF NOT EXISTS idx_usage_records_service ON usage_records(service_type, period_start);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_records_dedup ON usage_records(business_id, period_start, service_type);

-- 3. billing_invoices: Platform-side invoice records
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    -- Line item amounts (in cents)
    subscription_amount_cents INTEGER NOT NULL DEFAULT 0,
    overage_amount_cents INTEGER NOT NULL DEFAULT 0,
    pack_purchase_amount_cents INTEGER NOT NULL DEFAULT 0,
    promo_credit_cents INTEGER NOT NULL DEFAULT 0,
    total_amount_cents INTEGER NOT NULL DEFAULT 0,
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- status: 'draft', 'finalized', 'paid', 'overdue', 'void'
    stripe_invoice_id VARCHAR(255),
    -- Details
    line_items JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    finalized_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_business ON billing_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_period ON billing_invoices(business_id, period_start);

-- 4. dunning_records: Failed payment tracking and retry state
CREATE TABLE IF NOT EXISTS dunning_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    -- Dunning state
    attempt_count INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 4,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    grace_period_ends_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    -- status: 'active', 'recovered', 'exhausted', 'suspended'
    -- Escalation tracking
    last_email_sent_at TIMESTAMP WITH TIME ZONE,
    emails_sent INTEGER DEFAULT 0,
    suspension_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dunning_business ON dunning_records(business_id);
CREATE INDEX IF NOT EXISTS idx_dunning_status ON dunning_records(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_dunning_retry ON dunning_records(next_retry_at) WHERE status = 'active';

-- 5. revenue_snapshots: Daily platform-level revenue metrics
CREATE TABLE IF NOT EXISTS revenue_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_date DATE NOT NULL UNIQUE,
    -- MRR breakdown (in cents)
    total_mrr_cents INTEGER DEFAULT 0,
    subscription_mrr_cents INTEGER DEFAULT 0,
    overage_mrr_cents INTEGER DEFAULT 0,
    pack_revenue_cents INTEGER DEFAULT 0,
    -- Counts
    total_businesses INTEGER DEFAULT 0,
    paying_businesses INTEGER DEFAULT 0,
    trial_businesses INTEGER DEFAULT 0,
    churned_businesses INTEGER DEFAULT 0,
    -- Computed metrics
    arpu_cents INTEGER DEFAULT 0,
    churn_rate DECIMAL(5, 4) DEFAULT 0,
    -- Tier breakdown
    tier_breakdown JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_snapshots_date ON revenue_snapshots(snapshot_date);

-- Add columns to businesses table for billing agent tracking
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_billing_alert_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS dunning_status VARCHAR(20) DEFAULT 'none';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS promotional_credits INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE billing_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE dunning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_snapshots ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies (matching existing pattern)
CREATE POLICY "service_role_billing_alerts" ON billing_alerts FOR ALL
    USING (auth.role() = 'service_role');
CREATE POLICY "service_role_usage_records" ON usage_records FOR ALL
    USING (auth.role() = 'service_role');
CREATE POLICY "service_role_billing_invoices" ON billing_invoices FOR ALL
    USING (auth.role() = 'service_role');
CREATE POLICY "service_role_dunning_records" ON dunning_records FOR ALL
    USING (auth.role() = 'service_role');
CREATE POLICY "service_role_revenue_snapshots" ON revenue_snapshots FOR ALL
    USING (auth.role() = 'service_role');
