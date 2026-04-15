-- Phase 2: Tenant A2P 10DLC Registration
-- Tracks per-tenant brand + campaign registrations with Twilio
-- Run via Supabase Management API or the SQL editor

-- ─── Track registration attempts ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_a2p_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Overall status — one of:
  --   draft                — form not submitted
  --   customer_profile_pending, customer_profile_approved, customer_profile_rejected
  --   brand_pending, brand_approved, brand_rejected
  --   campaign_pending, campaign_approved, campaign_rejected
  --   active                — campaign approved and SMS is live
  status text NOT NULL DEFAULT 'draft',

  -- Twilio resource SIDs
  twilio_customer_profile_sid text,
  twilio_trust_product_sid text,
  twilio_brand_sid text,
  twilio_messaging_service_sid text,
  twilio_campaign_sid text,
  twilio_phone_number_sid text,
  twilio_phone_number text,

  -- Business legal info submitted (required for brand registration)
  -- Keys: legal_name, ein, business_type, industry, website, address_street,
  --       address_city, address_state, address_zip, address_country, phone
  business_legal_info jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Latest failure details (if any)
  failure_reason text,
  failure_code text,
  failure_field text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  brand_approved_at timestamptz,
  campaign_approved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_a2p_business_id
  ON tenant_a2p_registrations(business_id);

CREATE INDEX IF NOT EXISTS idx_tenant_a2p_status
  ON tenant_a2p_registrations(status) WHERE status NOT IN ('active', 'campaign_rejected');

-- Enable RLS — business members can view their own registrations
ALTER TABLE tenant_a2p_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_members_view_own_a2p"
  ON tenant_a2p_registrations FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_manages_a2p"
  ON tenant_a2p_registrations FOR ALL
  USING (auth.role() = 'service_role');

-- ─── Extend businesses with SMS feature state ───────────────────────────────

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS sms_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS sms_segments_limit integer;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS sms_segments_used integer NOT NULL DEFAULT 0;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS sms_segments_reset_at timestamptz;

-- Per-plan SMS allowances:
--   Starter (49)  → 100 segments
--   Growth (129)  → 400 segments
--   Pro    (249)  → 1000 segments

-- ─── Helper: fetch the active registration for a business ──────────────────

CREATE OR REPLACE FUNCTION get_active_a2p_registration(p_business_id uuid)
RETURNS tenant_a2p_registrations
LANGUAGE sql STABLE
AS $$
  SELECT * FROM tenant_a2p_registrations
  WHERE business_id = p_business_id
  ORDER BY
    CASE WHEN status = 'active' THEN 0 ELSE 1 END,
    created_at DESC
  LIMIT 1;
$$;

-- ─── Helper: increment sms_segments_used atomically ────────────────────────

CREATE OR REPLACE FUNCTION increment_sms_usage(p_business_id uuid, p_segments integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  new_used integer;
BEGIN
  UPDATE businesses
  SET sms_segments_used = sms_segments_used + p_segments,
      updated_at = now()
  WHERE id = p_business_id
  RETURNING sms_segments_used INTO new_used;

  RETURN new_used;
END;
$$;

-- ─── Auto-update updated_at ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_tenant_a2p_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenant_a2p_updated_at_trigger ON tenant_a2p_registrations;
CREATE TRIGGER tenant_a2p_updated_at_trigger
  BEFORE UPDATE ON tenant_a2p_registrations
  FOR EACH ROW EXECUTE FUNCTION update_tenant_a2p_updated_at();
