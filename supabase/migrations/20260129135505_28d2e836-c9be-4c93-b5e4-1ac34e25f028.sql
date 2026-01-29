-- Add embedded components support to presentation_slides table
ALTER TABLE public.presentation_slides 
ADD COLUMN IF NOT EXISTS embedded_components JSONB DEFAULT '[]'::jsonb;

-- Create active presentations tracking table for selective refresh
CREATE TABLE IF NOT EXISTS public.active_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on active_presentations
ALTER TABLE public.active_presentations ENABLE ROW LEVEL SECURITY;

-- RLS policies for active_presentations
CREATE POLICY "Users can view their own active presentation"
ON public.active_presentations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own active presentation"
ON public.active_presentations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active presentation"
ON public.active_presentations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own active presentation"
ON public.active_presentations
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_active_presentations_user_id ON public.active_presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_active_presentations_presentation_id ON public.active_presentations(presentation_id);

-- Enable realtime for active presentations
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_presentations;