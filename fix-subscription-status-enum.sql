-- Fix subscription_status enum to include 'trialing'
-- This resolves the signup error: invalid input value for enum subscription_status: "trialing"

-- Add 'trialing' to the subscription_status enum
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'trialing';

-- Verify the enum values
DO $$
BEGIN
    RAISE NOTICE 'Current subscription_status enum values:';
    FOR r IN
        SELECT enumlabel
        FROM pg_enum
        WHERE enumtypid = 'subscription_status'::regtype
        ORDER BY enumsortorder
    LOOP
        RAISE NOTICE '  - %', r.enumlabel;
    END LOOP;
END $$;
