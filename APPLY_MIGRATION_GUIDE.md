# Apply Migration to Remote Supabase

Your Supabase Project: **wmnfuwmjauslyqqucmov**

## Option 1: Via Supabase Dashboard (Easiest)

1. **Go to your Supabase Dashboard:**
   https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov

2. **Navigate to SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste this SQL:**

```sql
create table if not exists public.support_tickets (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  name text not null,
  email text not null,
  subject text null,
  message text not null,
  status text not null default 'new'::text,
  constraint support_tickets_pkey primary key (id)
);

alter table public.support_tickets enable row level security;

create policy "Enable insert for authenticated users only"
on "public"."support_tickets"
as PERMISSIVE
for INSERT
to authenticated
with check (true);

create policy "Enable insert for anon users (Simulated Public)"
on "public"."support_tickets"
as PERMISSIVE
for INSERT
to anon
with check (true);

create policy "Enable read for authenticated users only"
on "public"."support_tickets"
as PERMISSIVE
for SELECT
to authenticated
using (true);
```

4. **Click "Run" or press Cmd+Enter**

5. **Verify the table was created:**
   - Go to "Table Editor" in the sidebar
   - You should see `support_tickets` in the list

## Option 2: Via Supabase CLI

If you want to use the CLI to link your project and push migrations:

```bash
# Link your local project to remote Supabase
npx supabase link --project-ref wmnfuwmjauslyqqucmov

# Push the migration
npx supabase db push
```

You'll be prompted for your database password (from your .env):
**Password:** `ZjcJszLxFbP4YiE3`

## Verification

After applying the migration, test your Contact Form:

1. Start your dev server: `npm run dev`
2. Open the app and try submitting the contact form
3. Check the Supabase Dashboard → Table Editor → `support_tickets` to see the submitted data

## Troubleshooting

If you get "table already exists" error, that's fine - it means the table is already there.

If you get permission errors, verify your RLS policies are correctly applied by checking the "Authentication" → "Policies" section in the dashboard.
