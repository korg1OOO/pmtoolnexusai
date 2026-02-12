# Database Migration Deployment Guide

## Migration File
`supabase/migrations/20260212300000_email_template_management.sql`

## Option 1: Install Supabase CLI (Recommended)

### Install via Homebrew (macOS):
```bash
brew install supabase/tap/supabase
```

### Then run migration:
```bash
cd /Users/mbjunaid/My\ Projects/ProjectOye/ProjectOye-UI/projectoyeui
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

---

## Option 2: Manual SQL Execution (Quick)

### Steps:
1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to: **SQL Editor** (left sidebar)
4. Click "New Query"
5. Copy the contents of: `supabase/migrations/20260212300000_email_template_management.sql`
6. Paste into the editor
7. Click "Run" (or press Cmd/Ctrl + Enter)

---

## Option 3: Using Supabase Migration UI

### Steps:
1. Go to Supabase Dashboard
2. Navigate to: **Database** → **Migrations**
3. Create new migration
4. Paste the SQL content
5. Apply migration

---

## Verification After Migration

Run this query to verify tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'email_templates_admin',
  'email_template_versions',
  'imap_accounts',
  'imap_presets',
  'notification_analytics',
  'notification_channels'
);
```

Should return 6 rows.

---

## Next: Deploy Edge Function

After database migration succeeds:

```bash
# Install CLI first, then:
supabase functions deploy notification-scheduler
```

Or manually upload in Supabase Dashboard → Edge Functions.
