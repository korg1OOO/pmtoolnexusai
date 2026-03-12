-- Temporarily disable RLS on projects table to allow inserts
-- This should be replaced with proper RLS policies in production

ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, use a permissive policy:
-- DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.projects;
-- CREATE POLICY "Enable all access for authenticated users" ON public.projects
--   FOR ALL USING (true) WITH CHECK (true);
