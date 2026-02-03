# 🆕 Create a New Supabase Database - Quick Guide

## Step 1: Create Supabase Project (5 minutes)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```
   - Log in (or sign up if you don't have an account)

2. **Click "New Project"**
   
3. **Fill in the form**:
   - **Name**: `ProjectOye` (or any name you prefer)
   - **Database Password**: Create a strong password
     - **Important**: Save this password somewhere safe!
   - **Region**: Choose closest to your location
     - US: `US West (Oregon)`
     - Europe: `Europe (Frankfurt)`
     - Asia: `Asia Pacific (Singapore)`
   - **Pricing Plan**: Free (sufficient to start)

4. **Click "Create new project"**
   - Wait 2-3 minutes while Supabase sets up your database
   - You'll see a progress indicator

5. **Once ready, get your credentials**:
   - Go to: **Settings** → **API**
   - Copy these values:
     - **Project URL** (example: `https://abcdefgh.supabase.co`)
     - **Project Reference ID** (example: `abcdefgh`)
     - **anon public** key (long string starting with `eyJ...`)

---

## Step 2: Update Your Local Configuration (1 minute)

Open the file `.env` in your project and update it:

```env
VITE_SUPABASE_PROJECT_ID="<paste-your-project-reference-id>"
VITE_SUPABASE_PUBLISHABLE_KEY="<paste-your-anon-public-key>"
VITE_SUPABASE_URL="<paste-your-project-url>"
```

**Save the file**.

---

## Step 3: Apply Database Migrations (5 minutes)

You have two options:

### Option A: Using CLI (Recommended)

```bash
# 1. Login (if not already logged in)
/tmp/supabase login

# 2. Link to your new project
cd /Users/mbjunaid/My\ Projects/ProjectOye/ProjectOye-UI/projectoyeui
/tmp/supabase link --project-ref <your-project-reference-id>

# Enter your database password when prompted

# 3. Push all migrations
/tmp/supabase db push
```

### Option B: Using SQL Editor

1. Go to: `https://supabase.com/dashboard/project/<your-project-id>/sql/new`
2. Copy the entire content from: `supabase/migrations/COMBINED_MIGRATION.sql`
3. Paste into the SQL Editor
4. Click "Run" (may take 1-2 minutes)

---

## Step 4: Create Initial Project (2 minutes)

### Option A: Via Dashboard (Easiest)

1. Go to: `https://supabase.com/dashboard/project/<your-project-id>/editor`
2. Click on `projects` table
3. Click "Insert" → "Insert row"
4. Fill in:
   ```
   name: Sample Digital Project
   code: DIG-001
   methodology: hybrid
   status: active
   health: green
   start_date: 2026-02-03
   end_date: 2026-05-03
   budget: 100000
   spent: 25000
   progress: 25
   ```
5. Click "Save"

### Option B: Run Seed Script

```bash
npx tsx scripts/seed-project.ts
```

---

## Step 5: Restart and Test (1 minute)

1. **Restart your dev server**:
   ```bash
   # Press Ctrl+C in the terminal running npm run dev
   # Then run again:
   npm run dev
   ```

2. **Open your app**:
   ```
   http://localhost:8080
   ```

3. **You should see**:
   - ✅ Dashboard with your project
   - ✅ No blank page
   - ✅ No errors in console

---

## 🎉 Done!

Your app is now running with a fresh Supabase database!

## ❓ Troubleshooting

**Still seeing blank page?**
- Check browser console (Cmd+Option+J) for errors
- Verify `.env` file has correct credentials
- Make sure dev server was restarted after updating `.env`

**Migrations failed?**
- Check if you entered the correct database password
- Try Option B (SQL Editor) instead

**Need help?**
- Share the error message you're seeing
- I'll help you debug!
