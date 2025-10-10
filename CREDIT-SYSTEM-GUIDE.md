# VoiceFly Credit System - Complete Implementation Guide

**Status**: ✅ **Fully Implemented**
**Created**: October 9, 2025
**Version**: 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Credit Economics](#credit-economics)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [UI Components](#ui-components)
7. [Integration Guide](#integration-guide)
8. [Testing](#testing)
9. [Deployment Checklist](#deployment-checklist)

---

## Overview

The VoiceFly Credit System is a token-based metering system that regulates access to platform features and prevents abuse during the 14-day trial period.

### **Why Credits?**

1. **Flexible Control**: Different features consume different amounts based on cost
2. **Fair Metering**: Users control how they spend their allocation
3. **Natural Upsell**: Clear upgrade path when credits run low
4. **Prevents Abuse**: Expensive features (deep research, voice AI) properly limited
5. **Revenue Opportunity**: Add-on credit packs provide additional monetization

---

## Credit Economics

### **Monthly Allocations by Tier**

| Tier | Monthly Credits | Price | Resets |
|------|----------------|-------|--------|
| **Trial** | 50 credits | Free | Never (one-time) |
| **Starter** | 500 credits | $147/mo | Monthly |
| **Professional** | 2,000 credits | $397/mo | Monthly |
| **Enterprise** | 10,000 credits | $997/mo | Monthly |

### **Credit Costs Per Feature**

| Feature | Credits | Why This Cost |
|---------|---------|---------------|
| **Voice Call (inbound)** | 5 | Basic AI voice interaction |
| **Voice Call (outbound)** | 8 | More complex, proactive calling |
| **AI Chat Message** | 1 | Lightweight interaction |
| **Maya Deep Research** | 25 | Very expensive (Claude API + data) |
| **Maya Quick Research** | 10 | Lighter research queries |
| **Maya Market Analysis** | 20 | Medium complexity research |
| **Appointment Booking** | 2 | Simple database operation |
| **Appointment Reminder** | 1 | Automated SMS/email |
| **Lead Enrichment** | 5 | API calls to external services |
| **Email Campaign (per 100)** | 15 | Bulk email operations |
| **SMS Campaign (per 100)** | 20 | More expensive than email |
| **Workflow Execution** | 3 | Automation run |
| **Automation Trigger** | 2 | Event-based automation |

### **Add-on Credit Packs**

| Pack | Credits | Price | Price/Credit | Savings |
|------|---------|-------|--------------|---------|
| **Small Pack** | 100 | $15 | $0.15 | $0 |
| **Medium Pack** | 500 | $60 | $0.12 | $15 (20% off) |
| **Large Pack** | 1,000 | $100 | $0.10 | $50 (33% off) |
| **Enterprise Pack** | 5,000 | $400 | $0.08 | $150 (46% off) |

**Key Features:**
- ✅ Purchased credits never expire
- ✅ Roll over forever
- ✅ Used after monthly allocation runs out
- ✅ Bulk discounts up to 46%

---

## System Architecture

### **Credit Flow**

```
User Action
    ↓
API Endpoint
    ↓
Credit Check Middleware
    ↓
Has Enough Credits? → YES → Deduct Credits → Execute Feature
    ↓ NO
Return 402 Payment Required
```

### **Deduction Logic**

Credits are deducted in this order:
1. **Monthly allocation** (resets on billing date)
2. **Purchased credits** (never expire)

Example:
- User has 10 monthly credits + 50 purchased credits
- Action requires 15 credits
- Result: 0 monthly + 45 purchased remaining

### **Monthly Reset**

Automatic reset happens on the billing date:
- Monthly allocation refreshed based on tier
- Purchased credits remain untouched
- `credits_used_this_month` reset to 0

---

## Database Schema

### **businesses table (extended)**

```sql
ALTER TABLE businesses ADD COLUMN
  monthly_credits INTEGER DEFAULT 50,
  purchased_credits INTEGER DEFAULT 0,
  credits_used_this_month INTEGER DEFAULT 0,
  credits_reset_date TIMESTAMP DEFAULT (NOW() + INTERVAL '1 month');
```

### **credit_transactions table**

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  amount INTEGER NOT NULL, -- Positive = add, Negative = deduct
  operation TEXT NOT NULL, -- 'deduct', 'purchase', 'reset', 'refund'
  feature TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **credit_packs table**

```sql
CREATE TABLE credit_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price INTEGER NOT NULL, -- In cents
  savings INTEGER DEFAULT 0,
  price_per_credit DECIMAL(10,4) NOT NULL,
  active BOOLEAN DEFAULT true
);
```

### **credit_purchases table**

```sql
CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  pack_id TEXT NOT NULL REFERENCES credit_packs(id),
  credits_purchased INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'completed'
);
```

---

## API Reference

### **Get Balance**

```typescript
GET /api/credits/balance?business_id={id}

Response:
{
  "success": true,
  "balance": {
    "monthly_credits": 500,
    "purchased_credits": 100,
    "total_credits": 600,
    "credits_used_this_month": 45,
    "credits_reset_date": "2025-11-01T00:00:00Z"
  }
}
```

### **Purchase Credits**

```typescript
POST /api/credits/purchase

Body:
{
  "business_id": "uuid",
  "pack_id": "pack_large"
}

Response:
{
  "success": true,
  "checkout_url": "https://checkout.stripe.com/..."
}
```

### **Check and Deduct (Middleware)**

```typescript
import { checkAndDeductCredits } from '@/middleware/credit-check'
import { CreditCost } from '@/lib/credit-system'

export async function POST(req: NextRequest) {
  // Check credits and deduct
  const result = await checkAndDeductCredits(req, {
    cost: CreditCost.MAYA_DEEP_RESEARCH,
    feature: 'maya_research',
    metadata: { query: 'market analysis' }
  })

  if (!result.success) {
    return result.response // 402 Payment Required
  }

  // Continue with feature...
  return NextResponse.json({ success: true })
}
```

---

## UI Components

### **CreditMeter Component**

**Compact Mode (Dashboard Header)**

```tsx
import CreditMeter from '@/components/CreditMeter'

<CreditMeter
  businessId={businessId}
  compact={true}
  showPurchaseButton={true}
/>
```

Displays: `[🔋 547] [+ Buy]`

**Full Mode (Billing Page)**

```tsx
<CreditMeter
  businessId={businessId}
  compact={false}
/>
```

Shows:
- Total credits with progress bar
- Monthly vs purchased breakdown
- Usage this month
- Low credit warnings
- Purchase button

### **PurchaseCreditsModal Component**

```tsx
import PurchaseCreditsModal from '@/components/PurchaseCreditsModal'

const [modalOpen, setModalOpen] = useState(false)

<PurchaseCreditsModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  businessId={businessId}
  onPurchaseComplete={() => {
    // Refresh balance
  }}
/>
```

Shows:
- 4 credit pack options
- Best value badge
- Savings calculations
- Use case examples
- Stripe checkout integration

---

## Integration Guide

### **Step 1: Run Database Migration**

```bash
# In Supabase SQL Editor, run:
supabase-migration-credits.sql
```

This creates:
- Credit columns in `businesses` table
- `credit_transactions` table
- `credit_packs` table
- `credit_purchases` table
- Helper functions for credit checks and resets

### **Step 2: Initialize Credits for Existing Businesses**

```typescript
import CreditSystem from '@/lib/credit-system'

// For each existing business
await CreditSystem.initializeCredits(businessId, 'starter')
```

### **Step 3: Add Credit Checks to API Routes**

```typescript
// Example: Voice AI endpoint
import { checkAndDeductCredits } from '@/middleware/credit-check'
import { CreditCost } from '@/lib/credit-system'

export async function POST(req: NextRequest) {
  // Check credits first
  const creditCheck = await checkAndDeductCredits(req, {
    cost: CreditCost.VOICE_CALL_INBOUND,
    feature: 'voice_call',
    metadata: { call_type: 'inbound' }
  })

  if (!creditCheck.success) {
    return creditCheck.response
  }

  // Process voice call...
}
```

### **Step 4: Add Credit Meter to Dashboard**

```tsx
// In dashboard layout or header
import CreditMeter from '@/components/CreditMeter'

export default function DashboardLayout() {
  return (
    <div>
      <header>
        <CreditMeter
          businessId={businessId}
          compact={true}
        />
      </header>
    </div>
  )
}
```

### **Step 5: Set Up Stripe Webhook for Credit Purchases**

```typescript
// In /api/webhook/stripe/route.ts

if (event.type === 'checkout.session.completed') {
  const session = event.data.object

  if (session.metadata?.type === 'credit_pack_purchase') {
    const { business_id, pack_id, credits } = session.metadata

    await CreditSystem.addPurchasedCredits(
      business_id,
      parseInt(credits),
      pack_id,
      session.payment_intent
    )
  }
}
```

### **Step 6: Set Up Monthly Credit Reset Cron**

```sql
-- In Supabase, create a cron job
SELECT cron.schedule(
  'reset-monthly-credits',
  '0 0 * * *', -- Daily at midnight
  $$
  SELECT reset_monthly_credits();
  $$
);
```

---

## Testing

### **Test Scenarios**

**1. Credit Deduction**
```typescript
const result = await CreditSystem.deductCredits(
  'business-id',
  25,
  'maya_research',
  { query: 'test' }
)

expect(result.success).toBe(true)
expect(result.balance.total_credits).toBe(25) // 50 - 25
```

**2. Insufficient Credits**
```typescript
// Use 50 credits, then try to use 25 more
const result = await CreditSystem.deductCredits('business-id', 25, 'test')
expect(result.success).toBe(false)
expect(result.error).toContain('Insufficient credits')
```

**3. Purchase Credits**
```typescript
const result = await CreditSystem.addPurchasedCredits(
  'business-id',
  1000,
  'pack_large',
  'stripe_pi_123'
)

expect(result.success).toBe(true)
expect(result.balance.purchased_credits).toBe(1000)
```

**4. Monthly Reset**
```typescript
await CreditSystem.resetMonthlyCredits('business-id')

const balance = await CreditSystem.getBalance('business-id')
expect(balance.monthly_credits).toBe(500) // Starter tier
expect(balance.credits_used_this_month).toBe(0)
```

---

## Deployment Checklist

### **Before Launch**

- [ ] Run database migration in production Supabase
- [ ] Initialize credits for all existing businesses
- [ ] Set up Stripe webhook endpoint for credit purchases
- [ ] Configure Stripe products for each credit pack
- [ ] Set up monthly credit reset cron job
- [ ] Test credit deduction in production
- [ ] Test credit purchase flow end-to-end
- [ ] Verify low credit warnings display correctly

### **After Launch**

- [ ] Monitor credit transaction logs
- [ ] Track credit pack purchase conversion rates
- [ ] Adjust credit costs based on actual API usage
- [ ] Monitor for credit system abuse
- [ ] Set up alerts for failed credit resets

---

## Files Created

### **Core System**
- ✅ `src/lib/credit-system.ts` - Core credit management
- ✅ `src/middleware/credit-check.ts` - Credit validation middleware
- ✅ `supabase-migration-credits.sql` - Database schema

### **API Endpoints**
- ✅ `src/app/api/credits/balance/route.ts` - Get balance
- ✅ `src/app/api/credits/purchase/route.ts` - Purchase credits

### **UI Components**
- ✅ `src/components/CreditMeter.tsx` - Credit balance display
- ✅ `src/components/PurchaseCreditsModal.tsx` - Purchase flow

### **Updates**
- ✅ `src/lib/audit-logger.ts` - Added credit event types

---

## Trial User Math (Forces Upgrade)

**Trial Allocation**: 50 credits (one-time, doesn't reset)

**Typical Usage Pattern**:
- Day 1-2: User tests features
  - 5 voice calls = 25 credits
  - 1 deep research = 25 credits
  - **Balance: 0 credits** ❌

**Result**: User hits credit limit after 2-3 days of active use, forcing upgrade or credit purchase.

---

## Revenue Projections

**Credit Pack Revenue** (conservative estimates):

| Scenario | Monthly Buyers | Avg Pack | Monthly Revenue |
|----------|----------------|----------|-----------------|
| **Conservative** | 20 customers | Medium ($60) | $1,200/mo |
| **Moderate** | 50 customers | Large ($100) | $5,000/mo |
| **Optimistic** | 100 customers | Large ($100) | $10,000/mo |

**Annual**: $14,400 - $120,000 in additional credit pack revenue

---

## Support & Troubleshooting

### **Common Issues**

**Credits not deducting**
- Check middleware is properly calling `checkAndDeductCredits()`
- Verify business_id is passed correctly
- Check database permissions

**Monthly credits not resetting**
- Verify cron job is running
- Check `credits_reset_date` is in the past
- Run `reset_monthly_credits()` function manually

**Purchase not adding credits**
- Check Stripe webhook is receiving events
- Verify metadata is passed correctly
- Check `credit_purchases` table for failed records

---

## Next Steps

1. **Deploy to Production**: Run migration, initialize credits
2. **Monitor Usage**: Track credit consumption patterns
3. **Optimize Costs**: Adjust credit costs based on actual API expenses
4. **Add Features**: Build more features that consume credits
5. **Marketing**: Promote credit packs as add-ons

---

**Status**: ✅ System fully implemented and ready for production deployment

**Last Updated**: October 9, 2025
