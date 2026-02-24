-- Twilio subaccount tracking on businesses
-- One subaccount per business that uses twilio-vapi phone mode.
-- Keeps customer numbers isolated, enables per-business monitoring in Twilio console,
-- and avoids sending the master auth token to VAPI (we send the subaccount token instead).

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS twilio_subaccount_sid   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS twilio_subaccount_token VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_businesses_twilio_subaccount ON businesses (twilio_subaccount_sid)
  WHERE twilio_subaccount_sid IS NOT NULL;
