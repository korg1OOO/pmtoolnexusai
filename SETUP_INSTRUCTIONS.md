# 🚀 Quick Setup Guide - Apply Database Migrations

Your app shows a blank page because the database tables don't exist yet. Follow these steps to fix it:

## Step 1: Apply Migrations via Supabase Dashboard

1. **Go to Supabase SQL Editor:**
   👉 https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov/sql/new

2. **Run this combined migration script:**
   - Copy the contents of `supabase/migrations/COMBINED_MIGRATION.sql` (I'm creating this for you)
   - Paste it into the SQL Editor
   - Click "Run"

## Step 2: Seed Initial Data

After migrations complete, run:

```bash
npx tsx scripts/seed-project.ts
```

## Step 3: Refresh Your App

Open http://localhost:8080 and you should see the dashboard! 🎉

---

## Alternative: Use Supabase CLI (Requires Login)

If you prefer using CLI:

```bash
# Login to Supabase
/tmp/supabase login

# Link your project
/tmp/supabase link --project-ref wmnfuwmjauslyqqucmov

# Push migrations
/tmp/supabase db push
```

---

## Current Setup (No Changes Needed)

- ✅ Remote Supabase: `https://wmnfuwmjauslyqqucmov.supabase.co`
- ✅ Local dev server: `http://localhost:8080`
- ✅ All working together!

You're using **remote database with local development** - this is the standard setup and doesn't require Docker.
