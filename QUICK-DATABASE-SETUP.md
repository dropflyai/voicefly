# Quick Database Setup - VoiceFly

## 🚀 5-Minute Database Setup

### Step 1: Open Supabase SQL Editor
Click this link: https://supabase.com/dashboard/project/irvyhhkoiyzartmmvbxw/sql/new

### Step 2: Run the Schema
1. Open the file: `CONSOLIDATED-DATABASE-SCHEMA.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" (or Cmd+Enter)

### Step 3: Verify Success
You should see:
```
Success. No rows returned
```

And a notice message showing:
```
VoiceFly Database Schema Setup Complete!
Tables created: 30+
Indexes created: 25+
RLS policies: Enabled
Triggers: Active
```

### Step 4: Test Connection
```bash
cd /Users/rioallen/Documents/DropFly-OS-App-Builder/DropFly-PROJECTS/voicefly-app
PORT=3021 npm run dev
```

Visit: http://localhost:3021/dashboard

---

## ✅ What Gets Created

### Core Tables (30+)
- businesses (tenants)
- customers (platform-wide)
- business_customers (tenant-specific)
- appointments
- services
- staff
- payments
- voice_ai_calls
- daily_metrics
- ...and 20+ more

### Security Features
- ✅ Row Level Security (RLS) enabled
- ✅ Service role bypass for server operations
- ✅ Business data isolation
- ✅ JWT authentication ready

### Performance
- ✅ 25+ indexes for fast queries
- ✅ Automatic updated_at triggers
- ✅ Daily metrics auto-calculation
- ✅ Optimized for multi-tenant queries

---

## 🔍 Verify Tables Exist

Run this query in Supabase SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected: 30+ tables including:
- appointments
- businesses
- customers
- payments
- services
- staff
- voice_ai_calls

---

## 🆘 Troubleshooting

### "relation already exists"
The schema is already set up! Skip to Step 4 to test.

### "permission denied"
Make sure you're logged into Supabase and have admin access to the project.

### "column already exists"
Some tables were partially created. Either:
1. Continue anyway (it will skip duplicates)
2. Or drop and recreate:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

---

## 📝 What's Next?

After database is set up:
1. ✅ Test dashboard loads
2. ✅ Create test appointment
3. ✅ Test VAPI call logging
4. ✅ Deploy to Vercel
5. ✅ Start customer acquisition

---

**Ready to launch!** 🚀
