# Release Notes - v1.0.0-audit-fix

## Summary
This release focuses on stabilizers, schema integrity, and wiring the final mock components to the backend.

## Key Changes

### 1. Schema & Data Integrity
- **Critical Fix**: Added missing `scenario_id` to `tasks` table definition in `types.ts`, unblocking scenario planning features.
- **Migration**: Added `support_tickets` table for the Contact Form.
- **Cleanup**: Removed unused `TaskGrid.tsx` component.

### 2. New Features
- **Contact Form**: The `ContactFormModal` is now fully wired to the Supabase `support_tickets` table. Submissions are persisted to the database.

### 3. Stability
- **Build**: Fixed syntax errors in `ChildPlansView.tsx` that were blocking production builds.
- **Type Safety**: Full `tsc` pass with zero errors.

## Deployment Instructions
1. Run the migration: `supabase/migrations/20260207_create_support_tickets.sql`.
2. Deploy the `dist/` folder to your hosting provider (Vercel, Netlify, etc.).
3. Ensure Supabase environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are set in the production environment.
