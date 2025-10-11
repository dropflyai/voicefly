# Payment Processing Completion Plan
**Current Status:** 60% Complete → Target: 100%
**Deadline:** October 30, 2025
**Estimated Work:** 3-4 days

---

## ✅ What's Already Working

### Backend Infrastructure (100% Complete)
1. **Stripe Integration**
   - ✅ Stripe package installed (v18.5.0)
   - ✅ API keys configured in .env.local
   - ✅ Webhook endpoint: `/api/webhook/stripe`

2. **Webhook Event Handling**
   - ✅ `payment_intent.succeeded` - Updates subscription status
   - ✅ `customer.subscription.created` - Creates subscription record
   - ✅ `customer.subscription.updated` - Updates subscription
   - ✅ `customer.subscription.deleted` - Cancels subscription
   - ✅ `invoice.payment_succeeded` - Logs successful payment
   - ✅ `invoice.payment_failed` - Logs failed payment
   - ✅ `checkout.session.completed` - Handles credit pack purchases

3. **Database Schema**
   - ✅ `subscriptions` table
   - ✅ `payments` table
   - ✅ `credit_purchases` table
   - ✅ Audit logging for all payment events

---

## 🔲 What Needs to Be Built (40% Remaining)

### Priority 1: Frontend Checkout Flow (2 days)

#### A. Stripe Checkout Integration
**File to create:** `src/lib/stripe-checkout.ts`

```typescript
// Create Stripe checkout sessions for subscriptions
export async function createCheckoutSession({
  priceId: string,
  businessId: string,
  planName: string,
  successUrl: string,
  cancelUrl: string
}) {
  // POST to /api/checkout/create
  // Return checkout URL
}
```

**API Route to create:** `src/app/api/checkout/create/route.ts`

```typescript
// Creates Stripe checkout session
// Returns session URL for redirect
```

#### B. Pricing Page Stripe Integration
**Update files:**
- `/pricing/free/page.tsx`
- `/pricing/starter/page.tsx`
- `/pricing/professional/page.tsx`
- `/pricing/enterprise/page.tsx`

**Changes:**
- Add Stripe checkout buttons
- Link to Stripe for "Start Trial" CTAs
- Handle trial period (14 days free)

#### C. Subscription Management UI
**File to create:** `src/app/dashboard/billing/subscription/page.tsx`

**Features:**
- View current subscription
- Upgrade/downgrade plans
- Cancel subscription
- View payment history
- Download invoices

---

### Priority 2: Trial Flow (1 day)

#### A. Trial Signup Without Payment
**Implementation:**
- Allow 14-day trial without credit card
- Create "trial" subscription status
- Email reminder on day 7 and day 13
- Convert trial to paid on day 14

**Files to create:**
- `src/app/api/trial/start/route.ts` - Creates trial subscription
- `src/lib/trial-manager.ts` - Handles trial logic

#### B. Trial-to-Paid Conversion
**Implementation:**
- Email on day 13: "Trial ending tomorrow"
- Redirect to payment page
- Stripe checkout for first payment
- Webhook converts trial → active subscription

---

### Priority 3: Enterprise Billing (1 day)

#### A. Manual Invoicing
**For enterprise customers ($6,500/month):**
- Create invoice manually in Stripe dashboard
- Send invoice via email
- Track payment status
- Update subscription when paid

**Files to create:**
- `src/app/api/enterprise/invoice/route.ts`
- Admin dashboard for enterprise billing

#### B. Annual Contracts
**Implementation:**
- Support annual billing (save 20%)
- Generate 12-month invoices
- Auto-renewal option
- Contract management

---

## 🛠️ Implementation Checklist

### Day 1: Checkout Integration
- [ ] Create `src/lib/stripe-checkout.ts`
- [ ] Create `src/app/api/checkout/create/route.ts`
- [ ] Test checkout session creation
- [ ] Verify webhook receives events

### Day 2: Pricing Pages
- [ ] Update all 4 pricing tier pages with Stripe buttons
- [ ] Add loading states
- [ ] Handle errors gracefully
- [ ] Test on localhost

### Day 3: Subscription Management
- [ ] Create subscription management UI
- [ ] Add upgrade/downgrade functionality
- [ ] Display payment history
- [ ] Test subscription changes

### Day 4: Trial & Testing
- [ ] Implement trial signup flow
- [ ] Create trial-to-paid conversion
- [ ] End-to-end testing all flows
- [ ] Fix any bugs found

---

## 💳 Stripe Product & Price IDs Needed

### Create in Stripe Dashboard

**Products:**
1. VoiceFly Starter - $49/month
2. VoiceFly Professional - $99/month
3. VoiceFly Enterprise - $299/month
4. Beauty & Spa Snapshot - $149/month
5. Auto Dealer Pro Snapshot - $349/month
6. Law Firm Snapshot - $249/month

**For Each Product:**
- Create monthly recurring price
- Set 14-day trial period
- Add product metadata (features, limits)

**Environment Variables:**
```bash
# Add to .env.local
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_PROFESSIONAL=price_xxx
STRIPE_PRICE_ENTERPRISE=price_xxx
STRIPE_PRICE_BEAUTY=price_xxx
STRIPE_PRICE_AUTO=price_xxx
STRIPE_PRICE_LEGAL=price_xxx
```

---

## 🧪 Testing Checklist

### Stripe Test Mode
- [ ] Successful payment (4242 4242 4242 4242)
- [ ] Declined payment (4000 0000 0000 0002)
- [ ] Subscription creation
- [ ] Subscription upgrade
- [ ] Subscription downgrade
- [ ] Subscription cancellation
- [ ] Trial period flow
- [ ] Webhook delivery

### User Flows
- [ ] New user signs up for trial
- [ ] Trial converts to paid
- [ ] User upgrades plan
- [ ] User downgrades plan
- [ ] User cancels subscription
- [ ] User resumes subscription
- [ ] Payment fails → retry
- [ ] Invoice generation

---

## 📊 Success Criteria

### For Launch (Nov 1)
1. ✅ Users can start 14-day free trial (no credit card)
2. ✅ Users can subscribe to any tier
3. ✅ Stripe webhooks update database correctly
4. ✅ Users can view subscription in dashboard
5. ✅ Users can cancel subscription
6. ✅ Payment failures are handled gracefully

### Post-Launch (Nov-Dec)
1. Subscription upgrades/downgrades
2. Annual billing option
3. Enterprise invoicing
4. Proration for mid-cycle changes
5. Dunning for failed payments

---

## 🚀 Quick Start Implementation

### Step 1: Create Checkout API (30 minutes)
```typescript
// src/app/api/checkout/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const { priceId, businessId } = await request.json()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      subscription_data: {
        trial_period_days: 14,
        metadata: { business_id: businessId }
      },
      metadata: { business_id: businessId }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
```

### Step 2: Add Checkout Button Component (20 minutes)
```typescript
// src/components/CheckoutButton.tsx
'use client'

import { useState } from 'react'

export default function CheckoutButton({ priceId, planName }: { priceId: string, planName: string }) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, businessId: 'user-business-id' })
      })
      const { url } = await res.json()
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Loading...' : `Try ${planName} Free`}
    </button>
  )
}
```

### Step 3: Update Pricing Pages (10 minutes per page)
```typescript
import CheckoutButton from '@/components/CheckoutButton'

// In pricing page:
<CheckoutButton priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!} planName="Starter" />
```

---

## 📝 Notes

### Why It's 60% Complete
- ✅ Backend webhook handling (40%)
- ✅ Database schema (20%)
- 🔲 Frontend checkout flow (20%)
- 🔲 Subscription management UI (10%)
- 🔲 Trial flow (10%)

### What Can Wait Until Post-Launch
- Subscription upgrades/downgrades (can do manually initially)
- Annual billing (monthly is enough for launch)
- Advanced dunning (basic retry is fine)
- Invoice PDF generation (Stripe provides this)
- Tax calculation (add later for compliance)

### Dependencies
- Supabase database tables (already exist)
- Stripe account (already configured)
- User authentication (already working)

---

## ⚡ Fastest Path to Launch

**If we have only 2 days:**
1. Create checkout API route (2 hours)
2. Create CheckoutButton component (1 hour)
3. Update 4 pricing pages with buttons (2 hours)
4. Test trial signup flow (2 hours)
5. Test payment processing (2 hours)
6. Fix bugs (2 hours)

**Total: 11 hours = 1.5 days**

**Defer to post-launch:**
- Subscription management UI (users can cancel via Stripe customer portal)
- Complex upgrade/downgrade logic (do manually for first month)
- Enterprise invoicing (manual invoices through Stripe dashboard)

---

**Status:** Ready to implement
**Next Action:** Create checkout API route and button component
**Blocker:** None - all dependencies ready
