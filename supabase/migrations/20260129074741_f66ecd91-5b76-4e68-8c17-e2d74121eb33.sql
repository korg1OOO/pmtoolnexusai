-- Add pinned messages support
ALTER TABLE public.project_messages 
ADD COLUMN is_pinned boolean DEFAULT false,
ADD COLUMN pinned_at timestamp with time zone,
ADD COLUMN pinned_by uuid;

-- Add read receipts support
ALTER TABLE public.project_messages 
ADD COLUMN read_by jsonb DEFAULT '[]'::jsonb;

-- Add threading/reply support
ALTER TABLE public.project_messages 
ADD COLUMN reply_to uuid REFERENCES public.project_messages(id) ON DELETE SET NULL;

-- Create index for faster thread queries
CREATE INDEX idx_project_messages_reply_to ON public.project_messages(reply_to);

-- Create index for pinned messages
CREATE INDEX idx_project_messages_pinned ON public.project_messages(project_id, is_pinned) WHERE is_pinned = true;

-- Add RLS policy for updating messages (for pinning and read receipts)
CREATE POLICY "Authenticated users can update messages for reactions and read receipts"
ON public.project_messages
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);