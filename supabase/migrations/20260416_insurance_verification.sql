-- Insurance Verification — Capture + Queue Flow
-- See docs/scopes/insurance-verification.md for full spec
--
-- AI captures insurance details during a call → creates a record with
-- status='pending' → staff verifies in batches via dashboard → optional
-- auto-SMS to patient on completion.

CREATE TABLE IF NOT EXISTS insurance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Linked sources (at least one populated; appointment is preferred)
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  call_id text,

  -- Caller identity
  customer_name text,
  customer_phone text,
  customer_dob date,

  -- Insurance details (collected from caller)
  carrier_name text NOT NULL,
  member_id text NOT NULL,
  group_number text,
  subscriber_name text,
  subscriber_relationship text CHECK (subscriber_relationship IN ('self','spouse','parent','child','other') OR subscriber_relationship IS NULL),
  subscriber_dob date,

  -- Optional procedure context
  procedure_inquired text,

  -- Verification state
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','verified','denied','needs_more_info','archived')),
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  coverage_notes text,
  estimated_patient_responsibility numeric(8, 2),
  estimated_insurance_pays numeric(8, 2),

  -- Patient SMS notification state (after staff verifies)
  patient_notified_at timestamptz,
  patient_notification_status text
    CHECK (patient_notification_status IN ('sent','blocked_no_sms','blocked_quota','failed') OR patient_notification_status IS NULL),

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insurance_records_business_status
  ON insurance_records(business_id, status);

CREATE INDEX IF NOT EXISTS idx_insurance_records_appointment
  ON insurance_records(appointment_id) WHERE appointment_id IS NOT NULL;

ALTER TABLE insurance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_members_view_own_insurance" ON insurance_records;
CREATE POLICY "business_members_view_own_insurance"
  ON insurance_records FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "business_members_update_own_insurance" ON insurance_records;
CREATE POLICY "business_members_update_own_insurance"
  ON insurance_records FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_manages_insurance" ON insurance_records;
CREATE POLICY "service_role_manages_insurance"
  ON insurance_records FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_insurance_records_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS insurance_records_updated_at_trigger ON insurance_records;
CREATE TRIGGER insurance_records_updated_at_trigger
  BEFORE UPDATE ON insurance_records
  FOR EACH ROW EXECUTE FUNCTION update_insurance_records_updated_at();
