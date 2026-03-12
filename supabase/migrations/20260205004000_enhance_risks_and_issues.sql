-- Add missing columns to risks
ALTER TABLE public.risks
ADD COLUMN IF NOT EXISTS triggers TEXT,
ADD COLUMN IF NOT EXISTS linked_items JSONB DEFAULT '[]'::jsonb;

-- Add missing columns to issues
ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS key TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS linked_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT false;

-- Create index on issues key
CREATE INDEX IF NOT EXISTS idx_issues_key ON public.issues(key);
