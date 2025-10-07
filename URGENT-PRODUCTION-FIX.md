# 🚨 URGENT: Production Database Setup

**Issue**: Accounts exist in local DB but NOT in production DB
**Impact**: Can't demo tomorrow without accounts
**Time to Fix**: 5 minutes

---

## 🎯 QUICK FIX (Choose One)

### Option A: Point Production to Your Current Database (FASTEST)

**This makes production use the SAME database where accounts already exist.**

1. **Go to Vercel Dashboard**:
   https://vercel.com/dropflyai/voicefly-app/settings/environment-variables

2. **Update these 3 environment variables** to match your .env.local:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://kqsquisdqjedzenwhrkl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [copy from your .env.local line 5]
   SUPABASE_SERVICE_ROLE_KEY = [copy from your .env.local line 6]
   ```

3. **Redeploy**:
   ```bash
   VERCEL_TOKEN="4rAVfa4ZzXnDIDEaMTLMxbpE" npx vercel --force --prod --yes
   ```

4. **Test**:
   Go to https://voiceflyai.com/login
   Try: admin@eliteauto.com / Auto2024!

**Pros**: Fastest, accounts already exist
**Cons**: If you want separate prod/dev databases, use Option B

---

### Option B: Create Accounts in Production Database

**This creates the accounts in whatever database production currently uses.**

1. **Find your PRODUCTION Supabase credentials**:
   - Go to: https://vercel.com/dropflyai/voicefly-app/settings/environment-variables
   - Note the current SUPABASE URL, ANON KEY, and SERVICE ROLE KEY

2. **Update .env.local TEMPORARILY** with production credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=[production URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[production anon key]
   SUPABASE_SERVICE_ROLE_KEY=[production service role key]
   ```

3. **Run the creation script**:
   ```bash
   node create-all-industries.js
   ```

4. **Restore .env.local** to local credentials

5. **Test**:
   Go to https://voiceflyai.com/login
   Try: admin@eliteauto.com / Auto2024!

**Pros**: Keeps prod/dev databases separate
**Cons**: Takes 5 more minutes

---

## 📋 YOUR .env.local CREDENTIALS

From `/Users/rioallen/Documents/DropFly-OS-App-Builder/DropFly-PROJECTS/voicefly-app/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://kqsquisdqjedzenwhrkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[line 5 of your .env.local]
SUPABASE_SERVICE_ROLE_KEY=[line 6 of your .env.local]
```

**This database already has:**
- ✅ All 10 industry accounts
- ✅ All services configured
- ✅ All customers created
- ✅ Schema deployed

---

## 🚀 RECOMMENDED: Option A (2 minutes)

**Why**: Your accounts are already created! Just point production to them.

**Steps**:
1. Copy your 3 Supabase credentials from .env.local
2. Paste into Vercel environment variables
3. Redeploy with: `VERCEL_TOKEN="4rAVfa4ZzXnDIDEaMTLMxbpE" npx vercel --force --prod --yes`
4. Test at voiceflyai.com
5. Done! 🎉

---

## ✅ AFTER FIX

You'll have:
- ✅ voiceflyai.com deployed with latest code
- ✅ Microsoft OAuth removed
- ✅ All 10 industry accounts working
- ✅ Ready to demo to paying customer tomorrow

**Test with**: https://voiceflyai.com/login
**Login**: admin@eliteauto.com / Auto2024!

---

## 🆘 IF YOU NEED HELP

**Quick commands to check your credentials**:

```bash
# Show your current Supabase URL
grep NEXT_PUBLIC_SUPABASE_URL .env.local

# Show your anon key
grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local

# Show your service role key
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

Then paste these into Vercel!
