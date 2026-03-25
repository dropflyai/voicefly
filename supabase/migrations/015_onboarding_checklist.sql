-- =============================================
-- Onboarding Checklist Migration
-- Adds onboarding tracking columns to businesses
-- =============================================

-- Add onboarding tracking columns (onboarding_completed already exists)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS first_call_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at TIMESTAMPTZ;

-- Index for querying businesses still in onboarding
CREATE INDEX IF NOT EXISTS idx_businesses_onboarding
  ON businesses (onboarding_completed)
  WHERE onboarding_completed = false;

-- Function to auto-update first_call_at when first call is recorded
CREATE OR REPLACE FUNCTION set_first_call_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE businesses
  SET first_call_at = NEW.started_at,
      updated_at = NOW()
  WHERE id = NEW.business_id
    AND first_call_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on employee_calls to capture first call timestamp
DROP TRIGGER IF EXISTS trg_set_first_call_at ON employee_calls;
CREATE TRIGGER trg_set_first_call_at
  AFTER INSERT ON employee_calls
  FOR EACH ROW
  EXECUTE FUNCTION set_first_call_at();

-- Backfill first_call_at for existing businesses that already have calls
UPDATE businesses b
SET first_call_at = sub.earliest
FROM (
  SELECT business_id, MIN(started_at) AS earliest
  FROM employee_calls
  GROUP BY business_id
) sub
WHERE b.id = sub.business_id
  AND b.first_call_at IS NULL;
