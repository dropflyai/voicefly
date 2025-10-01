-- Add reminder_sent column to appointments table
-- This is needed for the 24-hour reminder cron job system
-- Run this SQL in Supabase SQL Editor

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Update existing appointments to not send reminders for past appointments
UPDATE appointments 
SET reminder_sent = TRUE 
WHERE appointment_date < CURRENT_DATE 
AND reminder_sent IS NULL;

-- Add index for performance on reminder queries
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_check 
ON appointments (appointment_date, reminder_sent, status);