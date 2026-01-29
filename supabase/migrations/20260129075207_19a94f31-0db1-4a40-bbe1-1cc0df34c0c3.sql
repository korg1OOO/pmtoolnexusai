-- Add edit history support
ALTER TABLE public.project_messages 
ADD COLUMN edited_at timestamp with time zone,
ADD COLUMN edit_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN is_deleted boolean DEFAULT false,
ADD COLUMN deleted_at timestamp with time zone;

-- Create index for message search
CREATE INDEX idx_project_messages_content_search 
ON public.project_messages USING gin(to_tsvector('english', content));

-- Create index for deleted messages
CREATE INDEX idx_project_messages_deleted 
ON public.project_messages(project_id, is_deleted);