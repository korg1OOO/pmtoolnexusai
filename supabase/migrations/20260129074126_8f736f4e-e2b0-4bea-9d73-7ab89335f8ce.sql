-- Add reactions column to project_messages (JSONB array of reaction objects)
ALTER TABLE public.project_messages
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;

-- Add index for faster reaction queries
CREATE INDEX IF NOT EXISTS idx_project_messages_reactions ON public.project_messages USING GIN (reactions);