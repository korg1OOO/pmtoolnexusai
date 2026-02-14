# Database Migration Scripts

I've created automated scripts to push your migrations to Supabase. You have multiple options:

## Quick Start (Recommended)

```bash
npm run db:migrate
```

This will:
1. Read your `.env` file to get your Supabase project details
2. Link to your remote Supabase project
3. Push all migrations from `supabase/migrations/` to your database

## Available Commands

### Main Migration Command
```bash
npm run db:migrate          # Run the Node.js migration script
npm run db:migrate:sh       # Run the bash version (if you prefer)
```

### Individual Supabase Commands
```bash
npm run db:link             # Link to your Supabase project
npm run db:push             # Push migrations to remote database
npm run db:pull             # Pull schema from remote database
```

## What the Script Does

1. **Reads your `.env` file** to extract:
   - `VITE_SUPABASE_URL` → to get your project reference
   - Database credentials

2. **Links to your Supabase project**:
   - Project: `wmnfuwmjauslyqqucmov`

3. **Pushes all migrations** from `supabase/migrations/`:
   - Currently: `20260207_create_support_tickets.sql`

4. **Verifies success** and provides dashboard link

## First Time Setup

When you run the migration for the first time, you'll be prompted for your database password.

**Your database password** (from `.env`): `ZjcJszLxFbP4YiE3`

The CLI will remember this for future runs.

## Troubleshooting

**"Project already linked"** - This is fine, just means you've run it before.

**"Migration already applied"** - The migration was already run. This is safe.

**Permission errors** - Check that your Supabase credentials in `.env` are correct.

## Files Created

- `scripts/migrate-db.js` - Node.js migration script
- `scripts/migrate-db.sh` - Bash migration script
- Updated `package.json` with new npm scripts

## Next Steps

1. Run `npm run db:migrate` to apply the migration
2. Test your Contact Form to verify it works
3. Check the Supabase dashboard to see the new `support_tickets` table
