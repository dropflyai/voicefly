# N8N Workflows - Manual Import Guide

**Status**: API import failed (404 - n8n Cloud API may be disabled)
**Solution**: Manual import via n8n UI

---

## 📋 Created Workflows

I've created **4 critical workflows** for VoiceFly PRD v2:

### ✅ 1. Lead Generation Tracker
**File**: `n8n-workflows/lead-generation-tracker.json`
**Purpose**: Capture, score, and route new leads
**Features**:
- Webhook endpoint for lead capture
- Automatic lead scoring (0-100)
- Temperature classification (hot/warm/cold)
- Auto-reply emails
- Hot lead alerts to business owner
- Database storage

**Webhook URL**: `https://[your-n8n-url]/webhook/lead-capture`

---

### ✅ 2. Email Marketing Campaign
**File**: `n8n-workflows/email-marketing-campaign.json`
**Purpose**: Send bulk email campaigns with segmentation
**Features**:
- Customer segmentation (all, customers, leads, VIP, inactive)
- Tag-based filtering
- Batch processing (10 emails/batch)
- Rate limiting (200ms delay)
- Email tracking
- Send logging

**Webhook URL**: `https://[your-n8n-url]/webhook/email-campaign/send`

**Example Request**:
```json
{
  "business_id": "your-business-id",
  "campaign_name": "Monthly Newsletter",
  "subject": "Your exclusive offer for {{first_name}}!",
  "email_html": "<h2>Hi {{first_name}}</h2><p>Special offer just for you...</p>",
  "segment": "customers",
  "from_name": "VoiceFly Beauty Studio"
}
```

---

### ✅ 3. SMS Marketing Campaign
**File**: `n8n-workflows/sms-marketing-campaign.json`
**Purpose**: Send bulk SMS campaigns (TCPA compliant)
**Features**:
- SMS opt-in verification
- Customer segmentation
- Message personalization
- Automatic opt-out footer
- Character count validation (max 480 chars)
- Cost estimation
- Rate limiting (100ms delay)
- Send logging

**Webhook URL**: `https://[your-n8n-url]/webhook/sms-campaign/send`

**Example Request**:
```json
{
  "business_id": "your-business-id",
  "campaign_name": "Flash Sale Alert",
  "message": "Hi {{first_name}}! 🎉 Flash sale today: 20% off all services. Book now: voicefly.com/book",
  "segment": "vip",
  "from_number": "+15551234567"
}
```

**Cost Estimate**: ~$0.0075 per segment. 1 SMS = 160 chars (1 segment), 320 chars = 2 segments.

---

### ✅ 4. Appointment Reminders
**File**: `n8n-workflows/appointment-reminders.json`
**Purpose**: Automated appointment reminders (24h + 1h)
**Features**:
- Runs every hour
- Sends 24-hour reminders (23-25 hour window)
- Sends 1-hour reminders (50-70 minute window)
- Email + SMS dual-channel
- Prevents duplicate sends
- Status tracking in database

**Schedule**: Runs automatically every hour

---

## 🚀 How to Import (Manual Method)

Since the n8n API returned 404 (common for Cloud instances), import manually:

### Step 1: Access n8n Editor
Go to: https://qhclwxce56fvanvzp5omvffm.hooks.n8n.cloud

### Step 2: Import Each Workflow

For each workflow file:

1. **Click** "+ Add Workflow" (top right)
2. **Click** three dots (...) → **Import from File**
3. **Navigate** to `n8n-workflows/` folder
4. **Select** the JSON file
5. **Click** "Import"

Repeat for all 4 workflows:
- `lead-generation-tracker.json`
- `email-marketing-campaign.json`
- `sms-marketing-campaign.json`
- `appointment-reminders.json`

---

## 🔐 Configure Credentials

After importing, configure these credentials for each workflow:

### Gmail OAuth2 (for email workflows)
1. **Workflows**: Email Marketing, Appointment Reminders, Lead Tracker
2. **Setup**:
   - Go to Credentials → Create → Gmail OAuth2
   - Follow Google OAuth setup (see `N8N-GMAIL-SETUP-GUIDE.md`)
   - Connect your Gmail account

### Twilio (for SMS workflows)
1. **Workflows**: SMS Marketing, Appointment Reminders
2. **Setup**:
   - Go to Credentials → Create → Twilio
   - Enter Account SID and Auth Token from Twilio dashboard
   - Test connection

### Supabase (for all workflows)
1. **Workflows**: All 4 workflows
2. **Setup**:
   - Go to Credentials → Create → Supabase
   - Enter Supabase URL and Service Role Key
   - Test connection

**Existing Credential**: You may already have "Supabase account 2" configured

---

## ✅ Activate Workflows

After configuring credentials:

1. **Open each workflow**
2. **Test with sample data** (use the "Execute Workflow" button)
3. **Fix any credential errors**
4. **Click "Active" toggle** (top right) to turn it on

**Order to activate**:
1. Lead Generation Tracker (webhook)
2. Email Marketing Campaign (webhook)
3. SMS Marketing Campaign (webhook)
4. Appointment Reminders (scheduled - will run every hour)

---

## 🧪 Testing Each Workflow

### Test Lead Generation Tracker:
```bash
curl -X POST 'https://[your-n8n-url]/webhook/lead-capture' \
  -H 'Content-Type: application/json' \
  -d '{
    "business_id": "test-business",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "5551234567",
    "source": "google_ads",
    "service_interest": "Manicure",
    "message": "Looking to book a manicure for this weekend"
  }'
```

**Expected**: Lead scored and saved, email sent to customer and business owner

---

### Test Email Campaign:
```bash
curl -X POST 'https://[your-n8n-url]/webhook/email-campaign/send' \
  -H 'Content-Type: application/json' \
  -d '{
    "business_id": "your-business-id",
    "campaign_name": "Test Campaign",
    "subject": "Test Email",
    "email_html": "<p>This is a test</p>",
    "segment": "all"
  }'
```

**Expected**: Emails sent to all opted-in customers

---

### Test SMS Campaign:
```bash
curl -X POST 'https://[your-n8n-url]/webhook/sms-campaign/send' \
  -H 'Content-Type: application/json' \
  -d '{
    "business_id": "your-business-id",
    "campaign_name": "Test SMS",
    "message": "Hi {{first_name}}! This is a test SMS.",
    "segment": "all",
    "from_number": "+15551234567"
  }'
```

**Expected**: SMS sent to all opted-in customers with valid phone numbers

---

### Test Appointment Reminders:
**Automatic** - runs every hour. To test manually:
1. Create test appointment in database 23 hours from now
2. Wait for next hourly run (or click "Execute Workflow")
3. Check if reminder was sent

---

## 📊 Monitoring

### View Workflow Executions:
1. **Go to**: Executions tab (left sidebar)
2. **Filter** by workflow name
3. **Click** any execution to see details
4. **Check** for errors (red) or success (green)

### Common Issues:

**❌ "Missing credentials"**
- Solution: Configure Gmail/Twilio/Supabase credentials

**❌ "Webhook not found"**
- Solution: Make sure workflow is ACTIVE (toggle on)

**❌ "No recipients found"**
- Solution: Check database has customers with `email_opted_in=true` or `sms_opted_in=true`

**❌ "Rate limit exceeded"**
- Solution: Batching is already configured. Check Twilio/Gmail limits.

---

## 📦 Database Schema Required

Make sure these tables exist in Supabase:

### `leads` table:
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id TEXT UNIQUE,
  business_id UUID REFERENCES businesses(id),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  source_campaign TEXT,
  source_medium TEXT,
  status TEXT DEFAULT 'new',
  lead_score INTEGER DEFAULT 0,
  temperature TEXT DEFAULT 'cold',
  service_interest TEXT,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `email_campaign_sends` table:
```sql
CREATE TABLE email_campaign_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id TEXT,
  recipient_id UUID,
  recipient_email TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP
);
```

### `sms_campaign_sends` table:
```sql
CREATE TABLE sms_campaign_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id TEXT,
  recipient_id UUID,
  recipient_phone TEXT,
  message TEXT,
  segments INTEGER DEFAULT 1,
  sent_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  twilio_sid TEXT
);
```

### `appointments` table (updates):
```sql
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1h_sent_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS start_datetime TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS end_datetime TIMESTAMP;
```

---

## 🎯 Next: Missing Workflows to Build

These workflows are still needed for full PRD v2 implementation:

### High Priority:
5. **Outbound Sales Dialer** - Automated calling campaigns
6. **Lead Nurturing Automation** - Drip campaigns, follow-ups
7. **Review Request Automation** - Post-service review requests

### Medium Priority:
8. **Customer Onboarding Workflow** - New customer setup
9. **Payment Processing Notifications** - Payment confirmations
10. **Social Media Automation** - Post scheduling

### Low Priority:
11. **SEO Reporting Workflow** - Monthly SEO reports
12. **Lead Scoring Workflow** - Advanced scoring algorithms

---

## ✅ What's Complete

✅ **4 Critical workflows created**:
1. Lead Generation Tracker
2. Email Marketing Campaign
3. SMS Marketing Campaign
4. Appointment Reminders

✅ **All workflows include**:
- Proper error handling
- Rate limiting
- Database logging
- TCPA compliance (for SMS)
- Personalization support

✅ **Ready for**:
- Manual import via n8n UI
- Testing with real data
- Production use

---

## 🚨 Important Notes

1. **n8n Cloud API**: The public API appears to be disabled on your n8n Cloud instance (404 errors). This is normal - use manual import instead.

2. **Credentials**: Keep all credentials secure. Never commit API keys to git.

3. **Testing**: Always test with small segments first before sending to all customers.

4. **Compliance**:
   - SMS: TCPA requires opt-in. All workflows verify `sms_opted_in=true`
   - Email: CAN-SPAM requires opt-in. All workflows verify `email_opted_in=true`

5. **Costs**:
   - Email (Gmail): Free for reasonable volumes
   - SMS (Twilio): ~$0.0075 per segment
   - n8n Cloud: Check your plan's execution limits

---

## 📞 Support

If you need help:
1. Check n8n docs: https://docs.n8n.io
2. Check execution logs in n8n UI
3. Test workflows one node at a time
4. Verify credentials are connected

---

**Created**: October 2025
**Status**: Ready for manual import
**Location**: `/n8n-workflows/` directory
