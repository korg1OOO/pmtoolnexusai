-- =====================================================
-- Chat & AI Agent Tables Migration
-- =====================================================

-- -------------------------------------------------------
-- CHAT CHANNELS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'dm')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- -------------------------------------------------------
-- CHAT MESSAGES (with JSONB reactions + thread support)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  user_email text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  reply_to uuid REFERENCES public.chat_messages(id),
  is_deleted boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  edited_at timestamptz,
  attachment_url text,
  attachment_name text,
  attachment_type text,
  attachment_size int,
  reactions jsonb DEFAULT '[]'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  reply_to_id uuid REFERENCES public.chat_messages(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON public.chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- -------------------------------------------------------
-- AI AGENTS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  icon text DEFAULT 'Bot',
  color text DEFAULT 'text-primary',
  system_prompt text,
  model_provider text DEFAULT 'openai',
  model_name text DEFAULT 'gpt-4',
  max_tokens int DEFAULT 2000,
  temperature numeric DEFAULT 0.7,
  is_active boolean DEFAULT true,
  version int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -------------------------------------------------------
-- AI AGENT CAPABILITIES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_agent_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  capability_key text NOT NULL,
  description text,
  requires_role text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- -------------------------------------------------------
-- AI AGENT SETTINGS (upsert-able key/value per agent)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, setting_key)
);

-- -------------------------------------------------------
-- AI AGENT VERSION HISTORY
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_agent_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  version int NOT NULL,
  system_prompt text,
  model_provider text,
  model_name text,
  is_active boolean DEFAULT false,
  performance_metrics jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- -------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_versions ENABLE ROW LEVEL SECURITY;

-- Chat channels: any authenticated user can read/create
CREATE POLICY "chat_channels_select" ON public.chat_channels
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "chat_channels_insert" ON public.chat_channels
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Chat messages: authenticated users can read all, only own user can insert/update
CREATE POLICY "chat_messages_select" ON public.chat_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_messages_update" ON public.chat_messages
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- AI Agents: anyone authenticated can read active agents; write requires service role (admin uses service_key)
CREATE POLICY "ai_agents_select" ON public.ai_agents
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ai_agents_all_authenticated" ON public.ai_agents
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "ai_agent_capabilities_select" ON public.ai_agent_capabilities
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ai_agent_capabilities_all" ON public.ai_agent_capabilities
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "ai_agent_settings_select" ON public.ai_agent_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ai_agent_settings_all" ON public.ai_agent_settings
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "ai_agent_versions_select" ON public.ai_agent_versions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ai_agent_versions_all" ON public.ai_agent_versions
  FOR ALL USING (auth.uid() IS NOT NULL);

-- -------------------------------------------------------
-- REALTIME
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

-- -------------------------------------------------------
-- SEED DEFAULT AI AGENTS
-- -------------------------------------------------------
INSERT INTO public.ai_agents (agent_type, label, description, icon, color, system_prompt, model_provider, model_name, max_tokens, temperature)
VALUES
  ('general',       'General Assistant',   'General purpose project assistant for Q&A and guidance',                     'Bot',          'text-primary',     'You are a helpful AI project management assistant. Help users understand their projects, answer questions, and provide guidance.',                                                      'openai', 'gpt-4', 2000, 0.7),
  ('scheduler',     'Scheduler',           'Scheduling, timeline, and calendar management specialist',                   'Calendar',     'text-blue-500',    'You are an expert in project scheduling and timeline management. Help users plan tasks, manage timelines, and resolve scheduling conflicts.',                                         'openai', 'gpt-4', 2000, 0.5),
  ('finance',       'Finance Agent',       'Budget analysis and financial management',                                   'DollarSign',   'text-green-500',   'You are a financial analysis expert for projects. Help with budget tracking, cost analysis, and financial forecasting.',                                                             'openai', 'gpt-4', 2000, 0.3),
  ('risk',          'Risk Agent',          'Risk identification, assessment, and mitigation planning',                   'AlertTriangle','text-orange-500',  'You are a risk management specialist. Help identify project risks, assess their impact and probability, and recommend mitigation strategies.',                                       'openai', 'gpt-4', 2000, 0.5),
  ('assignment',    'Assignment Agent',    'Resource allocation and team assignment optimization',                       'Users',        'text-purple-500',  'You are a resource management expert. Help allocate team members to tasks, optimize workloads, and manage team capacity.',                                                         'openai', 'gpt-4', 2000, 0.5),
  ('meeting',       'Meeting Agent',       'Meeting facilitation, minutes, and follow-up management',                   'Video',        'text-pink-500',    'You are a meeting management expert. Help schedule meetings, create agendas, capture minutes, and track action items.',                                                             'openai', 'gpt-4', 2000, 0.7),
  ('document',      'Document Agent',      'Document creation, editing, and knowledge base management',                 'FileText',     'text-indigo-500',  'You are a documentation specialist. Help create, organize, and improve project documentation, reports, and knowledge base articles.',                                             'openai', 'gpt-4', 2000, 0.7),
  ('insight',       'Insight Agent',       'Data-driven insights, trends, and actionable recommendations',              'Lightbulb',    'text-yellow-500',  'You are a data insights expert. Analyze project data, identify trends and patterns, and provide actionable recommendations.',                                                     'openai', 'gpt-4', 2000, 0.6),
  ('strategic',     'Strategic Agent',     'Strategic planning, OKRs, and long-term roadmap assistance',                'Target',       'text-red-500',     'You are a strategic planning expert. Help with OKR setting, strategic roadmaps, and aligning project goals with business objectives.',                                           'openai', 'gpt-4', 2000, 0.5),
  ('communication', 'Communication Agent', 'Stakeholder communication, updates, and reporting drafting',                'MessageCircle','text-cyan-500',    'You are a communications specialist. Help draft stakeholder updates, status reports, emails, and other project communications.',                                                   'openai', 'gpt-4', 2000, 0.8),
  ('system',        'System Agent',        'System-level operations, configuration, and technical assistance',          'Bot',          'text-muted-foreground', 'You are a technical system assistant. Help with application configuration, troubleshooting, and system-level queries.',                                                       'openai', 'gpt-4', 1000, 0.3),
  ('multi-agent',   'Multi-Agent',         'Orchestrates multiple specialized agents for complex queries',              'Network',      'text-primary',     'You are a multi-agent orchestrator. Coordinate responses from multiple specialized agents to provide comprehensive answers to complex questions.',                                  'openai', 'gpt-4', 4000, 0.5)
ON CONFLICT (agent_type) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  updated_at = now();
