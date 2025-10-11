# 🚀 Stripe Quick Setup - 3 Main Tiers Only
**Launch Time: 10 minutes**

Go to: https://dashboard.stripe.com/test/products

---

## ✅ Product 1: Starter - $97/mo

Click **"+ Add product"**

```
Name: VoiceFly Starter
Description: 150 voice minutes, 100 SMS, 500 emails, 50 bookings/month
Pricing Model: Recurring
Price: 97 USD
Billing period: Monthly
Trial: 0 days
```

**After saving, COPY THE PRICE ID** → Starts with `price_`

---

## ✅ Product 2: Professional - $297/mo

Click **"+ Add product"**

```
Name: VoiceFly Professional
Description: 500 inbound + 200 outbound minutes, 40 leads, automation
Pricing Model: Recurring
Price: 297 USD
Billing period: Monthly
Trial: 0 days
```

**COPY THE PRICE ID**

---

## ✅ Product 3: Enterprise - $997/mo

Click **"+ Add product"**

```
Name: VoiceFly Enterprise
Description: 1,000 inbound + 500 outbound minutes, 60 leads, multi-location
Pricing Model: Recurring
Price: 997 USD
Billing period: Monthly
Trial: 0 days
```

**COPY THE PRICE ID**

---

## 📋 Then Update .env.local

Open `.env.local` and replace these lines (around line 59-61):

```bash
NEXT_PUBLIC_STRIPE_PRICE_STARTER=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxx
```

**Paste your 3 Price IDs** that you copied from Stripe.

---

## 🔄 Restart Dev Server

```bash
# The server will auto-reload when you save .env.local
# If it doesn't, kill it and restart:
PORT=3022 npm run dev
```

---

## ✅ Test Payment Flow

1. Go to: http://localhost:3022/pricing/starter
2. Click **"Get Started Now"**
3. Complete Stripe checkout with test card: `4242 4242 4242 4242`
4. Should redirect to dashboard

---

## 📌 Add-Ons Can Wait

You can create the 14 add-on products later. The 3 main tiers are all you need to launch!

**After launch**, come back and create add-ons as customers request them.
