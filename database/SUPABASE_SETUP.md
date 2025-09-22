# Supabase Setup Guide - DropFly AI Salon Platform

## Quick Setup (5 minutes)

### 1. Create Supabase Project
```bash
# Go to https://supabase.com/dashboard
# Click "New Project"
# Choose organization and fill details:
```

**Project Settings:**
- **Name**: `dropfly-salon-platform`  
- **Database Password**: Generate strong password (save this!)
- **Region**: Choose closest to your users
- **Pricing**: Start with Free tier

### 2. Run Database Schema
```sql
-- Copy and paste the entire supabase-schema.sql file
-- Into: Supabase Dashboard → SQL Editor → "New Query"
-- Click "Run" to create all tables, functions, and security policies
```

### 3. Get Your Connection Details
Navigate to **Settings → API** and copy:

```bash
# Project URL
PROJECT_URL="https://your-project-ref.supabase.co"

# Anon Key (for client connections)
SUPABASE_ANON_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# Service Role Key (for server operations - keep secret!)
SUPABASE_SERVICE_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### 4. Configure Authentication
Go to **Authentication → Settings**:

- **Site URL**: `https://yourdomain.com` (or `http://localhost:3000` for dev)
- **Redirect URLs**: Add your app URLs
- **Email Templates**: Customize welcome emails (optional)

### 5. Set Row Level Security
The schema automatically enables RLS. To customize:

```sql
-- Example: Allow webhook access for booking system
CREATE POLICY "Allow webhook booking access" ON appointments
    FOR INSERT USING (true); -- Customize based on webhook authentication
```

---

## Database Schema Overview

### Core Tables
- **`businesses`** - Multi-tenant core (one row per salon)
- **`appointments`** - Main booking data
- **`customers`** - Customer records per salon
- **`services`** - What each salon offers
- **`staff`** - Employees per salon
- **`system_logs`** - Event tracking & debugging

### Key Features
- ✅ **Multi-tenant isolation** via Row Level Security
- ✅ **Automatic slug generation** from business names
- ✅ **Default services** seeded for new salons
- ✅ **Webhook tokens** for secure API access  
- ✅ **Comprehensive indexing** for performance
- ✅ **JSONB settings** for flexible configuration

### Sample Data Structure
```json
// Business record
{
  "id": "uuid",
  "slug": "sparkle-nails",
  "name": "Sparkle Nails & Spa",
  "vapi_assistant_id": "assistant_123",
  "vapi_phone_number": "(555) 123-4567",
  "webhook_token": "secure_token_here",
  "plan_type": "starter",
  "trial_ends_at": "2025-02-07T00:00:00Z"
}
```

---

## Environment Configuration

Create `.env` file:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Vapi Configuration (you already have this)
VAPI_API_KEY=1d33c846-52ba-46ff-b663-16fb6c67af9e

# n8n Configuration (will add later)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook

# Optional: Hosting Configuration
PLATFORM_URL=https://dropfly.ai
ADMIN_DASHBOARD_URL=https://admin.dropfly.ai
```

---

## Testing the Database

### 1. Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 2. Test Connection
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Test query
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .limit(1);

console.log('Database connected:', !error);
```

---

## Next Steps After Setup

1. ✅ **Database Schema** (this step)
2. 🔄 **Environment Variables** (next)
3. 🔄 **Test Registration Flow** 
4. 🔄 **n8n Webhook Integration**
5. 🔄 **Phone Number Provisioning**

---

## Troubleshooting

### Common Issues
- **RLS Blocking Queries**: Temporarily disable RLS for testing
- **Connection Errors**: Check API keys and project URL
- **Schema Errors**: Ensure all SQL runs without syntax errors

### Disable RLS (Development Only)
```sql
-- Temporary disable for testing
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
-- Re-enable before production!
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
```

### Database Reset
```sql
-- Nuclear option: Delete all data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then re-run the schema file
```

Ready to proceed? Copy the PROJECT_URL, ANON_KEY, and SERVICE_KEY when you have them!