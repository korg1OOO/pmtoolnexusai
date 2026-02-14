# Local Supabase Setup Guide

## Installation

Since you don't have Homebrew installed, we're using npm to install Supabase CLI as a dev dependency:

```bash
npm install --save-dev supabase
```

## Running Supabase Commands

After installation, you can run Supabase CLI using npx:

```bash
npx supabase init
npx supabase start
npx supabase status
npx supabase stop
```

Or add scripts to your `package.json`:

```json
{
  "scripts": {
    "supabase:init": "supabase init",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:status": "supabase status"
  }
}
```

Then run:
```bash
npm run supabase:start
```

## Prerequisites

Before running `supabase start`, you need:
- **Docker Desktop** installed and running (download from https://www.docker.com/products/docker-desktop)

## Initial Setup

1. **Install Docker Desktop** (if not already installed)
2. **Start Docker Desktop**
3. **Initialize Supabase in your project:**
   ```bash
   npx supabase init
   ```
4. **Start local Supabase:**
   ```bash
   npx supabase start
   ```

This will start a local Supabase instance with:
- PostgreSQL database
- Studio UI (http://localhost:54323)
- API endpoints

## Applying Your Migrations

Once Supabase is running locally, apply your migrations:

```bash
npx supabase db reset
```

This will run all migrations in the `supabase/migrations/` folder.

## Environment Variables

Update your `.env.local` to point to the local Supabase instance:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<anon-key-from-supabase-start-output>
```

The anon key will be displayed when you run `npx supabase start`.
