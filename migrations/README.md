# Database Migrations

## Running Migrations

### Method 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
2. Copy the contents of the migration file
3. Paste and click "Run"

### Method 2: Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase db push
```

### Method 3: psql (Direct Connection)
```bash
# Get connection string from Supabase dashboard
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f migrations/add-research-and-campaigns-tables.sql
```

## Migration Files

### `add-research-and-campaigns-tables.sql`
**Purpose:** Adds complete schema for AI research and marketing campaigns

**Tables Added:**
- `leads` - Sales prospects with qualification tracking
- `lead_notes` - Research results and interaction history
- `research_history` - Complete AI research query log
- `research_templates` - Saved research query templates
- `marketing_campaigns` - Email campaign management
- `campaign_recipients` - Campaign delivery tracking
- `voice_campaigns` - VAPI voice campaign configuration
- `voice_campaign_calls` - Individual call tracking

**Features:**
- ✅ Row Level Security (RLS) enabled
- ✅ Multi-tenant isolation (business_id)
- ✅ Updated_at triggers
- ✅ Performance indexes
- ✅ Helpful views for analytics

**Dependencies:**
- Requires existing `businesses` table
- Requires existing `staff` table
- Requires existing `customers` table
- Requires existing `phone_numbers` table

## Verifying Migration

After running the migration, verify it worked:

```sql
-- Check that all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'leads',
    'lead_notes',
    'research_history',
    'research_templates',
    'marketing_campaigns',
    'campaign_recipients',
    'voice_campaigns',
    'voice_campaign_calls'
  );

-- Should return 8 rows

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%campaign%'
  OR tablename LIKE '%lead%'
  OR tablename LIKE '%research%';

-- All should show rowsecurity = true
```

## Rollback (if needed)

To rollback this migration:

```sql
-- Drop tables in reverse order (respecting foreign keys)
DROP TABLE IF EXISTS voice_campaign_calls CASCADE;
DROP TABLE IF EXISTS voice_campaigns CASCADE;
DROP TABLE IF EXISTS campaign_recipients CASCADE;
DROP TABLE IF EXISTS marketing_campaigns CASCADE;
DROP TABLE IF EXISTS research_templates CASCADE;
DROP TABLE IF EXISTS research_history CASCADE;
DROP TABLE IF EXISTS lead_notes CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- Drop views
DROP VIEW IF EXISTS lead_pipeline_summary CASCADE;
DROP VIEW IF EXISTS campaign_performance CASCADE;
DROP VIEW IF EXISTS research_usage_stats CASCADE;
```

## Testing Migration

Run these queries to test the schema:

```sql
-- Insert test lead
INSERT INTO leads (business_id, first_name, last_name, email, company_name, lead_status)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual business_id
  'John',
  'Doe',
  'john@example.com',
  'Test Company',
  'new'
)
RETURNING id;

-- Insert test research
INSERT INTO research_history (business_id, query, mode, result_content)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual business_id
  'Test query',
  'quick',
  'Test result'
)
RETURNING id;

-- Check views work
SELECT * FROM lead_pipeline_summary LIMIT 5;
SELECT * FROM campaign_performance LIMIT 5;
SELECT * FROM research_usage_stats LIMIT 5;
```

## Next Steps

After running this migration:

1. ✅ Update `.env.local` with Supabase credentials
2. ✅ Test Smart Actions in the dashboard
3. ✅ Verify research saves to database
4. ✅ Test campaign creation
5. ✅ Check RLS policies work correctly
