-- Phase 1: Multi-Agent AI System Database Schema

-- 1. Create project role enum
CREATE TYPE public.project_role AS ENUM ('admin', 'pm', 'lead', 'developer', 'analyst', 'viewer');

-- 2. Create user_roles table for RBAC
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles in their projects"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.project_id = user_roles.project_id
        AND ur.role = 'admin'
    )
  );

-- 3. Security definer function to get user role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID, p_project_id UUID)
RETURNS project_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM user_roles 
  WHERE user_id = p_user_id AND project_id = p_project_id
  LIMIT 1
$$;

-- 4. Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_project_role(p_user_id UUID, p_project_id UUID, p_role project_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
      AND project_id = p_project_id
      AND role = p_role
  )
$$;

-- 5. Create AI conversations table
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on ai_conversations
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.ai_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.ai_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.ai_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Create AI messages table
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on ai_messages
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_messages (through conversation ownership)
CREATE POLICY "Users can view messages in their conversations"
  ON public.ai_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = ai_messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON public.ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = ai_messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

-- 7. Create AI agent logs table for auditing
CREATE TABLE public.ai_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on ai_agent_logs
ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_agent_logs
CREATE POLICY "Users can view logs from their conversations"
  ON public.ai_agent_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = ai_agent_logs.conversation_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert logs"
  ON public.ai_agent_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 8. Enable realtime for ai_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;

-- 9. Add updated_at trigger for ai_conversations
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Add deferred policies for features table (from 20240522)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Admins can insert features' and tablename = 'features') then
    create policy "Admins can insert features" on public.features for insert with check (
        auth.role() = 'service_role' 
        or exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
    );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Admins can update features' and tablename = 'features') then
    create policy "Admins can update features" on public.features for update using (
        auth.role() = 'service_role' 
        or exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
    );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Admins can delete features' and tablename = 'features') then
    create policy "Admins can delete features" on public.features for delete using (
        auth.role() = 'service_role' 
        or exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
    );
  end if;
end
$$;