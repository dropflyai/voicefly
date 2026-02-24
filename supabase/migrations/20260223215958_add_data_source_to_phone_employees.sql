-- Add data_source column to phone_employees for Live Data Lookup feature
-- data_source stores the configured lookup source for each employee:
-- { type: 'voicefly-contacts' | 'hubspot' | 'custom-webhook', webhookUrl?, webhookSecret?, fields? }

ALTER TABLE phone_employees ADD COLUMN IF NOT EXISTS data_source JSONB;
