# Signup Issues - Fix Instructions

## Issues Found

1. ❌ **Email Signup** - Missing database function `create_business_for_new_user`
2. ❌ **Google OAuth** - Not configured in Supabase
3. ❌ **Apple OAuth** - Not configured in Supabase

---

## 1. Fix Email Signup (CRITICAL - Required for app to work)

### Problem
The signup flow calls `create_business_for_new_user` RPC function which doesn't exist in Supabase database yet.

### Solution
Run the migration file to create the function:

```bash
# Option A: Using Supabase CLI (Recommended)
npx supabase db push

# Option B: Run SQL directly in Supabase Dashboard
# 1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
# 2. Copy contents of: supabase/migrations/20250113_add_signup_function.sql
# 3. Click "Run"
```

### What the function does:
- Creates a new business record when a user signs up
- Generates a unique slug for the business
- Associates the user with the business as "owner"
- Sets trial period (14 days)
- Returns business data to the signup flow

### Test it works:
After running the migration, try signing up with email:
1. Go to http://localhost:3022/signup
2. Fill in the form with email/password
3. Should successfully create account and redirect to dashboard

---

## 2. Fix Google OAuth (Optional - For social login)

### Problem
Google OAuth provider is not configured in Supabase.

### Solution

#### Step 1: Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if not done
6. Application type: **Web application**
7. Add authorized redirect URIs:
   ```
   https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
   ```
8. Save and copy:
   - **Client ID**
   - **Client Secret**

#### Step 2: Configure in Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Google** and click to configure
5. Enable Google provider
6. Paste your **Client ID** and **Client Secret**
7. Click **Save**

#### Step 3: Update redirect URL (if needed)
The current code already has the redirect configured:
```typescript
redirectTo: `${window.location.origin}/dashboard`
```

### Test it works:
1. Go to http://localhost:3022/signup
2. Click "Continue with Google"
3. Should redirect to Google sign-in
4. After auth, should redirect back to dashboard

---

## 3. Fix Apple OAuth (Optional - For social login)

### Problem
Apple OAuth provider is not configured in Supabase.

### Solution

#### Step 1: Create Apple Services ID
1. Go to [Apple Developer](https://developer.apple.com/account/)
2. Go to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** > **+** button
4. Select **Services IDs** > Continue
5. Enter Description and Identifier (Bundle ID format: com.yourcompany.app)
6. Click **Continue** > **Register**
7. Select your Services ID and click **Configure**
8. Enable "Sign In with Apple"
9. Add your domain and return URLs:
   ```
   Domain: YOUR_SUPABASE_PROJECT.supabase.co
   Return URL: https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
   ```
10. Click **Save** > **Continue** > **Register**

#### Step 2: Create Apple Private Key
1. Go to **Keys** section
2. Click **+** button
3. Enter Key Name
4. Enable **Sign In with Apple**
5. Click **Configure** and select your Primary App ID
6. Click **Continue** > **Register**
7. **Download the .p8 key file** (you can only download once!)
8. Note the **Key ID**

#### Step 3: Configure in Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Apple** and click to configure
5. Enable Apple provider
6. Enter:
   - **Services ID** (from Step 1)
   - **Team ID** (found in Apple Developer membership)
   - **Key ID** (from Step 2)
   - **Private Key** (contents of .p8 file)
7. Click **Save**

### Test it works:
1. Go to http://localhost:3022/signup
2. Click "Continue with Apple"
3. Should redirect to Apple sign-in
4. After auth, should redirect back to dashboard

---

## Priority Order

1. **FIRST**: Fix Email Signup (run the migration) - This is CRITICAL
2. **OPTIONAL**: Google OAuth (if you want social login)
3. **OPTIONAL**: Apple OAuth (if you want Apple sign-in)

---

## Quick Test Commands

After fixes, test all signup methods:

```bash
# Start dev server
PORT=3022 npm run dev

# Open in browser
open http://localhost:3022/signup

# Test:
# 1. Email signup - should work after migration
# 2. Google OAuth - should work if configured
# 3. Apple OAuth - should work if configured
```

---

## Verification Checklist

- [ ] Run migration: `npx supabase db push`
- [ ] Test email signup works
- [ ] (Optional) Configure Google OAuth
- [ ] (Optional) Test Google signup
- [ ] (Optional) Configure Apple OAuth
- [ ] (Optional) Test Apple signup
- [ ] Commit and deploy changes

---

## Files Modified/Created

- ✅ `supabase/migrations/20250113_add_signup_function.sql` - Created
- ✅ `src/lib/auth-service.ts` - Already correct (no changes needed)
- ✅ `src/app/signup/page.tsx` - Already correct (no changes needed)
- ✅ `src/components/AIChatbot.tsx` - Fixed input text visibility

## Support

If you encounter issues:
1. Check Supabase logs: Dashboard > Logs > Postgres Logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Ensure Supabase project is running

---

**Created:** 2025-01-13
**Status:** Ready to implement
**Priority:** HIGH (Email signup is critical)
