# 📧 Gmail OAuth Setup for N8N - Complete Guide

## **🎯 Quick Answer: Where Gmail Credentials Go**

Your Gmail OAuth credentials are stored **inside N8N**, not in environment files. Here's how to set them up:

### **Access Your N8N Editor**
**URL**: https://qhclwxce56fvanvzp5omvffm.hooks.n8n.cloud

---

## **📋 Step-by-Step Gmail OAuth Setup**

### **Step 1: Check Existing Credentials (2 minutes)**

1. **Open N8N Editor**: https://qhclwxce56fvanvzp5omvffm.hooks.n8n.cloud
2. **Go to Credentials**: Click "Credentials" in the left sidebar
3. **Look for existing Gmail credentials**:
   - Search for "Gmail OAuth2"
   - Search for "Google"
   - You might already have Gmail credentials from previous projects!

### **Step 2: Create Gmail OAuth2 Credentials (5 minutes)**

If you don't have Gmail credentials, create them:

1. **In N8N**: Click "Create New Credential"
2. **Select**: "Gmail OAuth2 API"
3. **You'll need these from Google Console**:
   ```
   Client ID: your-gmail-client-id
   Client Secret: your-gmail-client-secret
   ```

### **Step 3: Get Google Console Credentials (10 minutes)**

#### **3a. Google Cloud Console Setup**
1. Go to: https://console.cloud.google.com/
2. **Create/Select Project**: "VoiceFly-Gmail"
3. **Enable APIs**:
   - Gmail API
   - Google Calendar API (for calendar integration)

#### **3b. Create OAuth2 Credentials**
1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth 2.0 Client IDs**
3. **Application type**: Web application
4. **Authorized redirect URIs**:
   ```
   https://qhclwxce56fvanvzp5omvffm.hooks.n8n.cloud/rest/oauth2-credential/callback
   ```
5. **Copy**: Client ID and Client Secret

### **Step 4: Configure in N8N (3 minutes)**

1. **Back in N8N** → **Credentials** → **Gmail OAuth2**
2. **Enter**:
   ```
   Client ID: [from Google Console]
   Client Secret: [from Google Console]
   ```
3. **Click "Connect my account"**
4. **Authorize**: Allow Gmail access
5. **Test**: Should show "Connected successfully"

---

## **🔧 Alternative: Use Existing Gmail Integration**

### **Check if Gmail is Already Working**

You might already have Gmail working! Check your existing workflows:

1. **In N8N**: Look at "LeadFly - Email Engagement Processor"
2. **Check nodes**: Look for Gmail or Email nodes
3. **Check credentials**: See what credentials they're using

### **Common Gmail Credential Names in N8N**
- "Gmail OAuth2"
- "Google OAuth2"
- "Gmail Account"
- "Email Service"

---

## **📧 VoiceFly Email Automation Setup**

### **What Emails VoiceFly Sends**
1. **Appointment Confirmations**: "Your appointment is confirmed for..."
2. **Appointment Reminders**: "Your appointment is tomorrow at..."
3. **Cancellation Notifications**: "Your appointment has been cancelled..."
4. **Rescheduling Confirmations**: "Your appointment has been moved to..."

### **Email Templates (Ready to Use)**

#### **Appointment Confirmation Email**
```html
Subject: ✅ Appointment Confirmed - {{appointment.date}} at {{appointment.time}}

Hello {{customer.firstName}},

Your appointment is confirmed!

📅 **Date**: {{appointment.date}}
⏰ **Time**: {{appointment.time}}
💅 **Service**: {{service.name}}
🏢 **Location**: {{business.name}}

📍 **Address**:
{{business.address}}
{{business.city}}, {{business.state}} {{business.zip}}

**Need to make changes?**
- Call us: {{business.phone}}
- Email us: {{business.email}}

We can't wait to see you!

Best regards,
{{business.name}} Team
```

### **N8N Email Workflow Structure**
```
Webhook Trigger (appointment_booked)
    ↓
Get Customer & Appointment Details (Supabase)
    ↓
Format Email Template (Code Node)
    ↓
Send Email (Gmail Node)
    ↓
Log Email Sent (Supabase)
```

---

## **🚀 Quick Launch Without Gmail (Alternative)**

If Gmail OAuth is taking too long, you can launch **immediately** using:

### **Option 1: Supabase Edge Functions**
```javascript
// Use Supabase built-in email
await supabase.auth.api.sendEmail({
  to: customer.email,
  subject: 'Appointment Confirmed',
  html: emailTemplate
})
```

### **Option 2: Resend API (Fastest)**
```bash
# Add to your .env
RESEND_API_KEY=your_resend_api_key

# In your webhook server
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'appointments@yourdomain.com',
    to: customer.email,
    subject: 'Appointment Confirmed',
    html: emailTemplate
  })
})
```

### **Option 3: Manual Email (Launch Today)**
For your first customers:
1. **Take booking** via Maya AI
2. **Send manual email** confirmation
3. **Add automation** later this week

---

## **🎯 Priority Recommendation**

### **For Immediate Launch (Today)**
1. **Skip Gmail OAuth** for now
2. **Use manual email confirmations** for first 10 customers
3. **Focus on customer acquisition** (LinkedIn outreach)
4. **Add Gmail automation** once you have paying customers

### **For This Week (After Revenue)**
1. **Set up Gmail OAuth** properly
2. **Import email workflow** to N8N
3. **Test complete automation**
4. **Scale customer onboarding**

---

## **🔍 How to Check What You Already Have**

### **Existing Credentials Check**
1. **Open**: https://qhclwxce56fvanvzp5omvffm.hooks.n8n.cloud
2. **Go to**: Credentials (left sidebar)
3. **Look for**:
   - Any Google/Gmail credentials
   - OpenAI credentials (you have these working)
   - Twilio credentials
   - Supabase credentials

### **Existing Workflows Check**
1. **Go to**: Workflows (left sidebar)
2. **Check**: LeadFly workflows for email nodes
3. **Look for**: Gmail, Email, or SMTP nodes

---

## **💡 The Reality**

**You probably already have Gmail working** in your LeadFly workflows. Check your N8N credentials first before creating new ones.

**If not, you can launch without email automation** and add it later this week.

**Priority**: Get customers first, perfect automation second.

---

## **🚨 Action Items RIGHT NOW**

1. **Check N8N credentials**: https://qhclwxce56fvanvzp5omvffm.hooks.n8n.cloud/credentials
2. **If Gmail exists**: Test it with a simple email workflow
3. **If Gmail doesn't exist**: Launch without email, add manual confirmations
4. **Focus on revenue**: Send LinkedIn messages to prospects
5. **Perfect automation**: After you have paying customers

**Don't let email automation delay your launch. Manual emails work fine for the first 50 customers.**