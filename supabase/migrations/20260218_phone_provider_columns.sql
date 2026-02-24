-- Add phone provider tracking columns to phone_employees
-- phone_provider: 'vapi' = VAPI manages the number (calls only)
--                 'twilio-vapi' = Twilio owns the number, VAPI imported (calls + SMS)
-- twilio_phone_sid: Twilio SID for numbers in our Twilio account (twilio-vapi mode)

ALTER TABLE phone_employees
  ADD COLUMN IF NOT EXISTS phone_provider VARCHAR(20) DEFAULT 'vapi',
  ADD COLUMN IF NOT EXISTS twilio_phone_sid VARCHAR(50);
