-- Automation Rules Engine Migration
-- Stores user-defined IF/THEN rules that fire on system events

-- ============================================
-- AUTOMATION RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Rule definition
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(100) NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,

  -- State
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  template_id VARCHAR(100),

  -- Stats
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_business ON automation_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_event ON automation_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(business_id, trigger_event) WHERE is_active = true;

-- ============================================
-- AUTOMATION RULE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS automation_rule_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,

  -- Execution details
  rule_name VARCHAR(255),
  trigger_event VARCHAR(100),
  conditions_met BOOLEAN DEFAULT false,
  actions_executed INTEGER DEFAULT 0,
  actions_failed INTEGER DEFAULT 0,
  event_data JSONB,
  error TEXT,

  -- Timestamps
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_rule_logs_business ON automation_rule_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_automation_rule_logs_rule ON automation_rule_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_rule_logs_executed ON automation_rule_logs(executed_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rule_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own business automation_rules" ON automation_rules;
DROP POLICY IF EXISTS "Users can insert own business automation_rules" ON automation_rules;
DROP POLICY IF EXISTS "Users can update own business automation_rules" ON automation_rules;
DROP POLICY IF EXISTS "Users can delete own business automation_rules" ON automation_rules;
DROP POLICY IF EXISTS "Service role full access to automation_rules" ON automation_rules;

DROP POLICY IF EXISTS "Users can view own business automation_rule_logs" ON automation_rule_logs;
DROP POLICY IF EXISTS "Service role full access to automation_rule_logs" ON automation_rule_logs;

-- Policies for automation_rules
CREATE POLICY "Users can view own business automation_rules"
  ON automation_rules FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own business automation_rules"
  ON automation_rules FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own business automation_rules"
  ON automation_rules FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own business automation_rules"
  ON automation_rules FOR DELETE
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

-- Service role bypass
CREATE POLICY "Service role full access to automation_rules"
  ON automation_rules FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for automation_rule_logs (read-only for users)
CREATE POLICY "Users can view own business automation_rule_logs"
  ON automation_rule_logs FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to automation_rule_logs"
  ON automation_rule_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Automation rules migration completed successfully!';
  RAISE NOTICE 'Tables created: automation_rules, automation_rule_logs';
END $$;
