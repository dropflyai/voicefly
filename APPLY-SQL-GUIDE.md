# How to Apply SQL Schemas to Supabase

## Option 1: Via Supabase Dashboard (Recommended - 5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select project: `irvyhhkoiyzartmmvbxw` (VoiceFly)
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Apply Core Schema (Businesses, Services, Appointments)
1. Open file: `CONSOLIDATED-DATABASE-SCHEMA.sql`
2. Copy entire contents (Cmd+A, Cmd+C)
3. Paste into Supabase SQL Editor (Cmd+V)
4. Click **Run** (or Cmd+Enter)
5. Wait for completion (should see success message)

### Step 3: Apply Leads & Campaigns Schema
1. Create another **New Query**
2. Open file: `migrations/add-research-and-campaigns-tables.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run**
6. Wait for completion

### Step 4: Apply Enterprise Extensions
1. Create another **New Query**
2. Open file: `supabase-complete-schema.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run**

## Option 2: Via Command Line (Alternative)

### Prerequisites:
You need your database password from Supabase:
1. Go to: https://supabase.com/dashboard/project/irvyhhkoiyzartmmvbxw/settings/database
2. Copy your database password
3. Update the connection string below

### Run migrations:
```bash
# Install psql if needed (macOS)
brew install postgresql

# Connect and run SQL files in order
psql "postgresql://postgres.irvyhhkoiyzartmmvbxw:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" \
  -f CONSOLIDATED-DATABASE-SCHEMA.sql

psql "postgresql://postgres.irvyhhkoiyzartmmvbxw:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" \
  -f migrations/add-research-and-campaigns-tables.sql

psql "postgresql://postgres.irvyhhkoiyzartmmvbxw:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" \
  -f supabase-complete-schema.sql
```

## What Gets Created

### 1. CONSOLIDATED-DATABASE-SCHEMA.sql (30+ tables)
Core multi-tenant platform:
- ✅ Businesses (multi-tenant architecture)
- ✅ Customers & business_customers
- ✅ Staff & schedules
- ✅ Services, packages, categories
- ✅ Appointments & payments
- ✅ Voice AI configuration
- ✅ Business hours & phone numbers
- ✅ Analytics & metrics
- ✅ RLS policies & triggers

### 2. add-research-and-campaigns-tables.sql (12+ tables)
Sales & marketing features:
- ✅ Leads & lead_notes
- ✅ Research history & templates
- ✅ Marketing campaigns & recipients
- ✅ Voice campaigns & calls
- ✅ Lead pipeline views
- ✅ Campaign performance analytics

### 3. supabase-complete-schema.sql (20+ tables)
Enterprise extensions:
- ✅ Voice scripts & call recordings
- ✅ Lead enrichment data
- ✅ Email templates & sequences
- ✅ Meetings & calendar integration
- ✅ CRM integrations (Salesforce, HubSpot, etc.)
- ✅ Webhooks & custom fields
- ✅ Team performance analytics
- ✅ A/B testing framework
- ✅ Notification preferences

## Troubleshooting

### Error: "relation already exists"
- **Solution**: Some tables may already exist. This is OK, the schema creation uses `IF NOT EXISTS` checks.

### Error: "type already exists"
- **Solution**: Custom types may exist. Safe to ignore.

### Error: "column does not exist" or "relation does not exist"
- **Solution**: Files must be run in the correct order:
  1. First: `CONSOLIDATED-DATABASE-SCHEMA.sql`
  2. Second: `migrations/add-research-and-campaigns-tables.sql`
  3. Third: `supabase-complete-schema.sql`

## Verification

After running, verify tables exist:

```sql
-- Check all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should see: businesses, customers, appointments, services, staff, etc.
```

## Next Steps

After SQL is applied:
1. ✅ Test dashboard connection
2. ✅ Create test business
3. ✅ Create test appointment
4. ✅ Verify data appears in dashboard
