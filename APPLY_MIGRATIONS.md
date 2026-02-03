# 🚀 Apply Database Migrations - Step by Step

## Your Project Info
- **Project Ref**: `wmnfuwmjauslyqqucmov` (from your .env)
- **Project URL**: https://wmnfuwmjauslyqqucmov.supabase.co

## ✅ Good News
Your database is connected and tables exist! We just need to ensure all migrations are applied.

## 📝 Steps to Complete Setup

### Step 1: Login to Supabase CLI

Run this command and follow the browser prompts:

```bash
/tmp/supabase login
```

**What happens:**
- Opens browser for you to authorize
- You'll enter a verification code
- CLI gets authenticated

### Step 2: Link Your Project

```bash
cd /Users/mbjunaid/My\ Projects/ProjectOye/ProjectOye-UI/projectoyeui
/tmp/supabase link --project-ref wmnfuwmjauslyqqucmov
```

**What it does:**
- Connects your local project to remote Supabase
- Allows you to push/pull migrations

### Step 3: Push Migrations

```bash
/tmp/supabase db push
```

**What it does:**
- Applies any pending migrations to remote database
- Ensures all tables and functions are up to date

---

## Alternative: Quick Start with Auth Bypass

If you want to skip CLI and get started immediately:

### Option A: Create Account in App

1. The app should show a login/signup page (if auth is enabled)
2. Sign up with email
3. Create a project from the UI

### Option B: Use Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov/auth/users
2. Click "Add User" → Create a user
3. Then manually insert a project:
   - Go to: https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov/editor
   - Select `projects` table
   - Click "Insert row"
   - Fill in:
     - name: "My First Project"
     - code: "PROJ-001"
     - methodology: "hybrid"
     - status: "active"
   - Click Save

---

## 🎯 Recommended: Use CLI (Most Complete)

The CLI approach ensures everything is set up properly. Just run the three commands above!

Let me know if you encounter any errors during login or linking.
