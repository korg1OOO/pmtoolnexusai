-- Add missing columns to lessons_learned
ALTER TABLE public.lessons_learned 
ADD COLUMN IF NOT EXISTS "votes" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'success',
ADD COLUMN IF NOT EXISTS "impact_level" text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS "phase" text DEFAULT 'Execution',
ADD COLUMN IF NOT EXISTS "submitted_by" uuid,
ADD COLUMN IF NOT EXISTS "submitted_by_name" text,
ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS "recommendations" text[] DEFAULT '{}'::text[];

-- Update RLS if necessary (migration 20260203152800 already enabled it)
