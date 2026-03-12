-- Phase 1: AI Agent System Database Schema
-- This migration creates tables to store AI agent configurations dynamically
-- instead of hardcoding them in TypeScript files

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. AI Agents Table
-- ========================================
-- Core table storing all AI agent definitions
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT UNIQUE NOT NULL, -- 'scheduler', 'finance', 'risk', etc.
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL, -- Lucide icon name (e.g., 'Calendar', 'DollarSign')
  color TEXT NOT NULL, -- Tailwind color class (e.g., 'text-blue-500')
  
  -- AI Model Configuration
  system_prompt TEXT, -- Instructions for the AI model
  model_provider TEXT DEFAULT 'openai', -- 'openai', 'anthropic', 'google'
  model_name TEXT DEFAULT 'gpt-4', -- 'gpt-4', 'claude-3-opus', 'gemini-pro'
  max_tokens INTEGER DEFAULT 2000,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  
  -- Status & Versioning
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by type
CREATE INDEX IF NOT EXISTS idx_ai_agents_type ON public.ai_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_active ON public.ai_agents(is_active);

COMMENT ON TABLE public.ai_agents IS 'Dynamic AI agent configurations - replaces hardcoded AGENT_DISPLAY_INFO';
COMMENT ON COLUMN public.ai_agents.agent_type IS 'Unique identifier matching AgentType enum';
COMMENT ON COLUMN public.ai_agents.system_prompt IS 'AI instructions defining agent behavior and expertise';

-- ========================================
-- 2. AI Agent Capabilities Table
-- ========================================
-- Defines what each agent can do and who can use those capabilities
CREATE TABLE IF NOT EXISTS public.ai_agent_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  capability_key TEXT NOT NULL, -- 'SCHEDULE_EDIT', 'FINANCE_VIEW', etc.
  description TEXT,
  requires_role TEXT[] DEFAULT ARRAY['pm', 'admin'], -- Roles that can use this capability
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agent_id, capability_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_capabilities_agent ON public.ai_agent_capabilities(agent_id);

COMMENT ON TABLE public.ai_agent_capabilities IS 'Permission-based capabilities for each AI agent';
COMMENT ON COLUMN public.ai_agent_capabilities.requires_role IS 'Array of user roles that can invoke this capability';

-- ========================================
-- 3. AI Agent Settings Table
-- ========================================
-- Flexible key-value storage for agent-specific configuration
CREATE TABLE IF NOT EXISTS public.ai_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL, -- Flexible JSON storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agent_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_settings_agent ON public.ai_agent_settings(agent_id);

COMMENT ON TABLE public.ai_agent_settings IS 'Flexible configuration settings for AI agents';
COMMENT ON COLUMN public.ai_agent_settings.setting_value IS 'JSON blob for any agent-specific config';

-- ========================================
-- 4. AI Agent Versions Table
-- ========================================
-- Track different versions of agents for A/B testing and rollback
CREATE TABLE IF NOT EXISTS public.ai_agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  system_prompt TEXT,
  model_provider TEXT,
  model_name TEXT,
  is_active BOOLEAN DEFAULT false, -- Only one version should be active
  performance_metrics JSONB DEFAULT '{}', -- Success rate, avg response time, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(agent_id, version)
);

CREATE INDEX IF NOT EXISTS idx_ai_versions_agent ON public.ai_agent_versions(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_versions_active ON public.ai_agent_versions(agent_id, is_active);

COMMENT ON TABLE public.ai_agent_versions IS 'Version history for A/B testing and rollback';
COMMENT ON COLUMN public.ai_agent_versions.performance_metrics IS 'Tracks success rate, response time, user satisfaction';

-- ========================================
-- 5. Enable Row Level Security (RLS)
-- ========================================
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_versions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. RLS Policies
-- ========================================

-- Anyone can view active agents
CREATE POLICY "Anyone can view active AI agents"
  ON public.ai_agents FOR SELECT
  USING (is_active = true);

-- Admins can manage all agents
CREATE POLICY "Admins can manage AI agents"
  ON public.ai_agents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Anyone can view capabilities of active agents
CREATE POLICY "Anyone can view AI agent capabilities"
  ON public.ai_agent_capabilities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE id = ai_agent_capabilities.agent_id
      AND is_active = true
    )
  );

-- Admins can manage capabilities
CREATE POLICY "Admins can manage AI agent capabilities"
  ON public.ai_agent_capabilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Similar policies for settings
CREATE POLICY "Anyone can view AI agent settings"
  ON public.ai_agent_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE id = ai_agent_settings.agent_id
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage AI agent settings"
  ON public.ai_agent_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Similar policies for versions
CREATE POLICY "Anyone can view AI agent versions"
  ON public.ai_agent_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents
      WHERE id = ai_agent_versions.agent_id
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage AI agent versions"
  ON public.ai_agent_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ========================================
-- 7. Seed Data - Migrate Hardcoded Agents
-- ========================================
-- Insert the 11 existing hardcoded agents from types/ai-agents.ts

INSERT INTO public.ai_agents (agent_type, label, description, icon, color, system_prompt, model_provider, model_name) VALUES
  (
    'scheduler',
    'Scheduler',
    'Manages project schedules, timelines, dependencies, and critical path analysis',
    'Calendar',
    'text-blue-500',
    'You are a project scheduling assistant specializing in timeline planning, dependency management, and critical path analysis. Help users optimize schedules, identify bottlenecks, and maintain realistic project timelines. Provide actionable recommendations for schedule improvements.',
    'openai',
    'gpt-4'
  ),
  (
    'finance',
    'Finance',
    'Handles budget analysis, cost tracking, variance analysis, and financial forecasting',
    'DollarSign',
    'text-green-500',
    'You are a financial analyst assistant for project management. Analyze budgets, track costs, identify variances, and provide forecasts. Help users understand financial health, optimize spending, and make data-driven budget decisions.',
    'openai',
    'gpt-4'
  ),
  (
    'risk',
    'Risk',
    'Identifies, analyzes, and provides mitigation strategies for project risks',
    'AlertTriangle',
    'text-orange-500',
    'You are a risk management specialist. Identify potential project risks, assess probability and impact, suggest mitigation strategies, and track risk exposure. Help users proactively manage uncertainties and maintain contingency plans.',
    'openai',
    'gpt-4'
  ),
  (
    'assignment',
    'Assignment',
    'Manages resource allocation, workload balancing, and task assignments',
    'Users',
    'text-purple-500',
    'You are a resource management assistant. Optimize team assignments based on skills, availability, workload, and capacity. Help balance work distribution, identify overallocation, and suggest efficient resource utilization.',
    'openai',
    'gpt-4'
  ),
  (
    'meeting',
    'Meeting',
    'Handles meeting management, agenda generation, note-taking, and action items',
    'Video',
    'text-pink-500',
    'You are a meeting assistant. Generate agendas, take notes, extract action items, summarize discussions, and track follow-ups. Help make meetings productive and ensure clear outcomes.',
    'openai',
    'gpt-4'
  ),
  (
    'document',
    'Document',
    'Generates reports, analyzes documents, and extracts key information',
    'FileText',
    'text-indigo-500',
    'You are a documentation specialist. Generate project reports, analyze documents, extract key information, summarize content, and maintain documentation quality. Help create clear, professional documentation.',
    'openai',
    'gpt-4'
  ),
  (
    'insight',
    'Insight',
    'Provides data insights, identifies patterns, and offers recommendations',
    'Lightbulb',
    'text-yellow-500',
    'You are an insights analyst. Identify patterns in project data, surface trends, provide data-driven recommendations, and highlight important metrics. Help users make informed decisions based on project analytics.',
    'anthropic',
    'claude-3-opus'
  ),
  (
    'strategic',
    'Strategic',
    'Handles portfolio-level planning, strategic alignment, and executive insights',
    'Target',
    'text-red-500',
    'You are a strategic advisor for portfolio and program management. Provide portfolio-level insights, strategic recommendations, alignment analysis, and executive summaries. Help optimize portfolio value and strategic outcomes.',
    'anthropic',
    'claude-3-opus'
  ),
  (
    'communication',
    'Communication',
    'Analyzes team communication, tracks sentiment, and identifies collaboration patterns',
    'MessageCircle',
    'text-cyan-500',
    'You are a communication analyst. Analyze team messages, track sentiment, identify collaboration patterns, surface communication issues, and provide recommendations for better team dynamics.',
    'google',
    'gemini-pro'
  ),
  (
    'system',
    'System',
    'General-purpose assistant for miscellaneous queries and information',
    'Bot',
    'text-muted-foreground',
    'You are a general project management assistant. Answer questions, provide helpful information, guide users, and handle miscellaneous queries. Be helpful, clear, and concise.',
    'openai',
    'gpt-4-turbo'
  ),
  (
    'multi-agent',
    'Multi-Agent',
    'Coordinates multiple specialized agents to solve complex multi-faceted problems',
    'Network',
    'text-primary',
    'You coordinate multiple specialized AI agents to solve complex, multi-faceted problems. Analyze user requests, determine which agents to involve, orchestrate their collaboration, and synthesize their outputs into cohesive solutions.',
    'openai',
    'gpt-4'
  )
ON CONFLICT (agent_type) DO NOTHING;

-- ========================================
-- 8. Seed Agent Capabilities
-- ========================================
-- Define capabilities for each agent

DO $$
DECLARE
  agent_record RECORD;
BEGIN
  -- Scheduler Agent Capabilities
  SELECT id INTO agent_record FROM public.ai_agents WHERE agent_type = 'scheduler';
  IF FOUND THEN
    INSERT INTO public.ai_agent_capabilities (agent_id, capability_key, description, requires_role) VALUES
      (agent_record.id, 'SCHEDULE_QUERY', 'Query and view project schedules', ARRAY['developer', 'pm', 'admin']),
      (agent_record.id, 'SCHEDULE_EDIT', 'Modify project schedules and timelines', ARRAY['pm', 'admin']),
      (agent_record.id, 'CRITICAL_PATH', 'Analyze critical path and dependencies', ARRAY['pm', 'admin'])
    ON CONFLICT (agent_id, capability_key) DO NOTHING;
  END IF;

  -- Finance Agent Capabilities
  SELECT id INTO agent_record FROM public.ai_agents WHERE agent_type = 'finance';
  IF FOUND THEN
    INSERT INTO public.ai_agent_capabilities (agent_id, capability_key, description, requires_role) VALUES
      (agent_record.id, 'FINANCE_VIEW', 'View financial data and reports', ARRAY['pm', 'admin']),
      (agent_record.id, 'BUDGET_ANALYSIS', 'Analyze budgets and variances', ARRAY['pm', 'admin']),
      (agent_record.id, 'FORECAST', 'Generate financial forecasts', ARRAY['pm', 'admin'])
    ON CONFLICT (agent_id, capability_key) DO NOTHING;
  END IF;

  -- Risk Agent Capabilities
  SELECT id INTO agent_record FROM public.ai_agents WHERE agent_type = 'risk';
  IF FOUND THEN
    INSERT INTO public.ai_agent_capabilities (agent_id, capability_key, description, requires_role) VALUES
      (agent_record.id, 'RISK_IDENTIFY', 'Identify potential project risks', ARRAY['developer', 'pm', 'admin']),
      (agent_record.id, 'RISK_ASSESS', 'Assess risk probability and impact', ARRAY['pm', 'admin']),
      (agent_record.id, 'RISK_MITIGATE', 'Suggest mitigation strategies', ARRAY['pm', 'admin'])
    ON CONFLICT (agent_id, capability_key) DO NOTHING;
  END IF;

  -- Assignment Agent Capabilities
  SELECT id INTO agent_record FROM public.ai_agents WHERE agent_type = 'assignment';
  IF FOUND THEN
    INSERT INTO public.ai_agent_capabilities (agent_id, capability_key, description, requires_role) VALUES
      (agent_record.id, 'RESOURCE_VIEW', 'View resource allocation', ARRAY['developer', 'pm', 'admin']),
      (agent_record.id, 'RESOURCE_ASSIGN', 'Assign tasks to team members', ARRAY['pm', 'admin']),
      (agent_record.id, 'WORKLOAD_BALANCE', 'Balance team workload', ARRAY['pm', 'admin'])
    ON CONFLICT (agent_id, capability_key) DO NOTHING;
  END IF;

  -- Meeting Agent Capabilities
  SELECT id INTO agent_record FROM public.ai_agents WHERE agent_type = 'meeting';
  IF FOUND THEN
    INSERT INTO public.ai_agent_capabilities (agent_id, capability_key, description, requires_role) VALUES
      (agent_record.id, 'MEETING_CREATE', 'Create and schedule meetings', ARRAY['developer', 'pm', 'admin']),
      (agent_record.id, 'MEETING_NOTES', 'Generate meeting notes and summaries', ARRAY['developer', 'pm', 'admin']),
      (agent_record.id, 'ACTION_ITEMS', 'Extract and track action items', ARRAY['developer', 'pm', 'admin'])
    ON CONFLICT (agent_id, capability_key) DO NOTHING;
  END IF;

  -- Document Agent Capabilities
  SELECT id INTO agent_record FROM public.ai_agents WHERE agent_type = 'document';
  IF FOUND THEN
    INSERT INTO public.ai_agent_capabilities (agent_id, capability_key, description, requires_role) VALUES
      (agent_record.id, 'DOC_GENERATE', 'Generate project documents', ARRAY['pm', 'admin']),
      (agent_record.id, 'DOC_ANALYZE', 'Analyze and summarize documents', ARRAY['developer', 'pm', 'admin']),
      (agent_record.id, 'DOC_EXTRACT', 'Extract key information from docs', ARRAY['developer', 'pm', 'admin'])
    ON CONFLICT (agent_id, capability_key) DO NOTHING;
  END IF;

  -- Add capabilities for remaining agents...
  -- (Insight, Strategic, Communication, System, Multi-Agent)
  -- Each with appropriate permissions
  
END $$;

-- ========================================
-- 9. Update Trigger for updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_agents_updated_at
  BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_agent_settings_updated_at
  BEFORE UPDATE ON public.ai_agent_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 10. Verification Queries
-- ========================================
-- Run these to verify the migration worked:
-- SELECT COUNT(*) FROM public.ai_agents; -- Should return 11
-- SELECT agent_type, label, is_active FROM public.ai_agents ORDER BY agent_type;
-- SELECT COUNT(*) FROM public.ai_agent_capabilities; -- Should return 18+
