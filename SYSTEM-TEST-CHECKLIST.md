# VoiceFly System Test Checklist

**URL**: http://localhost:3000
**Date**: October 9, 2025
**Testing**: Full system integration test

---

## ✅ Test Sequence

### 1. Homepage Test (/)

**What to check**:
- [ ] Page loads without errors
- [ ] Hero section displays: "Maya: Your AI Employee Who Runs Your Entire Business"
- [ ] Product showcase visible (Maya™, LeadFly™, SalesFly™, etc.)
- [ ] "Get Early Access" button works
- [ ] Navigation menu functional
- [ ] Footer displays correctly
- [ ] Mobile responsive (resize window)

**Expected**: Clean homepage with all VoiceFly branding, products, and CTAs

---

### 2. Pricing Page (/pricing)

**What to check**:
- [ ] Page loads without errors
- [ ] 3 pricing tiers display:
  - Starter: $147/mo
  - Professional: $397/mo
  - Enterprise: $997/mo
- [ ] Feature comparison table works
- [ ] Monthly/Yearly toggle works
- [ ] "Start Free Trial" buttons work
- [ ] FAQ section displays
- [ ] Overage pricing shown

**Known Issue**: ⚠️ **Pricing is OLD model** - doesn't show PRD v2 modular pricing yet

**Expected**: Current SaaS pricing model (not yet updated to modular)

---

### 3. Signup Flow (/signup)

**What to check**:
- [ ] Signup form displays
- [ ] Email field validation works
- [ ] Password field validation works
- [ ] Password strength indicator works
- [ ] "Sign Up" button functional
- [ ] Redirects to dashboard after signup
- [ ] Error messages for invalid inputs

**Test Data**:
```
Email: test@voicefly.com
Password: TestPassword123!
```

**Expected**: New account created, redirected to dashboard or onboarding

---

### 4. Login Flow (/login)

**What to check**:
- [ ] Login form displays
- [ ] Email/password fields work
- [ ] "Sign In" button functional
- [ ] "Forgot password?" link works
- [ ] Error handling for wrong credentials
- [ ] Redirects to dashboard on success

**Test Data**:
```
Email: test@voicefly.com
Password: TestPassword123!
```

**Expected**: Successful login, redirect to dashboard

---

### 5. Dashboard (/dashboard)

**What to check**:
- [ ] Dashboard loads after login
- [ ] User info displays (top right)
- [ ] Navigation sidebar visible
- [ ] Key metrics displayed:
  - Total calls
  - Appointments booked
  - Revenue
  - Conversion rate
- [ ] Recent activity feed
- [ ] Quick action buttons work
- [ ] Charts/graphs render

**Expected**: Full dashboard with analytics, metrics, recent activity

---

### 6. Appointments (/dashboard/appointments)

**What to check**:
- [ ] Appointments list displays
- [ ] Calendar view works
- [ ] "New Appointment" button works
- [ ] Can create test appointment
- [ ] Appointment details show:
  - Customer name
  - Service type
  - Date/time
  - Status
- [ ] Can edit appointment
- [ ] Can cancel appointment
- [ ] Filters work (upcoming, past, cancelled)

**Test**: Create a new appointment for tomorrow

**Expected**: Appointment saved, displays in list and calendar

---

### 7. Customers (/dashboard/customers)

**What to check**:
- [ ] Customer list displays
- [ ] Search functionality works
- [ ] "Add Customer" button works
- [ ] Can create test customer
- [ ] Customer profile shows:
  - Contact info
  - Appointment history
  - Loyalty points
  - Total spent
- [ ] Can edit customer
- [ ] Can view customer details

**Test**: Add a new customer with full details

**Expected**: Customer saved, appears in list

---

### 8. Voice AI / Maya (/dashboard/agent or /dashboard/voice-ai)

**What to check**:
- [ ] Voice AI settings page loads
- [ ] Maya configuration visible
- [ ] Phone number displayed
- [ ] Voice settings (tone, speed, language)
- [ ] Call scripts/prompts
- [ ] Test call button (if available)
- [ ] Integration status (Vapi connection)

**Expected**: Voice AI configuration interface

**Known**: May need Vapi credentials configured

---

### 9. Marketing (/dashboard/marketing)

**What to check**:
- [ ] Marketing dashboard loads
- [ ] Email campaigns section
- [ ] SMS campaigns section
- [ ] Campaign creation works
- [ ] Campaign analytics displayed
- [ ] Template library (if available)

**Expected**: Marketing tools interface

---

### 10. Analytics (/dashboard/analytics)

**What to check**:
- [ ] Analytics page loads
- [ ] Key metrics displayed:
  - Call volume
  - Conversion rates
  - Revenue tracking
  - Customer acquisition
- [ ] Date range selector works
- [ ] Charts render correctly
- [ ] Export functionality (if available)

**Expected**: Comprehensive analytics dashboard

---

### 11. Settings (/dashboard/settings)

**What to check**:
- [ ] Settings page loads
- [ ] Profile settings editable
- [ ] Business settings visible
- [ ] Billing information
- [ ] Integration settings
- [ ] Notification preferences
- [ ] Can save changes

**Expected**: Full settings interface

---

### 12. Billing (/dashboard/billing or /dashboard/settings/billing)

**What to check**:
- [ ] Billing page loads
- [ ] Current plan displayed
- [ ] Payment method section
- [ ] Billing history
- [ ] Upgrade/downgrade options
- [ ] Invoice downloads (if any)

**Expected**: Billing management interface

---

## 🔍 Technical Tests

### Console Errors
Open Chrome DevTools (F12) → Console

**Check for**:
- [ ] No red errors on page load
- [ ] No 404 errors for assets
- [ ] No authentication errors
- [ ] No API errors

**Some warnings OK**: Next.js dev warnings, hydration warnings

---

### Network Requests
DevTools → Network tab

**Check**:
- [ ] All API calls to `/api/*` return 200
- [ ] Supabase requests successful
- [ ] No failed image/asset loads
- [ ] Authentication headers present

---

### Database Connection
**Test**: Try creating an appointment or customer

**Check**:
- [ ] Data saves to Supabase
- [ ] Data retrieves on page refresh
- [ ] No RLS (Row Level Security) errors
- [ ] Audit logs created (if configured)

---

### Authentication State
**Test**:
1. Log out
2. Try accessing `/dashboard` directly
3. Should redirect to `/login`

**Check**:
- [ ] Protected routes require auth
- [ ] Logout works correctly
- [ ] Session persists on refresh
- [ ] Token refresh works

---

## 🐛 Known Issues to Verify

### 1. Audit Logs Bug
**Status**: May still have import errors

**Test**:
- Create an appointment
- Check browser console for audit log errors

**Expected**: Either works or shows specific error

---

### 2. Pricing Page - Old Model
**Status**: Not updated to PRD v2 modular pricing

**Test**: View `/pricing`

**Expected**: Shows OLD pricing ($147/$397/$997), not new modular

**Action Needed**: Update pricing page to PRD v2 structure

---

### 3. Missing Features from PRD v2
**Status**: Most modular features not built yet

**Missing**:
- [ ] Service modules marketplace
- [ ] Industry snapshots
- [ ] Enterprise services DFY section
- [ ] Module activation/deactivation
- [ ] Module-specific billing

**Expected**: These don't exist yet (70% gap from PRD v2)

---

## 📊 Test Results Template

For each section, rate:
- ✅ **Works perfectly** - No issues
- ⚠️ **Works with issues** - Functional but has bugs
- ❌ **Broken** - Doesn't work
- ⏭️ **Not built yet** - Feature doesn't exist

---

## 🎯 Critical Path Test

**Minimum viable flow for first customer**:

1. ✅ Customer signs up → Account created
2. ✅ Completes onboarding → Business configured
3. ✅ Sets up voice AI → Phone number active
4. ✅ Receives test call → Maya answers
5. ✅ Maya books appointment → Saved to database
6. ✅ Customer receives confirmation → Email sent
7. ✅ Appointment shows in dashboard → Visible

**This is the MINIMUM needed for launch**

---

## 🚨 Blockers for Launch

Rate severity:
- 🔴 **Critical** - Blocks launch
- 🟡 **High** - Should fix before launch
- 🟢 **Medium** - Fix after launch
- ⚪ **Low** - Nice to have

Track issues here as you test...

---

## 📸 Screenshots Needed

Take screenshots of:
1. Homepage hero section
2. Pricing page
3. Dashboard main view
4. Appointments calendar
5. Voice AI settings
6. Any errors encountered

**Save to**: `SYSTEM-TEST-SCREENSHOTS/` folder

---

## ✅ Final Checklist

Before marking system as "ready":

- [ ] All core pages load
- [ ] Can create account
- [ ] Can login
- [ ] Can create appointment
- [ ] Can add customer
- [ ] Voice AI configured (or skip for manual)
- [ ] No critical console errors
- [ ] Database saves work
- [ ] Authentication works
- [ ] Billing page loads

**Passing score**: 8/10 items working = Good enough for manual launch

---

## 🎯 Next Steps After Testing

Based on test results:

**If 90%+ working**:
→ Launch with manual workarounds for enterprise customers

**If 70-89% working**:
→ Fix critical bugs first (2-3 days), then launch

**If <70% working**:
→ Identify blockers, fix systematically (1-2 weeks)

---

**Start testing now!**
Open http://localhost:3000 and work through this checklist.
