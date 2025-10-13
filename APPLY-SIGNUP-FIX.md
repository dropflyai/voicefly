# Quick Fix: Apply Signup Migration

## ⚠️ CRITICAL: Email signup won't work until you run this migration!

## Option 1: Supabase Dashboard (EASIEST - 2 minutes)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

2. **Copy the SQL**
   - Open file: `supabase/migrations/20250113_add_signup_function.sql`
   - Copy all contents (Cmd+A, Cmd+C)

3. **Run the SQL**
   - Paste into SQL Editor
   - Click "Run" button
   - Should see success message

4. **Test it**
   ```bash
   # Go to signup page
   open http://localhost:3022/signup

   # Try creating account with:
   # - Email: test@example.com
   # - Password: password123
   # - Fill in other fields
   # - Should successfully create account!
   ```

---

## Option 2: Supabase CLI (If you have project linked)

```bash
# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
npx supabase db push

# Test it
open http://localhost:3022/signup
```

---

## How to get your Project ID / Ref

1. Go to: https://supabase.com/dashboard
2. Select your VoiceFly project
3. Go to **Settings** > **General**
4. Copy the **Reference ID** (looks like: `kumocwwziopyilwhfiwb`)

---

## What this fixes

- ✅ Email/password signup will work
- ✅ Creates business record automatically
- ✅ Associates user as owner
- ✅ Sets 14-day trial period
- ✅ Initializes credits

## What's still needed (optional)

- ⏳ Google OAuth setup (see SIGNUP-FIX-INSTRUCTIONS.md)
- ⏳ Apple OAuth setup (see SIGNUP-FIX-INSTRUCTIONS.md)

---

## Verification

After running the migration, check if function exists:

```sql
-- Run this in Supabase SQL Editor:
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'create_business_for_new_user';

-- Should return 1 row if successful
```

---

**IMPORTANT**: This migration must be run before email signup will work!
