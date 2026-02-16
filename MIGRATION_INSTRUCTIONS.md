# Running the Phone Employees Migration

## Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/kqsquisdqjedzenwhrkl

2. Click **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy the entire contents of [`database/phone-employees-migration.sql`](database/phone-employees-migration.sql)

5. Paste into the SQL editor

6. Click **Run** (or press Cmd+Enter)

7. Wait ~30 seconds for completion

8. Verify success - you should see:
   ```
   Phone Employees migration completed successfully!
   Tables created: phone_employees, phone_messages, scheduled_tasks, phone_orders, action_requests, employee_calls, employee_metrics, communication_logs
   ```

## Option 2: Command Line (if you have psql)

```bash
# Get your database URL from Supabase dashboard (Settings > Database > Connection String)
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.kqsquisdqjedzenwhrkl.supabase.co:5432/postgres"

# Run migration
psql $DATABASE_URL < database/phone-employees-migration.sql
```

## Verify Migration Worked

After running, verify in Supabase Dashboard:

1. Go to **Table Editor**
2. You should see 8 new tables:
   - ✅ phone_employees
   - ✅ phone_messages
   - ✅ scheduled_tasks
   - ✅ phone_orders
   - ✅ action_requests
   - ✅ employee_calls
   - ✅ employee_metrics
   - ✅ communication_logs

## Next: Set Up API Keys

See [API_SETUP.md](API_SETUP.md) for required services.
