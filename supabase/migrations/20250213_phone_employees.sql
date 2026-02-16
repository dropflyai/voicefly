-- Phone Employees System Migration
-- Run this migration to add phone employees support to VoiceFly

-- ============================================
-- PHONE EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS phone_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(100) NOT NULL DEFAULT 'Maya',
  job_type VARCHAR(50) NOT NULL,  -- receptionist, personal-assistant, order-taker, etc.
  complexity VARCHAR(20) DEFAULT 'simple',  -- simple, moderate, complex

  -- Configuration (stored as JSONB)
  voice JSONB DEFAULT '{"provider": "elevenlabs", "voiceId": "sarah", "speed": 1.0, "stability": 0.8}'::jsonb,
  personality JSONB DEFAULT '{"tone": "professional", "enthusiasm": "medium", "formality": "semi-formal"}'::jsonb,
  schedule JSONB,
  capabilities TEXT[],
  job_config JSONB NOT NULL,

  -- VAPI Integration
  vapi_assistant_id VARCHAR(255),
  vapi_phone_id VARCHAR(255),
  phone_number VARCHAR(20),

  -- Status
  is_active BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phone_employees_business ON phone_employees(business_id);
CREATE INDEX IF NOT EXISTS idx_phone_employees_job_type ON phone_employees(job_type);
CREATE INDEX IF NOT EXISTS idx_phone_employees_active ON phone_employees(is_active);

-- ============================================
-- PHONE MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS phone_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES phone_employees(id) ON DELETE SET NULL,

  -- Caller info
  caller_name VARCHAR(255),
  caller_phone VARCHAR(20) NOT NULL,
  caller_email VARCHAR(255),
  caller_company VARCHAR(255),

  -- Message content
  reason VARCHAR(500) NOT NULL,
  full_message TEXT NOT NULL,
  urgency VARCHAR(20) DEFAULT 'normal',  -- low, normal, high, urgent

  -- Routing
  for_person VARCHAR(255),
  department VARCHAR(100),

  -- Status
  status VARCHAR(20) DEFAULT 'new',  -- new, read, in_progress, resolved, archived

  -- Callback
  callback_requested BOOLEAN DEFAULT false,
  callback_time TIMESTAMP WITH TIME ZONE,
  callback_completed BOOLEAN DEFAULT false,

  -- Related call
  call_id VARCHAR(255),
  transcript_excerpt TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phone_messages_business ON phone_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_phone_messages_status ON phone_messages(status);
CREATE INDEX IF NOT EXISTS idx_phone_messages_urgency ON phone_messages(urgency);
CREATE INDEX IF NOT EXISTS idx_phone_messages_for_person ON phone_messages(for_person);
CREATE INDEX IF NOT EXISTS idx_phone_messages_created ON phone_messages(created_at DESC);

-- ============================================
-- SCHEDULED TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES phone_employees(id) ON DELETE SET NULL,

  -- Task type
  task_type VARCHAR(50) NOT NULL,  -- callback, send_reminder, send_confirmation, follow_up, check_in

  -- Target
  target_phone VARCHAR(20),
  target_email VARCHAR(255),
  target_name VARCHAR(255),

  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',

  -- Content
  message TEXT,
  template_id VARCHAR(100),
  metadata JSONB,

  -- Execution
  status VARCHAR(20) DEFAULT 'pending',  -- pending, in_progress, completed, failed, cancelled
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,

  -- Priority
  priority VARCHAR(20) DEFAULT 'normal',  -- low, normal, high, critical

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_business ON scheduled_tasks(business_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled ON scheduled_tasks(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_pending ON scheduled_tasks(status, scheduled_for) WHERE status = 'pending';

-- ============================================
-- PHONE ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS phone_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES phone_employees(id) ON DELETE SET NULL,
  call_id VARCHAR(255),

  -- Customer
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),

  -- Order details
  items JSONB NOT NULL,  -- Array of OrderItem
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  tip DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- Type
  order_type VARCHAR(20) DEFAULT 'pickup',  -- pickup, delivery, dine_in

  -- Delivery info
  delivery_address JSONB,

  -- Timing
  requested_time TIMESTAMP WITH TIME ZONE,
  estimated_ready TIMESTAMP WITH TIME ZONE,

  -- Status
  status VARCHAR(30) DEFAULT 'pending',  -- pending, confirmed, preparing, ready, out_for_delivery, completed, cancelled
  payment_status VARCHAR(20) DEFAULT 'unpaid',  -- unpaid, paid, refunded
  payment_method VARCHAR(20),

  -- Notes
  special_instructions TEXT,
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phone_orders_business ON phone_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_phone_orders_status ON phone_orders(status);
CREATE INDEX IF NOT EXISTS idx_phone_orders_created ON phone_orders(created_at DESC);

-- ============================================
-- ACTION REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS action_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES phone_employees(id) ON DELETE SET NULL,

  -- Action type
  action_type VARCHAR(50) NOT NULL,  -- send_sms, send_email, make_call, schedule_callback, etc.

  -- Target
  target JSONB NOT NULL,  -- {phone, email, webhookUrl}

  -- Content
  content JSONB NOT NULL,  -- {message, subject, templateId, data}

  -- Scheduling
  execute_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status VARCHAR(20) DEFAULT 'pending',  -- pending, in_progress, completed, failed
  result JSONB,

  -- Metadata
  triggered_by VARCHAR(20),  -- call, agent, schedule, manual
  source_call_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_requests_business ON action_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_action_requests_status ON action_requests(status);
CREATE INDEX IF NOT EXISTS idx_action_requests_pending ON action_requests(status, execute_at) WHERE status = 'pending';

-- ============================================
-- EMPLOYEE CALLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employee_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id VARCHAR(255) UNIQUE NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES phone_employees(id) ON DELETE SET NULL,

  -- Call info
  customer_phone VARCHAR(20),
  status VARCHAR(30),
  direction VARCHAR(10) DEFAULT 'inbound',

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER,  -- seconds

  -- Content
  transcript TEXT,
  recording_url VARCHAR(500),
  summary TEXT,

  -- Analytics
  cost DECIMAL(10, 4),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_calls_business ON employee_calls(business_id);
CREATE INDEX IF NOT EXISTS idx_employee_calls_employee ON employee_calls(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_calls_call_id ON employee_calls(call_id);
CREATE INDEX IF NOT EXISTS idx_employee_calls_created ON employee_calls(created_at DESC);

-- ============================================
-- EMPLOYEE METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employee_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES phone_employees(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL,  -- daily, weekly, monthly
  date DATE NOT NULL,

  -- Call metrics
  total_calls INTEGER DEFAULT 0,
  answered_calls INTEGER DEFAULT 0,
  missed_calls INTEGER DEFAULT 0,
  avg_call_duration INTEGER DEFAULT 0,  -- seconds

  -- Outcomes
  appointments_booked INTEGER DEFAULT 0,
  messages_taken INTEGER DEFAULT 0,
  orders_taken INTEGER DEFAULT 0,
  leads_captured INTEGER DEFAULT 0,
  transfers_to_human INTEGER DEFAULT 0,

  -- Quality
  avg_sentiment_score DECIMAL(3, 2),
  customer_satisfaction DECIMAL(3, 2),
  escalation_rate DECIMAL(3, 2),

  -- Actions
  sms_sent INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  callbacks_scheduled INTEGER DEFAULT 0,
  callbacks_completed INTEGER DEFAULT 0,

  -- Revenue (for order takers)
  orders_total DECIMAL(10, 2),
  avg_order_value DECIMAL(10, 2),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(employee_id, date, period)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_metrics_employee ON employee_metrics(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_metrics_date ON employee_metrics(date);
CREATE INDEX IF NOT EXISTS idx_employee_metrics_period ON employee_metrics(period);

-- ============================================
-- COMMUNICATION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Type
  type VARCHAR(20) NOT NULL,  -- sms, email, call
  direction VARCHAR(10) NOT NULL,  -- inbound, outbound

  -- Contact
  to_phone VARCHAR(20),
  from_phone VARCHAR(20),
  to_email VARCHAR(255),
  from_email VARCHAR(255),

  -- Content
  subject VARCHAR(500),
  content TEXT,

  -- External reference
  external_id VARCHAR(255),
  status VARCHAR(30),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_communication_logs_business ON communication_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_type ON communication_logs(type);
CREATE INDEX IF NOT EXISTS idx_communication_logs_created ON communication_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE phone_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own business phone_employees" ON phone_employees;
DROP POLICY IF EXISTS "Users can insert own business phone_employees" ON phone_employees;
DROP POLICY IF EXISTS "Users can update own business phone_employees" ON phone_employees;
DROP POLICY IF EXISTS "Users can delete own business phone_employees" ON phone_employees;

-- Create policies for phone_employees
CREATE POLICY "Users can view own business phone_employees"
  ON phone_employees FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own business phone_employees"
  ON phone_employees FOR INSERT
  WITH CHECK (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own business phone_employees"
  ON phone_employees FOR UPDATE
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own business phone_employees"
  ON phone_employees FOR DELETE
  USING (business_id IN (
    SELECT business_id FROM business_users WHERE user_id = auth.uid()
  ));

-- Service role bypass for webhook handlers
CREATE POLICY "Service role full access to phone_employees"
  ON phone_employees FOR ALL
  USING (auth.role() = 'service_role');

-- Apply similar policies to other tables (abbreviated for space)
CREATE POLICY "Service role full access to phone_messages"
  ON phone_messages FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to scheduled_tasks"
  ON scheduled_tasks FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to phone_orders"
  ON phone_orders FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to action_requests"
  ON action_requests FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to employee_calls"
  ON employee_calls FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to employee_metrics"
  ON employee_metrics FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to communication_logs"
  ON communication_logs FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Phone Employees migration completed successfully!';
  RAISE NOTICE 'Tables created: phone_employees, phone_messages, scheduled_tasks, phone_orders, action_requests, employee_calls, employee_metrics, communication_logs';
END $$;
