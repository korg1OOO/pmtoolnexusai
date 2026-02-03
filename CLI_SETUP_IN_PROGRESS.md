# 🔧 CLI Setup in Progress - Follow These Steps

## Step 1: Complete Browser Authentication ⏳

A browser window should have opened. If not, use this link:
```
https://supabase.com/dashboard/cli/login?session_id=6f62d5b7-c022-4eb6-bb94-c8b1e076689c&token_name=cli_mbjunaid@mbjunaid-mac_1770131540&public_key=04e4bcdc1fb320de53c682a6e9047264ba993e6bff512590f612082455e5aec07d68146b1c8feac91766db7b9dfa3a0bbaf2a010df438c41277cb814a8bf9e0759
```

**What to do:**
1. Log in to your Supabase account (or create one)
2. Authorize the CLI
3. You'll receive a **verification code**
4. Copy that code

**Then in your terminal:**
- Paste the verification code where it says "Enter your verification code:"
- Press Enter

---

## Step 2: Create New Supabase Project 🆕

**IMPORTANT**: The CLI cannot create projects. You must create via Dashboard.

While the CLI is authenticating, open a new tab:

1. **Go to**: https://supabase.com/dashboard/projects
2. **Click**: "New Project"
3. **Fill in**:
   - Name: `ProjectOye` (or your choice)
   - Database Password: **CREATE AND SAVE THIS PASSWORD!**
   - Region: Choose closest to you
4. **Click**: "Create new project"
5. **Wait**: 2-3 minutes for provisioning

---

## Step 3: Get New Project Credentials 📋

Once your new project is ready:

1. **Copy Project Reference ID**:
   - It's in the URL: `https://supabase.com/dashboard/project/XXXXX`
   - The `XXXXX` part is your project reference ID

2. **Go to Settings → API**:
   - Copy **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - Copy **anon public** key

3. **Update your `.env` file**:
   ```env
   VITE_SUPABASE_PROJECT_ID="<new-project-ref-id>"
   VITE_SUPABASE_PUBLISHABLE_KEY="<new-anon-key>"
   VITE_SUPABASE_URL="<new-project-url>"
   ```

---

## Step 4: Link CLI to Your New Project 🔗

Once CLI login is complete, run:

```bash
cd /Users/mbjunaid/My\ Projects/ProjectOye/ProjectOye-UI/projectoyeui
/tmp/supabase link --project-ref <your-new-project-ref-id>
```

When prompted:
- Enter the **database password** you created in Step 2

---

## Step 5: Push Migrations 🚀

```bash
/tmp/supabase db push
```

This will:
- Apply all 30 migration files
- Create all tables
- Set up Row Level Security
- Create database functions

---

## Step 6: Seed Data 🌱

```bash
npx tsx scripts/seed-project.ts
```

This creates a sample project.

---

## Step 7: Restart and Test ✅

```bash
# Restart dev server
npm run dev

# Open app
open http://localhost:8080
```

---

## 🎯 Current Status

✅ Supabase CLI login started
⏳ Waiting for you to:
   1. Complete browser authentication
   2. Enter verification code in terminal
   3. Create new project via dashboard
   4. Continue with Steps 4-7 above

---

## ❓ Need Help?

- **Login not working?** Try canceling (Ctrl+C) and running `/tmp/supabase login` again
- **Browser didn't open?** Use the link above manually
- **Verification code issues?** Make sure you log in to the correct Supabase account

I'm here to help if you hit any snags! 🚀
