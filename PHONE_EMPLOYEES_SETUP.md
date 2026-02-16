# Phone Employees System - Setup & Beta Guide

## 🎯 What We Built

A complete AI phone employee system that lets businesses hire virtual staff that:
- **Answer calls 24/7** as receptionists, personal assistants, or order takers
- **Take actions autonomously** - send SMS, emails, schedule callbacks
- **Handle complex workflows** - book appointments, take orders, manage messages
- **Scale infinitely** - hire as many employees as needed

## 📋 System Architecture

### Core Components

1. **Phone Employee Types** (Simple jobs ready for beta)
   - ✅ **Receptionist**: Answers calls, takes messages, books appointments, transfers calls
   - ✅ **Personal Assistant**: Manages schedules, handles callbacks, priority message routing
   - ✅ **Order Taker**: Takes orders, handles modifications, upsells, processes payments

2. **Action Executor Agent**
   - Sends SMS via Twilio
   - Sends emails via SendGrid
   - Makes outbound calls via VAPI
   - Schedules callbacks
   - Updates CRM records

3. **Task Scheduler**
   - Schedules callbacks ("Call me back at 3pm")
   - Appointment reminders (24h, 1h, 15min)
   - Follow-up messages
   - Recurring tasks

4. **Message System**
   - Takes messages when people unavailable
   - Priority handling (urgent/high/normal/low)
   - Callback tracking
   - VIP contact routing

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```bash
cd /Users/dropfly/Projects/voicefly

# Connect to your Supabase database and run:
psql $DATABASE_URL < database/phone-employees-migration.sql
```

This creates 8 tables:
- `phone_employees` - Employee configurations
- `phone_messages` - Message taking system
- `scheduled_tasks` - Callback scheduler
- `phone_orders` - Order management
- `action_requests` - Action queue
- `employee_calls` - Call logs
- `employee_metrics` - Analytics
- `communication_logs` - SMS/Email logs

### Step 2: Environment Variables

Add to `.env.local`:

```bash
# Already have these for VAPI
VAPI_API_KEY=sk_...
VAPI_WEBHOOK_SECRET=...

# Need for SMS (Action Executor)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Need for Email (Action Executor)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@voicefly.app

# Database (should already have)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Step 3: Start Task Scheduler (Background Process)

Add to your app initialization (e.g., in a `lib/init.ts` or server startup):

```typescript
import { taskScheduler } from '@/lib/phone-employees'

// Start task scheduler on app startup
if (typeof window === 'undefined') {
  // Server-side only
  taskScheduler.start(60000) // Check every 60 seconds
}
```

Or create a separate cron job:

```bash
# Create cron-tasks.ts
import { taskScheduler } from './src/lib/phone-employees'
import { actionExecutor } from './src/lib/phone-employees'

async function processScheduledTasks() {
  console.log('[Cron] Processing scheduled tasks...')

  // Process due tasks
  const result = await taskScheduler.processDueTasks()
  console.log(`[Cron] Processed ${result.processed} tasks: ${result.succeeded} succeeded, ${result.failed} failed`)

  // Process action queue
  const actionResult = await actionExecutor.processQueue()
  console.log(`[Cron] Processed ${actionResult.processed} actions`)
}

// Run every minute
setInterval(processScheduledTasks, 60000)
processScheduledTasks() // Run immediately

console.log('[Cron] Task scheduler started')
```

### Step 4: Test the System

1. **Navigate to Phone Employees Dashboard**
   ```
   http://localhost:3003/dashboard/employees
   ```

2. **Hire Your First Employee**
   - Click "Hire Employee"
   - Choose "Receptionist" role
   - Name: "Maya"
   - Personality: "Professional"
   - Click "Hire Employee"

3. **Wait for Provisioning** (~30 seconds)
   - Creates VAPI assistant with custom prompt
   - Employee appears with "Active" status
   - Note: Phone number provisioning is optional

4. **Test the Employee**
   - Option A: Call your business's main VAPI number
   - Option B: Use test call endpoint:
   ```bash
   curl -X POST http://localhost:3003/api/voice-ai/test-call \
     -H "Content-Type: application/json" \
     -d '{
       "businessId": "your-business-id",
       "phoneNumber": "+1234567890"
     }'
   ```

## 📱 Testing Scenarios

### Receptionist Tests

1. **Book an Appointment**
   - Call in: "Hi, I'd like to book an appointment"
   - Employee asks: service, date, time
   - Confirms and sends SMS confirmation

2. **Take a Message**
   - Call in: "I need to speak with John"
   - Employee: "John is unavailable, can I take a message?"
   - Takes name, phone, message, urgency
   - Sends SMS notification to business

3. **Answer FAQ**
   - Call in: "What are your hours?"
   - Employee provides configured business hours

### Personal Assistant Tests

1. **Schedule Meeting**
   - "I need to schedule a meeting with Jane"
   - Checks calendar availability
   - Books time slot
   - Sends confirmation

2. **Urgent Message**
   - "This is urgent - I need Jane to call me ASAP"
   - Marks as high priority
   - Immediately SMS notifies Jane

### Order Taker Tests

1. **Place Order**
   - "I'd like to order a burger"
   - Asks for customizations
   - Suggests upsells ("Add fries?")
   - Confirms order
   - Sends SMS confirmation

2. **Modify Order**
   - "Actually, can you make that no onions?"
   - Updates order
   - Confirms changes

## 🎯 Beta Testing This Week

### Monday-Tuesday: Internal Testing
- [ ] Run database migration
- [ ] Set up environment variables
- [ ] Start task scheduler
- [ ] Create test receptionist
- [ ] Make 10+ test calls
- [ ] Verify SMS confirmations work
- [ ] Test message taking
- [ ] Test appointment booking

### Wednesday: Invite 3-5 Beta Testers
**Target businesses:**
- Small restaurant (Order Taker)
- Dental office (Receptionist)
- Consultant (Personal Assistant)

**What to give them:**
1. Dashboard access to /dashboard/employees
2. Instructions to hire their first employee
3. Test call number
4. Feedback form

### Thursday-Friday: Iterate
- Fix any bugs from beta feedback
- Adjust prompts if needed
- Improve error handling
- Prepare for wider beta launch

## 📊 What to Monitor

### Key Metrics
- Total employees created
- Calls handled per employee
- Message taken count
- Appointment booking rate
- SMS/Email delivery rate
- Callback completion rate

### Check These Logs
```bash
# Task Scheduler logs
grep "TaskScheduler" logs/app.log

# Action Executor logs
grep "ActionExecutor" logs/app.log

# Employee webhook logs
grep "PhoneEmployeeWebhook" logs/app.log
```

## 🐛 Known Limitations (v1)

1. **No Calendar Integration Yet**
   - Availability checking uses basic database query
   - Not synced with Google/Outlook (coming in Phase 2)

2. **Simple Menu System**
   - Order takers need manual menu configuration
   - No inventory tracking yet

3. **Basic Analytics**
   - Per-employee metrics tracked
   - No dashboard visualization yet (build this week)

4. **Manual Phone Provisioning**
   - Can provision phone numbers but costs money
   - For beta, use shared business number

## 🔥 Quick Wins for Beta Week

1. **Create Pre-configured Templates**
   ```typescript
   // Add to /api/phone-employees/templates endpoint
   - "Restaurant Receptionist" with sample menu
   - "Spa Receptionist" with sample services
   - "Consultant Assistant" with sample calendar
   ```

2. **Add Test Call Button**
   - In employee dashboard
   - One-click to test employee
   - Shows call transcript in real-time

3. **Message Dashboard**
   - Create /dashboard/employees/messages
   - Show all messages taken
   - Mark as read/resolved
   - Quick callback button

4. **Simple Analytics**
   - Calls handled today
   - Messages taken
   - Appointments booked
   - Customer satisfaction (based on sentiment)

## 📞 Support & Troubleshooting

### Issue: Employee not answering
- Check `is_active` is true
- Verify VAPI assistant ID exists
- Check webhook URL is correct

### Issue: SMS not sending
- Verify Twilio credentials
- Check business phone number is valid
- Look in `communication_logs` table

### Issue: Tasks not executing
- Ensure task scheduler is running
- Check `scheduled_tasks` table status
- Look for errors in action_requests

### Get Help
- Check `/dashboard/employees` - employee status indicators
- Review employee call logs in `employee_calls` table
- Check action queue in `action_requests` table

## 🎉 Success Criteria

By end of week:
- ✅ 3+ beta testers actively using system
- ✅ 50+ calls handled by phone employees
- ✅ 10+ appointments booked autonomously
- ✅ 20+ messages taken
- ✅ 5+ SMS confirmations sent
- ✅ Zero critical bugs
- ✅ Positive feedback from testers

## 🚀 Next Week (Phase 2)

If beta successful, build:
1. Calendar sync (Google/Outlook)
2. Outbound sales agent
3. Advanced analytics dashboard
4. Voice customization UI
5. Multi-language support

---

**Built with Claude Sonnet 4.5**
Ready for beta testing! 🎊
