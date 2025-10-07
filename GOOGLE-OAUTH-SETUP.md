# Google OAuth Setup Guide for VoiceFly

## Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/apis/credentials

2. **Create a new project** (if you don't have one):
   - Click "Select a project" → "New Project"
   - Name: "VoiceFly"
   - Click "Create"

3. **Enable Google+ API:**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "+ CREATE CREDENTIALS"
   - Select "OAuth client ID"
   - Application type: "Web application"
   - Name: "VoiceFly Auth"

5. **Add Authorized Redirect URIs:**
   ```
   https://irvyhhkoiyzartmmvbxw.supabase.co/auth/v1/callback
   ```

   For local development, also add:
   ```
   http://localhost:3002/auth/callback
   ```

6. **Copy your credentials:**
   - Client ID: `GOOGLE_CLIENT_ID`
   - Client Secret: `GOOGLE_CLIENT_SECRET`

## Step 2: Configure in Supabase

1. **Go to Supabase Auth Providers:**
   https://supabase.com/dashboard/project/irvyhhkoiyzartmmvbxw/auth/providers

2. **Find "Google" and click to expand**

3. **Enable Google provider**

4. **Paste your Google credentials:**
   - Client ID (from step 1)
   - Client Secret (from step 1)

5. **Click "Save"**

## Step 3: Verify Redirect URL

Make sure this URL is in your Google OAuth config:
```
https://irvyhhkoiyzartmmvbxw.supabase.co/auth/v1/callback
```

## Step 4: Test

1. Refresh VoiceFly: http://localhost:3002/login
2. Click "Continue with Google"
3. Should redirect to Google sign-in
4. After authentication, redirects back to VoiceFly dashboard

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Check that the redirect URI in Google Console exactly matches:
  `https://irvyhhkoiyzartmmvbxw.supabase.co/auth/v1/callback`

### Error: "Access blocked: Authorization Error"
- Make sure Google+ API is enabled
- Check OAuth consent screen is configured

### Button shows alert instead of redirecting
- The code needs to be updated to use `supabase.auth.signInWithOAuth()`
- I can update this for you
