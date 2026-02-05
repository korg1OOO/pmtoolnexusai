-- Create chat_channels table
CREATE TABLE IF NOT EXISTS public.chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('public', 'private', 'dm')) DEFAULT 'public',
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    last_message_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Associate users with channels (for private/dm access)
CREATE TABLE IF NOT EXISTS public.chat_channel_members (
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (channel_id, user_id)
);

-- Create chat_messages table (Replaces the assumed project_messages)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT, -- Cache for performance/display if user deleted
    content TEXT,
    
    -- Attachments (flattened as per hook expectation, or could be JSONB)
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT,
    attachment_size BIGINT,
    
    -- Metadata
    reactions JSONB DEFAULT '[]'::jsonb,
    read_by JSONB DEFAULT '[]'::jsonb,
    edit_history JSONB DEFAULT '[]'::jsonb,
    
    reply_to UUID REFERENCES public.chat_messages(id),
    
    is_pinned BOOLEAN DEFAULT false,
    pinned_at TIMESTAMPTZ,
    pinned_by UUID REFERENCES auth.users(id),
    
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies

-- Chat Channels
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Everyone in a project can see public channels
CREATE POLICY "View public channels" ON public.chat_channels
    FOR SELECT USING (
        type = 'public' 
        -- AND project_id IN (SELECT project_id FROM user_projects WHERE user_id = auth.uid()) 
        -- Simplified for now as we might not have user_projects fully wired
    );

-- Members can see their private channels/DMs
CREATE POLICY "View private channels" ON public.chat_channels
    FOR SELECT USING (
        id IN (SELECT channel_id FROM public.chat_channel_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Create channels" ON public.chat_channels
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Channel Members
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View members" ON public.chat_channel_members
    FOR SELECT USING (
        channel_id IN (
            SELECT id FROM public.chat_channels WHERE type = 'public'
            UNION
            SELECT channel_id FROM public.chat_channel_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Join channels" ON public.chat_channel_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat Messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages" ON public.chat_messages
    FOR SELECT USING (
        channel_id IN (
            SELECT id FROM public.chat_channels WHERE type = 'public'
            UNION
            SELECT channel_id FROM public.chat_channel_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Insert messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own messages" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
