# Apply All Missing Table Migrations

## 📋 Overview

Created 5 new migration files to add missing tables and features:

| # | Migration File | Tables | Purpose |
|---|---------------|---------|---------|
| 1 | `20250114_add_call_logs.sql` | call_logs | Track VAPI voice calls |
| 2 | `20250114_add_sms_messages.sql` | sms_messages | Track SMS/text messages |
| 3 | `20250114_add_activity_logs.sql` | activity_logs | User activity tracking |
| 4 | `20250114_add_credits.sql` | credits | Credit balance management |
| 5 | `20250114_add_bookings.sql` | bookings, booking_slots | Web booking system |

---

## 🚀 Quick Apply (Supabase Dashboard)

### Option 1: Apply All At Once

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/kqsquisdqjedzenwhrkl/sql/new

2. **Copy the master migration**
   - Open file: `supabase/migrations/20250114_add_all_missing_tables.sql`
   - Copy all contents (Cmd+A, Cmd+C)

3. **Run the SQL**
   - Paste into SQL Editor
   - Click "Run"
   - Should see success messages

### Option 2: Apply One by One

Run each migration file in order:

```sql
-- 1. Call Logs
-- Copy and run: supabase/migrations/20250114_add_call_logs.sql

-- 2. SMS Messages
-- Copy and run: supabase/migrations/20250114_add_sms_messages.sql

-- 3. Activity Logs
-- Copy and run: supabase/migrations/20250114_add_activity_logs.sql

-- 4. Credits
-- Copy and run: supabase/migrations/20250114_add_credits.sql

-- 5. Bookings
-- Copy and run: supabase/migrations/20250114_add_bookings.sql
```

---

## 📊 What Each Migration Does

### 1. Call Logs (`call_logs`)

**Purpose:** Track all voice AI calls (VAPI integration)

**Features:**
- ✅ Call tracking (inbound/outbound)
- ✅ Call status (initiated, ringing, completed, etc.)
- ✅ Call duration and timestamps
- ✅ Recording URLs and transcripts
- ✅ AI sentiment analysis
- ✅ Intent detection and outcome tracking
- ✅ Cost and credit usage tracking
- ✅ Full-text search on transcripts

**Use Cases:**
- Call history dashboard
- Customer communication history
- Call analytics and reporting
- Quality assurance
- Billing and cost tracking

---

### 2. SMS Messages (`sms_messages`)

**Purpose:** Track all SMS/text communications (Twilio integration)

**Features:**
- ✅ SMS tracking (inbound/outbound)
- ✅ Delivery status tracking
- ✅ MMS support (media URLs)
- ✅ Message type classification (transactional, marketing, etc.)
- ✅ Appointment reminders linking
- ✅ Campaign tracking
- ✅ Cost per message tracking
- ✅ Error handling and retry logic

**Use Cases:**
- SMS conversation history
- Automated appointment reminders
- Marketing campaigns
- Two-way customer communication
- SMS analytics dashboard

---

### 3. Activity Logs (`activity_logs`)

**Purpose:** Track all user actions for audit and analytics

**Features:**
- ✅ Action tracking (create, update, delete, view, etc.)
- ✅ Entity tracking (appointments, customers, etc.)
- ✅ Change history (before/after values)
- ✅ IP address and user agent logging
- ✅ Session tracking
- ✅ Helper function for easy logging
- ✅ Searchable activity timeline

**Use Cases:**
- Audit trail for compliance
- User activity monitoring
- Security incident investigation
- Team productivity tracking
- Data change history

---

### 4. Credits (`credits`)

**Purpose:** Manage credit balances for each business

**Features:**
- ✅ Real-time balance tracking
- ✅ Monthly credit allocation
- ✅ Bonus credits system
- ✅ Credit rollover support
- ✅ Expiration tracking
- ✅ Helper functions (get, deduct, add)
- ✅ Atomic transactions (no race conditions)
- ✅ Automatic transaction logging

**Use Cases:**
- Pay-per-use pricing
- Credit purchase system
- Usage monitoring
- Low credit alerts
- Subscription credit allocation

---

### 5. Bookings (`bookings` + `booking_slots`)

**Purpose:** Web-based booking system (separate from appointments)

**Features:**

#### booking_slots:
- ✅ Available time slot management
- ✅ Multi-booking support (group sessions)
- ✅ Recurring slots (RRULE format)
- ✅ Staff assignment
- ✅ Dynamic pricing

#### bookings:
- ✅ Customer booking capture
- ✅ Auto-generated confirmation codes
- ✅ Payment integration (Stripe)
- ✅ Conversion to appointments
- ✅ Source tracking (UTM parameters)
- ✅ Reminder automation
- ✅ Cancellation handling

**Use Cases:**
- Public booking widget
- Embedded booking forms
- Landing page bookings
- Mobile app bookings
- Appointment conversion pipeline

---

## 🔧 Helper Functions Included

Each migration includes helper functions:

### call_logs:
- (None - managed by VAPI webhook)

### sms_messages:
- (None - managed by Twilio webhook)

### activity_logs:
- `log_activity()` - Easy activity logging

### credits:
- `get_credit_balance()` - Get current balance
- `deduct_credits()` - Deduct credits safely
- `add_credits()` - Add credits

### bookings:
- `generate_confirmation_code()` - Auto-generate codes

---

## ✅ Verification

After applying all migrations, verify:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('call_logs', 'sms_messages', 'activity_logs', 'credits', 'bookings', 'booking_slots')
ORDER BY table_name;

-- Should return 6 rows
```

Or run the check script:

```bash
npx tsx scripts/check-database-tables.ts
```

---

## 🎯 Next Steps After Migration

### 1. Initialize Credits for Existing Businesses

```sql
-- Add credits record for each business
INSERT INTO credits (business_id, balance, monthly_credits)
SELECT id, 50, 50  -- Start with 50 credits (trial tier)
FROM businesses
WHERE NOT EXISTS (
  SELECT 1 FROM credits WHERE credits.business_id = businesses.id
);
```

### 2. Test Each Feature

- ✅ Call Logs: Receive a VAPI call → Check call_logs table
- ✅ SMS: Send test SMS → Check sms_messages table
- ✅ Activity: Perform action → Check activity_logs table
- ✅ Credits: Use `get_credit_balance()` function
- ✅ Bookings: Create test booking → Check bookings table

---

## 📁 Files Created

```
supabase/migrations/
├── 20250114_add_call_logs.sql          (104 lines)
├── 20250114_add_sms_messages.sql       (115 lines)
├── 20250114_add_activity_logs.sql      (97 lines)
├── 20250114_add_credits.sql            (179 lines)
├── 20250114_add_bookings.sql           (236 lines)
└── 20250114_add_all_missing_tables.sql (MASTER - all combined)
```

---

## ⚠️ Important Notes

1. **Run in order** - Credits migration must run before using credit functions
2. **RLS enabled** - All tables have Row Level Security
3. **Indexes added** - Optimized for query performance
4. **Triggers added** - Auto-update timestamps
5. **Functions included** - Helper functions for common operations

---

**Status:** ✅ Ready to apply
**Time to apply:** ~30 seconds
**Breaking changes:** None - all additive

Let me know when you're ready and I'll walk you through applying them!
