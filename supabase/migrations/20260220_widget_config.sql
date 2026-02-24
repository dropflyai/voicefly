-- Chat widget configuration on phone_employees
-- widget_token: public UUID used in embed scripts (safe to expose)
-- widget_config: JSONB blob with all customization options

ALTER TABLE phone_employees
  ADD COLUMN IF NOT EXISTS widget_token  UUID    DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS widget_config JSONB   DEFAULT '{}'::jsonb;

-- Backfill any existing rows so they get a token
UPDATE phone_employees
  SET widget_token = gen_random_uuid()
  WHERE widget_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_phone_employees_widget_token
  ON phone_employees (widget_token)
  WHERE widget_token IS NOT NULL;
