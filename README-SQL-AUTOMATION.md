# 🤖 Automated SQL Execution for Supabase

Stop copy/pasting SQL! Run it automatically with Chromium.

## 🚀 Quick Start

```bash
node run-sql-in-supabase.js
```

## 📋 What It Does

1. Opens Supabase SQL Editor in Chromium
2. Pastes the SQL automatically
3. Clicks the "Run" button
4. Shows you the results

## 🔐 First Time Setup

The first time you run it:
1. The browser will open
2. You'll need to login to Supabase
3. Navigate to SQL Editor
4. Press ENTER in the terminal
5. The script will take over and run the SQL

## 📁 Files

- `FIX-SIGNUP-ONLY.sql` - The minimal fix for signup
- `run-sql-in-supabase.js` - The automation script
- `test-user-journey.js` - Test signup after fix

## ✅ After Running

Test if signup works:
```bash
node test-user-journey.js
```

If it passes, you're ready to launch! 🚀
