# Multi-Tenancy & Authentication System

## 🏗️ Architecture Overview

VoiceFly now uses **Supabase Auth** with a **multi-tenant, multi-user architecture**:

```
┌─────────────┐
│ auth.users  │  ← Supabase Auth (passwords, sessions, JWT)
└──────┬──────┘
       │
       │ user_id
       │
┌──────▼──────────────┐
│  business_users     │  ← Junction table (user ↔ business + role)
└──────┬──────────────┘
       │
       │ business_id
       │
┌──────▼──────────────┐
│   businesses        │  ← Tenant data
└─────────────────────┘
       │
       ├─ services
       ├─ customers
       ├─ appointments
       ├─ staff
       └─ ... (all tenant-specific data)
```

## 🔐 Authentication Flow

### **Signup**
```typescript
// 1. Create auth user (with hashed password)
supabase.auth.signUp({ email, password })

// 2. Create business tenant
businesses.insert({ name, email, business_type })

// 3. Link user to business as "owner"
business_users.insert({ user_id, business_id, role: 'owner' })

// 4. Auto-create industry-specific services
```

### **Login**
```typescript
// 1. Authenticate with password
supabase.auth.signInWithPassword({ email, password })

// 2. Get user's businesses
business_users.select().eq('user_id', userId)

// 3. Set active business in localStorage
```

## 👥 Multi-User Support

### **User Roles**
- **Owner**: Full control (can delete business, manage billing)
- **Admin**: Can invite users, manage all settings
- **Manager**: Can manage appointments, customers, services
- **Member**: View-only or limited permissions

### **Role Permissions**
```sql
-- Only owners/admins can invite users
WHERE role IN ('owner', 'admin')

-- Only owners can change subscription
WHERE role = 'owner'
```

### **Inviting Users**
```typescript
// Existing users: Add to business
business_users.insert({
  user_id: existingUser.id,
  business_id: businessId,
  role: 'manager'
})

// New users: Send email invitation
// (email service integration needed)
```

## 🏢 Multi-Tenancy Support

### **Data Isolation**
Every table has Row Level Security (RLS):

```sql
-- Users can only access data from their businesses
CREATE POLICY "Users access their businesses"
  ON services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_users
      WHERE business_id = services.business_id
        AND user_id = auth.uid()
    )
  );
```

### **Multiple Businesses Per User**
Users can belong to multiple businesses:

```typescript
// Get all user's businesses
const businesses = user.businesses // Array of { id, name, role }

// Switch active business
AuthService.switchBusiness(businessId)
```

## 📊 Database Schema

### **business_users** (Junction Table)
```sql
CREATE TABLE business_users (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id),
  role TEXT CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, business_id)
);
```

### **Row Level Security (RLS)**
All tenant tables have RLS enabled:
- ✅ `services`
- ✅ `customers`
- ✅ `appointments`
- ✅ `staff`
- ✅ `business_users`

## 🔧 Helper Functions

### **Get User's Businesses**
```sql
SELECT * FROM get_user_businesses(user_uuid);
-- Returns: business_id, business_name, role
```

### **Check Business Access**
```sql
SELECT user_has_business_access(user_uuid, business_id);
-- Returns: true/false
```

### **Get User Role**
```sql
SELECT get_user_role(user_uuid, business_id);
-- Returns: 'owner' | 'admin' | 'manager' | 'member'
```

## 🚀 Usage Examples

### **Signup New Business**
```typescript
import { AuthService } from '@/lib/auth-service'

const { user, primaryBusinessId } = await AuthService.signup({
  email: 'owner@company.com',
  password: 'secure_password_123',
  firstName: 'John',
  lastName: 'Doe',
  companyName: 'Acme Dental',
  businessType: 'dental_practice'
})
// ✅ Creates: auth user + business + owner association + 6 services
```

### **Login**
```typescript
const { user, primaryBusinessId } = await AuthService.login({
  email: 'owner@company.com',
  password: 'secure_password_123'
})

console.log(user.businesses) // All businesses user has access to
// [{ id: '...', name: 'Acme Dental', role: 'owner' }]
```

### **Invite Team Member**
```typescript
await AuthService.inviteUserToBusiness(
  businessId,
  'manager@company.com',
  'manager',
  'Jane',
  'Smith'
)
// ✅ Adds user to business with 'manager' role
```

### **Switch Business (Multi-Business Users)**
```typescript
await AuthService.switchBusiness(businessId)
// ✅ Updates localStorage to new active business
```

### **Logout**
```typescript
await AuthService.logout()
// ✅ Clears Supabase session + localStorage
```

## 🔒 Security Features

### **Password Security**
- ✅ Passwords hashed with bcrypt (Supabase handles this)
- ✅ Never stored in plaintext
- ✅ JWT-based session management

### **Tenant Isolation**
- ✅ RLS enforces data access at database level
- ✅ Users can only see their own businesses' data
- ✅ No way to access other tenants' data (even with SQL injection)

### **Role-Based Access Control (RBAC)**
- ✅ Granular permissions per business
- ✅ Different roles can have different permissions
- ✅ Easy to add custom role checks

## 📝 Migration Instructions

### **Run Migration**
```bash
# Apply the migration to your Supabase project
supabase db push

# Or via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of supabase/migrations/20250102_add_auth_and_multiuser.sql
# 3. Run query
```

### **Verify Setup**
```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## 🎯 Next Steps

1. **Run the migration** in your Supabase project
2. **Test signup/login flow** with real data
3. **Add team member invitation** (requires email service)
4. **Add password reset** (use Supabase Auth's built-in flow)
5. **Add 2FA** (optional, Supabase supports it)

## 🔗 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-Tenancy Best Practices](https://supabase.com/docs/guides/database/multi-tenancy)
