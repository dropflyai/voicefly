# Twilio SMS Setup Guide - VoiceFly

## 🎯 Overview
Twilio enables VoiceFly to send SMS notifications for:
- Appointment confirmations
- Appointment reminders (24 hours before)
- Cancellation notifications
- No-show alerts
- Booking confirmations

**Cost**: ~$0.0075 per SMS (less than 1 cent per message)

---

## 🚀 Quick Setup (15 minutes)

### Step 1: Create Twilio Account
1. Go to: https://www.twilio.com/try-twilio
2. Sign up for a free trial account
3. Verify your phone number
4. Complete account setup

**Trial Credits**: $15.50 (enough for ~2,000 SMS messages)

### Step 2: Get a Phone Number
1. In Twilio Console, go to: **Phone Numbers** → **Buy a number**
2. Select country: **United States**
3. Check capabilities: **SMS** (Voice optional)
4. Search for a number in your area code
5. Click "Buy" (costs $1.15/month)

**Pro Tip**: Choose a number with the same area code as your business for better trust.

### Step 3: Get Your Credentials
1. Go to Twilio Console: https://console.twilio.com/
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Click the "eye" icon to reveal the Auth Token

You'll see something like:
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: your_auth_token_here
Phone Number: +1 (XXX) XXX-XXXX
```

### Step 4: Update Environment Variables
1. Open `.env.local` in your VoiceFly project
2. Replace the placeholders:

```bash
# TWILIO CONFIGURATION (For SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

**Important**:
- Remove spaces and dashes from phone number
- Keep the + prefix
- Format: +14243519304 (not +1 (424) 351-9304)

### Step 5: Restart Your Dev Server
```bash
cd /Users/rioallen/Documents/DropFly-OS-App-Builder/DropFly-PROJECTS/voicefly-app
# Kill existing servers first
PORT=3021 npm run dev
```

### Step 6: Test SMS Sending
1. Visit: http://localhost:3021/dashboard/appointments
2. Create a test appointment with your phone number
3. Check if you receive an SMS confirmation

---

## 💡 Trial Account Limitations

### Free Trial Restrictions:
- ✅ Can send SMS to verified numbers only
- ❌ Cannot send to unverified numbers
- ✅ $15.50 in free credits
- ✅ Enough for testing and validation

### To Verify Additional Numbers (During Trial):
1. Go to: **Phone Numbers** → **Verified Caller IDs**
2. Click "Add a new Caller ID"
3. Enter the phone number
4. Twilio will call/SMS with a verification code
5. Enter the code to verify

**Tip**: Verify your phone, your co-founder's phone, and 2-3 test customer numbers.

### Upgrade to Full Account:
When you're ready for production:
1. Go to **Account** → **Upgrade**
2. Add billing information
3. Upgrade removes all restrictions
4. Costs: $1.15/month per number + $0.0075 per SMS

---

## 📱 SMS Message Templates

### Appointment Confirmation
```
Hi {firstName}! Your appointment at {businessName} is confirmed for {date} at {time}. Reply CANCEL to cancel. See you soon!
```

### 24-Hour Reminder
```
Reminder: You have an appointment tomorrow at {time} with {staffName} at {businessName}. Reply CANCEL to cancel. {businessPhone}
```

### Cancellation Notice
```
Your appointment on {date} at {time} has been cancelled. Call us at {businessPhone} to reschedule. - {businessName}
```

### No-Show Alert (to business)
```
No-show alert: {customerName} missed their {time} appointment. Appointment ID: {shortId}
```

---

## 🔧 Technical Integration

### Where Twilio is Used in VoiceFly:

**1. Appointment Confirmations** (`/src/lib/notifications.ts`):
```typescript
await sendSMS({
  to: customer.phone,
  message: `Hi ${customer.firstName}! Your appointment at ${business.name}...`
})
```

**2. Reminder Scheduling** (`/webhook-server.js`):
- Sends 24 hours before appointment
- Sends 1 hour before appointment (optional)

**3. Cancellation Notifications** (`/src/app/dashboard/appointments/page.tsx`):
- Triggered when appointment status changes to "cancelled"

### SMS Utility Functions:
- `sendSMS()` - Core SMS sending function
- `scheduleReminder()` - Schedule future SMS
- `formatPhoneNumber()` - Ensure E.164 format
- `validatePhone()` - Check if number is valid

---

## 💰 Cost Estimation

### Per Customer Per Month:
- Confirmation SMS: 1 × $0.0075 = $0.0075
- Reminder SMS: 1 × $0.0075 = $0.0075
- **Total per appointment**: ~$0.015 (1.5 cents)

### Projected Costs by Volume:

| Monthly Appointments | SMS Cost | Cost per Customer |
|---------------------|----------|-------------------|
| 100 | $1.50 | $0.015 |
| 500 | $7.50 | $0.015 |
| 1,000 | $15.00 | $0.015 |
| 5,000 | $75.00 | $0.015 |

**Margin**: You charge $297/month, SMS costs ~$7.50-$15/month = **97% margin on SMS**

---

## 🆘 Troubleshooting

### "Authentication Failed"
**Problem**: Wrong Account SID or Auth Token
**Solution**:
1. Go to Twilio Console
2. Copy credentials exactly
3. Make sure no spaces or extra characters
4. Restart dev server

### "Unable to send to unverified number"
**Problem**: Trial account, number not verified
**Solution**:
1. Go to **Verified Caller IDs**
2. Add and verify the customer's number
3. Or upgrade to paid account

### "Invalid phone number format"
**Problem**: Phone number not in E.164 format
**Solution**:
- Use format: +14243519304
- Remove: spaces, dashes, parentheses
- Include: country code (+1)

### SMS not received
**Problem**: Multiple possible causes
**Check**:
1. Verify number is correct in Twilio console
2. Check Twilio logs: **Monitor** → **Logs** → **Messaging**
3. Look for "delivered" status
4. Check phone's SMS app (may be in spam)

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep Auth Token secret (never commit to git)
- Use environment variables (.env.local)
- Add .env.local to .gitignore
- Rotate Auth Token every 90 days

### ❌ DON'T:
- Hardcode credentials in source code
- Share Auth Token in Slack/Email
- Commit .env.local to git
- Use same credentials for dev and production

---

## 📊 Monitoring SMS Usage

### View Message Logs:
1. Go to: **Monitor** → **Logs** → **Messaging**
2. Filter by date range
3. Check delivery status
4. View error messages

### Track Costs:
1. Go to: **Monitor** → **Usage**
2. Select "SMS"
3. View daily/monthly usage
4. Set up usage alerts

### Set Budget Alerts:
1. Go to: **Account** → **Notifications**
2. Set "Usage Triggers"
3. Get notified at $10, $25, $50 thresholds

---

## 🚀 Production Deployment

### Before Going Live:

1. **Upgrade Twilio Account**:
   - Remove trial restrictions
   - Add payment method
   - Enable sending to any number

2. **Update Vercel Environment Variables**:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxx...
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
   ```

3. **Test in Production**:
   - Create test appointment
   - Verify SMS received
   - Check Twilio logs

4. **Monitor for 48 Hours**:
   - Watch for delivery failures
   - Check customer feedback
   - Monitor costs

---

## 📞 Twilio Support

### Free Trial Support:
- Documentation: https://www.twilio.com/docs/sms
- Community: https://www.twilio.com/community
- Email: help@twilio.com

### Paid Account Support:
- Chat support in console
- Phone: 1-888-TWILIO-1
- Priority email support

---

## 🎓 Next Steps

After Twilio is configured:

1. ✅ Test SMS notifications locally
2. ✅ Verify delivery in Twilio logs
3. ✅ Update Vercel with production credentials
4. ✅ Deploy to production
5. ✅ Test with real customer appointment

**Estimated setup time**: 15 minutes
**Trial credits**: Enough for validation
**Monthly cost (production)**: ~$7.50-$15 for 500-1000 appointments

---

**Ready to send SMS!** 📱
