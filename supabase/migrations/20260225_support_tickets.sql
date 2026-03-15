-- Support tickets table for AI agent escalation
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT 'Unknown',
  plan TEXT NOT NULL DEFAULT 'starter',
  user_email TEXT,
  summary TEXT NOT NULL,
  conversation JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY support_tickets_service_role ON support_tickets
  FOR ALL USING (auth.role() = 'service_role');

-- Users can view their own tickets
CREATE POLICY support_tickets_user_read ON support_tickets
  FOR SELECT USING (
    business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_business_id ON support_tickets(business_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
