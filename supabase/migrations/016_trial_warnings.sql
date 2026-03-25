-- Trial warning system columns
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_warning_50_sent boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_warning_80_sent boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_exhausted_sent boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_paused boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_email text;

-- Trial nurture email tracking
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS nurture_emails_sent jsonb DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_start_date timestamptz;

-- Backfill trial_start_date from created_at for existing businesses
UPDATE businesses SET trial_start_date = created_at WHERE trial_start_date IS NULL;
