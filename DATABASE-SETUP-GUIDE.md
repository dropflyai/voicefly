# VoiceFly Database Setup Guide

## Overview
This guide will help you set up the complete VoiceFly database schema in Supabase with multi-tenant support and Row Level Security (RLS).

## Prerequisites
- Supabase project created (https://irvyhhkoiyzartmmvbxw.supabase.co)
- Admin access to Supabase SQL Editor
- `.env.local` configured with Supabase credentials

## Database Setup Steps

### Step 1: Access Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/irvyhhkoiyzartmmvbxw/sql/new
2. Open the SQL Editor

### Step 2: Run the Main Schema
**File**: `CONSOLIDATED-DATABASE-SCHEMA.sql` (created below)

This single file contains:
- ✅ All required extensions
- ✅ All tables in correct dependency order
- ✅ All indexes for performance
- ✅ All triggers for updated_at columns
- ✅ Row Level Security (RLS) policies
- ✅ Helper functions
- ✅ Multi-tenant support

**Instructions**:
1. Copy the entire contents of `CONSOLIDATED-DATABASE-SCHEMA.sql`
2. Paste into Supabase SQL Editor
3. Click "Run" (or press Cmd/Ctrl + Enter)
4. Verify no errors appear

**Expected Result**:
```
Success. No rows returned
```

### Step 3: Run Additional Migrations (Optional)
After the main schema is set up, you can run these optional migrations for additional features:

1. **Multi-location support** (for Business tier):
   - File: `migrations/add_multi_location_support.sql`

2. **White label support** (for Enterprise tier):
   - File: `migrations/add_white_label_support.sql`

3. **Specialized business types** (Medical, Dental, etc.):
   - File: `migrations/add-specialized-business-types.sql`

### Step 4: Seed Demo Data (Optional)
Run the seed file to create sample data for testing:
- File: `supabase/seed.sql`

### Step 5: Verify Setup
Run this verification query in SQL Editor:

```sql
-- Check that all main tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected tables**:
- appointments
- business_customers
- business_hours
- business_users
- businesses
- customers
- daily_metrics
- loyalty_tiers
- payments
- phone_numbers
- service_categories
- service_packages
- services
- staff
- staff_schedules
- voice_ai_calls
- voice_ai_config

### Step 6: Test Database Connection
1. Start your dev server:
```bash
cd /Users/rioallen/Documents/DropFly-OS-App-Builder/DropFly-PROJECTS/voicefly-app
PORT=3021 npm run dev
```

2. Visit: http://localhost:3021/dashboard

3. Verify the dashboard loads and can fetch data

## Troubleshooting

### Error: "relation already exists"
**Solution**: This means the table was already created. You can either:
1. Drop the existing schema and start fresh (⚠️ destroys data)
2. Skip to Step 3 and run only the migrations

To drop and recreate:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### Error: "column already exists"
**Solution**: The migration was already partially run. Check which columns exist and modify the migration to skip those.

### Error: "permission denied"
**Solution**: Make sure you're using the service role key in your environment variables, not the anon key.

## Database Architecture

### Multi-Tenant Design
- **Isolation**: Every table has a `business_id` column
- **Security**: Row Level Security (RLS) policies enforce data isolation
- **Routing**: Phone numbers route to correct business via `phone_numbers` table

### Key Tables
1. **businesses**: Main tenant table, stores business info and subscription
2. **customers**: Customer profiles with loyalty tracking
3. **appointments**: Booking records with staff and service assignments
4. **services**: Service catalog with pricing and durations
5. **staff**: Staff profiles with schedules and specialties
6. **payments**: Payment tracking with Stripe integration
7. **voice_ai_calls**: VAPI call logs and transcripts

### Security Features
- ✅ Row Level Security (RLS) on all tables
- ✅ JWT-based authentication
- ✅ Business isolation enforced at database level
- ✅ Service role bypass for server-side operations
- ✅ Audit trail with created_at/updated_at timestamps

## Next Steps After Setup

1. **Test appointment booking**:
   - Create a test customer
   - Create a test service
   - Book an appointment
   - Verify data appears in dashboard

2. **Test VAPI integration**:
   - Make a call to your VAPI phone number
   - Verify call log appears in `voice_ai_calls` table
   - Check appointment was created

3. **Test payment processing**:
   - Use Stripe test card: 4242 4242 4242 4242
   - Verify payment record created
   - Check payment status updates

## Support

If you encounter issues:
1. Check Supabase logs: Project → Logs → SQL
2. Verify environment variables are correct
3. Check RLS policies are enabled
4. Ensure service role key has proper permissions

---

**Last Updated**: October 1, 2025
**Schema Version**: 2.0 (Multi-tenant with RLS)
**Status**: Ready for production use
