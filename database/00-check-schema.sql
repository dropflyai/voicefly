-- Step 0: Check Current Database Schema
-- Run this first to see what columns actually exist

-- Check services table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

-- Check businesses table structure  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'businesses'
ORDER BY ordinal_position;

-- Check if service_categories table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'service_categories';

-- Check current subscription_tier enum values
SELECT enumlabel as tier_name
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'subscription_tier'
ORDER BY e.enumsortorder;