# MVP Features Database Schema Overview

## 🎯 **Three Key Features Added:**
1. **Multi-Location Management** (up to 3 locations for Business tier)
2. **Payment Processing** (Square + Stripe integration)
3. **Simple Loyalty Program** (points-based rewards)

---

## 🏢 **1. Multi-Location Management**

### New Tables:
- **`locations`** - Store multiple locations per business
- Updated existing tables with `location_id` foreign keys

### Key Features:
- Each business can have multiple locations (based on plan tier)
- One primary location per business
- Location-specific staff, hours, appointments
- Separate payment processor configs per location

### Plan Limits:
- **Starter:** 1 location only
- **Professional:** 1 location only  
- **Business:** Up to 3 locations
- **Enterprise:** Unlimited locations

---

## 💳 **2. Payment Processing**

### New Tables:
- **`payment_processors`** - Store Square/Stripe API configurations
- **`payments`** - Enhanced payment tracking with processor details

### Supported Processors:
- **Square** - For in-person card readers and online payments
- **Stripe** - For online payments and subscriptions
- **Cash** - For manual cash transactions

### Key Features:
- Multi-processor support (Square + Stripe per location)
- Automatic fee tracking
- Receipt generation
- Refund management
- Tip handling with configurable percentages

---

## ⭐ **3. Simple Loyalty Program**

### New Tables:
- **`loyalty_programs`** - Program configuration per business
- **`customer_loyalty_points`** - Customer point balances
- **`loyalty_transactions`** - Complete points history

### How It Works:
1. **Points Earning:** 1 point per $1 spent (configurable)
2. **Rewards:** Simple tier system (100 pts = $5 off, 200 pts = $10 off, etc.)
3. **Automatic:** Points awarded when payment status = 'paid'
4. **Redemption:** Staff can apply point discounts at checkout

### Program Settings:
- Points per dollar spent
- Bonus points per visit
- Point expiration (default: 1 year)
- Custom reward tiers
- Maximum points per transaction

---

## 🔄 **Database Functions Added:**

### Loyalty Functions:
- `award_loyalty_points()` - Automatically award points for purchases
- `redeem_loyalty_points()` - Handle point redemption with validation
- Automatic trigger on payment completion

### Migration Functions:
- `create_default_location()` - Create primary location for existing businesses
- `migrate_existing_businesses_to_multi_location()` - One-time migration helper

---

## 🎚️ **Updated Plan Tiers:**

### **Starter - $47/month**
- 1 location only
- Web booking + Voice AI + SMS confirmations
- Basic customer management
- No payment processing
- No loyalty program

### **Professional - $97/month**
- 1 location
- **+ Payment processing (Square + Stripe)**
- **+ Basic loyalty program**
- Advanced analytics

### **Business - $197/month**
- **Up to 3 locations**
- **Multi-location management dashboard**
- Cross-location customer profiles
- Location-specific reporting
- Everything from Professional tier

---

## 🚀 **Implementation Steps:**

1. **Run Schema Update:**
   ```sql
   -- Execute the mvp-features-schema-update.sql file
   \i mvp-features-schema-update.sql
   ```

2. **Migrate Existing Data:**
   ```sql
   -- Run migration for existing businesses
   SELECT migrate_existing_businesses_to_multi_location();
   ```

3. **Update Frontend:**
   - Import new types from `supabase-types-mvp.ts`
   - Update onboarding flow with new pricing tiers
   - Add location management UI
   - Add payment processor setup
   - Add loyalty program configuration

4. **Test Integration:**
   - Square Sandbox setup
   - Stripe Test mode setup
   - Loyalty points flow testing

---

## 📊 **Expected Business Impact:**

### **Payment Processing:**
- **Revenue increase:** Streamlined payment flow = higher completion rates
- **Customer satisfaction:** Professional checkout experience
- **Data insights:** Detailed payment analytics and trends

### **Multi-Location:**
- **Business expansion:** Support salon chains and franchises  
- **Higher ARPU:** Business tier customers pay 2x more
- **Stickiness:** Harder to migrate away with multiple locations

### **Loyalty Program:**
- **Customer retention:** 25-30% improvement typical for loyalty programs
- **Repeat visits:** Points incentivize return customers
- **Average transaction:** Customers spend more to reach reward thresholds

---

## 🔐 **Security Considerations:**

1. **Payment Processor Keys:** Should be encrypted at rest in production
2. **PCI Compliance:** Using Square/Stripe handles most compliance requirements  
3. **Row Level Security:** All new tables have proper RLS policies
4. **API Key Management:** Separate keys for test/live modes

---

## 🧪 **Testing Checklist:**

- [ ] Create multiple locations for a business
- [ ] Configure Square processor (sandbox mode)
- [ ] Configure Stripe processor (test mode)
- [ ] Process payment and verify loyalty points awarded
- [ ] Redeem loyalty points and verify balance
- [ ] Test cross-location customer booking
- [ ] Verify location-specific analytics
- [ ] Test plan tier upgrade flow

---

**🎉 With these three features, the nail salon app transforms from a simple booking tool into a comprehensive business management platform that can compete with established SaaS solutions!**