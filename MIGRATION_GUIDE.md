# Manual Migration Application Guide

## Phase 2 & 5 Migrations Need Application

You need to apply two new migrations to Supabase:
1. **Phase 2**: Notifications table (20260212120000_notifications.sql)
2. **Phase 5**: AI Provider Settings tables (20260212130000_ai_provider_settings.sql)

---

## ✅ Recommended: Supabase Dashboard SQL Editor

This is the easiest and safest method:

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

### Step 2: Apply Notifications Migration
1. Open file: `supabase/migrations/20260212120000_notifications.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **"Run"**
5. Verify success message

### Step 3: Apply AI Provider Settings Migration
1. Open file: `supabase/migrations/20260212130000_ai_provider_settings.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **"Run"**
5. Verify success message

---

## Alternative: CLI with Service Role Key

If you have the Supabase service role key:

### Step 1: Update .env.local
Add these variables:
```bash
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 2: Run migration script
```bash
npx tsx scripts/apply-phase2-phase5-migrations.ts
```

---

## Verification

After applying, verify tables were created:

```sql
-- Check notifications table
SELECT * FROM notifications LIMIT 1;

-- Check AI provider settings tables  
SELECT * FROM ai_provider_settings LIMIT 1;
SELECT * FROM ai_provider_api_keys LIMIT 1;
```

---

## What These Migrations Create

### Notifications Table (Phase 2)
- Stores user notifications (SLA breaches, warnings, mentions, etc.)
- 7 notification types
- Related item tracking
- RLS policies for user-scoped access
- 3 performance indexes

### AI Provider Settings Tables (Phase 5)
- `ai_provider_settings`: User AI configuration (active provider, model, fallback)
- ` ai_provider_api_keys`: Encrypted API keys per provider
- RLS policies for user-scoped access
- Support for user-level and organization-level configs

---

## After Migration Complete

The frontend code is already wired and ready:
- `useNotifications` hook will work with `notifications` table
- `useAIProviderSettings` hook will work with AI settings tables
- No code changes needed!

---

## Need Help?

If you encounter errors during migration:
1. Check the error message in SQL Editor
2. Verify you're connected to the correct project
3. Ensure you have database admin privileges
4. Contact if persistent issues

Migration files are located at:
- `supabase/migrations/20260212120000_notifications.sql`
- `supabase/migrations/20260212130000_ai_provider_settings.sql`
