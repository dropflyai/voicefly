# API Keys Setup for Phone Employees

## 🎯 Quick Summary

| Service | Required For | Status | Priority |
|---------|-------------|--------|----------|
| **VAPI** | Voice calls & AI agents | ✅ **READY** | **CRITICAL** |
| **Supabase** | Database | ✅ **READY** | **CRITICAL** |
| **Twilio** | SMS confirmations | ⚠️ Placeholder | **HIGH** |
| **SendGrid** | Email notifications | ⚠️ Placeholder | **MEDIUM** |

## What Works Right Now (Without New APIs)

✅ **You can test immediately:**
- Create phone employees
- VAPI voice calls work
- Appointment booking (saves to database)
- Message taking (saves to database)
- Order taking (saves to database)

❌ **What won't work without APIs:**
- SMS confirmations (needs Twilio)
- Email notifications (needs SendGrid)
- Outbound callbacks (needs Twilio)

---

## 1️⃣ VAPI (Voice AI) - ✅ READY

**Status:** Already configured and working

**Current Config:**
```bash
VAPI_API_KEY=1d33c846-52ba-46ff-b663-16fb6c67af9e
```

**What it does:**
- Powers the AI voice agents
- Handles all phone calls
- Provides GPT-4o + 11Labs voices

**No action needed** - already working!

---

## 2️⃣ Twilio (SMS) - ⚠️ NEEDS SETUP

**Status:** Has placeholder, needs real credentials

**Priority:** HIGH (needed for SMS confirmations)

**What it does:**
- Sends appointment confirmations via SMS
- Sends order confirmations
- Sends urgent message notifications to staff
- Powers outbound callback calls

**Current Config (Placeholders):**
```bash
TWILIO_ACCOUNT_SID=placeholder_twilio_sid
TWILIO_AUTH_TOKEN=placeholder_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

### How to Set Up Twilio

**Option A: Use Existing Twilio Account** (if you have one)

1. Go to https://console.twilio.com
2. Get your credentials:
   - **Account SID**: Found on dashboard
   - **Auth Token**: Click "Show" on dashboard
   - **Phone Number**: Use your existing Twilio number

3. Update `.env.local`:
```bash
TWILIO_ACCOUNT_SID=AC...your-real-sid...
TWILIO_AUTH_TOKEN=...your-real-token...
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio number
```

**Option B: Create New Twilio Account** (Free trial available)

1. Sign up at https://www.twilio.com/try-twilio
   - Free trial gives you **$15 credit**
   - Enough for ~500 SMS messages

2. Verify your phone number

3. Get a phone number:
   - Go to **Phone Numbers > Manage > Buy a number**
   - Search for a local number
   - Buy it ($1/month)

4. Get credentials from dashboard

5. Update `.env.local` with real values

**Cost:**
- Phone number: $1/month
- SMS: $0.0079/message (outbound)
- Voice: Already using VAPI, don't need Twilio voice

---

## 3️⃣ SendGrid (Email) - ⚠️ NEEDS SETUP

**Status:** Has placeholder, needs real credentials

**Priority:** MEDIUM (nice to have, not critical for beta)

**What it does:**
- Sends email notifications for urgent messages
- Sends detailed message summaries
- Backup for SMS when phone number unavailable

**Current Config (Placeholder):**
```bash
SENDGRID_API_KEY=placeholder_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@voicefly.ai
```

### How to Set Up SendGrid

**Option A: Use Existing SendGrid** (if you have one)

1. Go to https://app.sendgrid.com
2. Get API key:
   - Settings > API Keys > Create API Key
   - Name it "VoiceFly Phone Employees"
   - Give it **Full Access** (or at least "Mail Send")
   - Copy the key (only shown once!)

3. Update `.env.local`:
```bash
SENDGRID_API_KEY=SG....your-real-key...
SENDGRID_FROM_EMAIL=noreply@voicefly.ai
```

4. Verify sender email:
   - Settings > Sender Authentication
   - Verify your from email

**Option B: Create New SendGrid Account** (Free tier available)

1. Sign up at https://signup.sendgrid.com
   - **Free tier**: 100 emails/day forever
   - Enough for testing and small beta

2. Verify your email

3. Create API key (see Option A, step 2)

4. Set up sender verification:
   - Single Sender Verification (easiest for beta)
   - Or use your domain (better for production)

5. Update `.env.local`

**Cost:**
- Free: 100 emails/day
- Essentials: $19.95/month for 50k emails

---

## 4️⃣ Supabase - ✅ READY

**Status:** Already configured and working

**Current Config:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://kqsquisdqjedzenwhrkl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

**No action needed** - database is ready!

---

## 🚀 Recommended Setup Order

### For Immediate Testing (No new APIs needed)

**You can test RIGHT NOW without Twilio or SendGrid:**

1. ✅ Run the database migration
2. ✅ Visit `/dashboard/employees`
3. ✅ Create a receptionist employee
4. ✅ Make test calls
5. ✅ See appointments booked in database
6. ✅ See messages saved in database

**What won't work:**
- ❌ SMS confirmations (will log error but continue)
- ❌ Email notifications (will log error but continue)

### For Full Beta Testing (Setup Twilio)

**Priority order:**

1. **TODAY:** Set up **Twilio** (30 minutes)
   - Most important for user experience
   - Customers expect SMS confirmations
   - Free trial gives you $15 credit

2. **This Week:** Set up **SendGrid** (15 minutes)
   - Nice to have for staff notifications
   - Free tier is fine for beta

---

## 📋 Quick Setup Checklist

```bash
# 1. Check current status
cat .env.local | grep -E "(VAPI|TWILIO|SENDGRID|SUPABASE)"

# 2. Run migration (see MIGRATION_INSTRUCTIONS.md)
# Use Supabase dashboard SQL editor

# 3. Update .env.local with real Twilio credentials
# TWILIO_ACCOUNT_SID=AC...
# TWILIO_AUTH_TOKEN=...
# TWILIO_PHONE_NUMBER=+1...

# 4. Update SendGrid (optional)
# SENDGRID_API_KEY=SG...

# 5. Restart dev server
npm run dev

# 6. Test at http://localhost:3003/dashboard/employees
```

---

## 🧪 Testing Without Full APIs

**You can test core functionality immediately:**

```bash
# 1. Create employee
POST /api/phone-employees
{
  "businessId": "your-id",
  "jobType": "receptionist",
  "name": "Maya"
}

# 2. Make test call via VAPI
# Call your business phone number
# Employee will answer!

# 3. Test appointment booking
# "Hi, I'd like to book an appointment"
# Check appointments table - it's there!

# 4. Test message taking
# "Can you take a message for John?"
# Check phone_messages table - it's there!
```

**Without Twilio:**
- ⚠️ You'll see error logs: `Twilio not configured`
- ✅ But core functionality still works
- ✅ Data is saved to database
- ❌ Just no SMS sent

---

## 🎯 Minimum Viable Beta

**What you MUST have:**
- ✅ VAPI (you have it)
- ✅ Supabase (you have it)

**What you SHOULD have for good UX:**
- ⚠️ Twilio for SMS confirmations

**What's nice to have:**
- 💡 SendGrid for staff notifications

---

## 🔑 Where to Get Your Keys

| Service | Dashboard URL | What to Get |
|---------|--------------|-------------|
| VAPI | https://dashboard.vapi.ai | Already have: `1d33c846-52ba-46ff-b663-16fb6c67af9e` |
| Twilio | https://console.twilio.com | Account SID, Auth Token, Phone Number |
| SendGrid | https://app.sendgrid.com | API Key |
| Supabase | https://supabase.com/dashboard | Already configured ✅ |

---

## ⚡ Quick Start (5 minutes)

**Skip APIs, test now:**

```bash
# 1. Run migration in Supabase SQL editor
# (Copy from database/phone-employees-migration.sql)

# 2. Start server
npm run dev

# 3. Visit dashboard
open http://localhost:3003/dashboard/employees

# 4. Hire first employee
# Click "Hire Employee" → Receptionist → Create

# 5. Make test call
# Call your VAPI business number
# The employee answers!
```

**Result:** Core phone employee system works immediately, just without SMS confirmations.

---

## 🎉 Summary

**You can start testing RIGHT NOW** with what you have (VAPI + Supabase).

**Add Twilio today** for SMS confirmations (recommended for good UX).

**Add SendGrid later** if you want email notifications (optional).

---

Need help with any specific setup? Let me know which service you want to configure first!
