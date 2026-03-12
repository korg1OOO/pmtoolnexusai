-- Create task types enum
CREATE TYPE public.task_type AS ENUM ('task', 'milestone', 'summary');

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('not-started', 'in-progress', 'completed', 'blocked', 'on-hold');

-- Create priority enum
CREATE TYPE public.priority_level AS ENUM ('critical', 'high', 'medium', 'low');

-- Create dependency type enum
CREATE TYPE public.dependency_type AS ENUM ('FS', 'SS', 'FF', 'SF');

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  methodology TEXT NOT NULL DEFAULT 'hybrid' CHECK (methodology IN ('waterfall', 'agile', 'hybrid')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on-hold', 'completed', 'cancelled')),
  health TEXT NOT NULL DEFAULT 'green' CHECK (health IN ('green', 'amber', 'red')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  budget DECIMAL(15,2) DEFAULT 0,
  spent DECIMAL(15,2) DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  wbs TEXT NOT NULL,
  name TEXT NOT NULL,
  type public.task_type NOT NULL DEFAULT 'task',
  status public.task_status NOT NULL DEFAULT 'not-started',
  priority public.priority_level NOT NULL DEFAULT 'medium',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration INTEGER NOT NULL DEFAULT 1 CHECK (duration >= 0),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  assignee_id UUID REFERENCES auth.users(id),
  is_critical BOOLEAN DEFAULT FALSE,
  notes TEXT,
  expanded BOOLEAN DEFAULT TRUE,
  level INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dependencies table
CREATE TABLE public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  predecessor_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  type public.dependency_type NOT NULL DEFAULT 'FS',
  lag INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, predecessor_id)
);

-- Create baselines table
CREATE TABLE public.task_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  baseline_name TEXT NOT NULL DEFAULT 'Baseline 1',
  baseline_start DATE NOT NULL,
  baseline_end DATE NOT NULL,
  baseline_duration INTEGER NOT NULL,
  baseline_cost DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project baselines table for full project snapshots
CREATE TABLE public.project_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  baseline_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_baselines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects (for now, allow all authenticated users to CRUD)
CREATE POLICY "Users can view all projects" ON public.projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update projects" ON public.projects
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete projects" ON public.projects
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- RLS Policies for tasks
CREATE POLICY "Users can view all tasks" ON public.tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete tasks" ON public.tasks
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for dependencies
CREATE POLICY "Users can view all dependencies" ON public.task_dependencies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create dependencies" ON public.task_dependencies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update dependencies" ON public.task_dependencies
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete dependencies" ON public.task_dependencies
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for task baselines
CREATE POLICY "Users can view all task baselines" ON public.task_baselines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create task baselines" ON public.task_baselines
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can delete task baselines" ON public.task_baselines
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for project baselines
CREATE POLICY "Users can view all project baselines" ON public.project_baselines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create project baselines" ON public.project_baselines
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can delete project baselines" ON public.project_baselines
  FOR DELETE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_parent_id ON public.tasks(parent_id);
CREATE INDEX idx_tasks_sort_order ON public.tasks(project_id, sort_order);
CREATE INDEX idx_task_dependencies_task_id ON public.task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_predecessor_id ON public.task_dependencies(predecessor_id);
CREATE INDEX idx_task_baselines_task_id ON public.task_baselines(task_id);
CREATE INDEX idx_project_baselines_project_id ON public.project_baselines(project_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to recalculate task duration based on dates
CREATE OR REPLACE FUNCTION public.calculate_task_duration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.duration = GREATEST(1, (NEW.end_date - NEW.start_date));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_task_duration_trigger
  BEFORE INSERT OR UPDATE OF start_date, end_date ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_task_duration();

-- Create function to get hierarchical tasks
CREATE OR REPLACE FUNCTION public.get_project_tasks_hierarchical(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  parent_id UUID,
  wbs TEXT,
  name TEXT,
  type public.task_type,
  status public.task_status,
  priority public.priority_level,
  start_date DATE,
  end_date DATE,
  duration INTEGER,
  progress INTEGER,
  assignee_id UUID,
  is_critical BOOLEAN,
  notes TEXT,
  expanded BOOLEAN,
  level INTEGER,
  sort_order INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE task_tree AS (
    SELECT t.*, 0 as tree_level
    FROM public.tasks t
    WHERE t.project_id = p_project_id AND t.parent_id IS NULL
    
    UNION ALL
    
    SELECT t.*, tt.tree_level + 1
    FROM public.tasks t
    INNER JOIN task_tree tt ON t.parent_id = tt.id
  )
  SELECT 
    tt.id, tt.project_id, tt.parent_id, tt.wbs, tt.name, tt.type,
    tt.status, tt.priority, tt.start_date, tt.end_date, tt.duration,
    tt.progress, tt.assignee_id, tt.is_critical, tt.notes, tt.expanded,
    tt.tree_level as level, tt.sort_order, tt.created_at, tt.updated_at
  FROM task_tree tt
  ORDER BY tt.sort_order, tt.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_dependencies;-- =============================================
-- MS PROJECT FEATURE ENHANCEMENT - PHASE 1
-- =============================================

-- New enums for constraint types and resource types
CREATE TYPE constraint_type AS ENUM ('ASAP', 'ALAP', 'MSO', 'MFO', 'SNET', 'SNLT', 'FNET', 'FNLT');
CREATE TYPE resource_type AS ENUM ('work', 'material', 'cost');
CREATE TYPE cost_accrual AS ENUM ('start', 'end', 'prorated');

-- =============================================
-- PROJECT CALENDARS
-- =============================================
CREATE TABLE public.project_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Standard',
  is_default BOOLEAN NOT NULL DEFAULT false,
  working_days JSONB NOT NULL DEFAULT '{"mon": true, "tue": true, "wed": true, "thu": true, "fri": true, "sat": false, "sun": false}',
  work_hours JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "17:00", "hours_per_day": 8}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calendar exceptions (holidays, special working days)
CREATE TABLE public.calendar_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID NOT NULL REFERENCES public.project_calendars(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exception_type TEXT NOT NULL DEFAULT 'holiday', -- 'holiday' or 'working'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  work_hours JSONB, -- null for non-working, or custom hours
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- RESOURCES
-- =============================================
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  type resource_type NOT NULL DEFAULT 'work',
  max_units NUMERIC NOT NULL DEFAULT 1.0, -- 1.0 = 100%
  standard_rate NUMERIC NOT NULL DEFAULT 0,
  overtime_rate NUMERIC NOT NULL DEFAULT 0,
  cost_per_use NUMERIC NOT NULL DEFAULT 0,
  calendar_id UUID REFERENCES public.project_calendars(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- RESOURCE ASSIGNMENTS
-- =============================================
CREATE TABLE public.resource_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  units NUMERIC NOT NULL DEFAULT 1.0, -- allocation percentage (1.0 = 100%)
  work_hours NUMERIC NOT NULL DEFAULT 0, -- planned work
  actual_work_hours NUMERIC NOT NULL DEFAULT 0, -- completed work
  remaining_work_hours NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  cost NUMERIC NOT NULL DEFAULT 0,
  actual_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, resource_id)
);

-- =============================================
-- EXTEND TASKS TABLE
-- =============================================

-- Constraint columns
ALTER TABLE public.tasks ADD COLUMN constraint_type constraint_type DEFAULT 'ASAP';
ALTER TABLE public.tasks ADD COLUMN constraint_date DATE;
ALTER TABLE public.tasks ADD COLUMN deadline DATE;

-- Work/effort columns
ALTER TABLE public.tasks ADD COLUMN work_hours NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN actual_work_hours NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN remaining_work_hours NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN effort_driven BOOLEAN DEFAULT false;

-- Cost columns
ALTER TABLE public.tasks ADD COLUMN cost NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN actual_cost NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN fixed_cost NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN fixed_cost_accrual cost_accrual DEFAULT 'prorated';

-- CPM/Scheduling columns
ALTER TABLE public.tasks ADD COLUMN early_start DATE;
ALTER TABLE public.tasks ADD COLUMN early_finish DATE;
ALTER TABLE public.tasks ADD COLUMN late_start DATE;
ALTER TABLE public.tasks ADD COLUMN late_finish DATE;
ALTER TABLE public.tasks ADD COLUMN free_slack INTEGER DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN total_slack INTEGER DEFAULT 0;

-- Scheduling mode
ALTER TABLE public.tasks ADD COLUMN manually_scheduled BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN calendar_id UUID REFERENCES public.project_calendars(id) ON DELETE SET NULL;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Project Calendars RLS
ALTER TABLE public.project_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project calendars" 
ON public.project_calendars FOR SELECT USING (true);

CREATE POLICY "Users can create project calendars" 
ON public.project_calendars FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update project calendars" 
ON public.project_calendars FOR UPDATE USING (true);

CREATE POLICY "Users can delete project calendars" 
ON public.project_calendars FOR DELETE USING (true);

-- Calendar Exceptions RLS
ALTER TABLE public.calendar_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calendar exceptions" 
ON public.calendar_exceptions FOR SELECT USING (true);

CREATE POLICY "Users can create calendar exceptions" 
ON public.calendar_exceptions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update calendar exceptions" 
ON public.calendar_exceptions FOR UPDATE USING (true);

CREATE POLICY "Users can delete calendar exceptions" 
ON public.calendar_exceptions FOR DELETE USING (true);

-- Resources RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view resources" 
ON public.resources FOR SELECT USING (true);

CREATE POLICY "Users can create resources" 
ON public.resources FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update resources" 
ON public.resources FOR UPDATE USING (true);

CREATE POLICY "Users can delete resources" 
ON public.resources FOR DELETE USING (true);

-- Resource Assignments RLS
ALTER TABLE public.resource_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view resource assignments" 
ON public.resource_assignments FOR SELECT USING (true);

CREATE POLICY "Users can create resource assignments" 
ON public.resource_assignments FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update resource assignments" 
ON public.resource_assignments FOR UPDATE USING (true);

CREATE POLICY "Users can delete resource assignments" 
ON public.resource_assignments FOR DELETE USING (true);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps for resources
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamps for resource assignments
CREATE TRIGGER update_resource_assignments_updated_at
BEFORE UPDATE ON public.resource_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ENABLE REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_calendars;

-- =============================================
-- CREATE DEFAULT CALENDAR FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.create_default_calendar()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_calendars (project_id, name, is_default)
  VALUES (NEW.id, 'Standard', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default calendar when project is created
CREATE TRIGGER create_project_default_calendar
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.create_default_calendar();-- Create project_messages table for real-time chat
CREATE TABLE public.project_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_project_messages_project_id ON public.project_messages(project_id);
CREATE INDEX idx_project_messages_created_at ON public.project_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view project messages" 
ON public.project_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can send messages" 
ON public.project_messages 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.project_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;-- Add attachment columns to project_messages
ALTER TABLE public.project_messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to chat-attachments bucket
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.uid() IS NOT NULL
);

-- Allow anyone to view chat attachments
CREATE POLICY "Anyone can view chat attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-attachments');

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete own chat attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);-- Add reactions column to project_messages (JSONB array of reaction objects)
ALTER TABLE public.project_messages
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;

-- Add index for faster reaction queries
CREATE INDEX IF NOT EXISTS idx_project_messages_reactions ON public.project_messages USING GIN (reactions);-- Add pinned messages support
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
WITH CHECK (auth.uid() IS NOT NULL);-- Add edit history support
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
ON public.project_messages(project_id, is_deleted);-- ============================================
-- AI MEETINGS MODULE DATABASE SCHEMA
-- ============================================

-- Meetings table (core meeting data)
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'online' CHECK (meeting_type IN ('online', 'in-person', 'offline')),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('zoom', 'teams', 'meet', 'audio', 'manual')),
  meeting_link TEXT,
  location TEXT,
  
  -- Purpose
  purpose_type TEXT DEFAULT 'status-update' CHECK (purpose_type IN ('decision', 'status-update', 'planning', 'review', 'escalation', 'kickoff')),
  purpose_description TEXT,
  expected_outcomes JSONB DEFAULT '[]',
  success_criteria JSONB DEFAULT '[]',
  
  -- Decision Scope
  decision_scope_type TEXT DEFAULT 'operational' CHECK (decision_scope_type IN ('strategic', 'tactical', 'operational')),
  budget_authority NUMERIC,
  resource_authority BOOLEAN DEFAULT false,
  scope_change_authority BOOLEAN DEFAULT false,
  required_quorum INTEGER DEFAULT 2,
  
  -- Capture Settings
  capture_mode TEXT DEFAULT 'manual-entry' CHECK (capture_mode IN ('live-transcription', 'post-meeting', 'manual-entry')),
  audio_available BOOLEAN DEFAULT false,
  video_available BOOLEAN DEFAULT false,
  transcript_available BOOLEAN DEFAULT false,
  recording_url TEXT,
  transcript_text TEXT,
  capture_confidence TEXT DEFAULT 'low' CHECK (capture_confidence IN ('high', 'medium', 'low')),
  
  -- AI Intelligence
  ai_summary TEXT,
  ai_confidence NUMERIC DEFAULT 0 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ai_processed_at TIMESTAMP WITH TIME ZONE,
  ai_sentiment JSONB, -- {overall, engagement, concerns[], positives[]}
  ai_key_topics JSONB DEFAULT '[]',
  ai_next_steps JSONB DEFAULT '[]',
  
  -- MoM Settings
  mom_template_id TEXT,
  mom_generated BOOLEAN DEFAULT false,
  mom_content TEXT,
  mom_approved BOOLEAN DEFAULT false,
  mom_approved_by UUID,
  mom_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Follow-up tracking
  linked_workstreams JSONB DEFAULT '[]',
  linked_risks JSONB DEFAULT '[]',
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting Participants
CREATE TABLE public.meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('decision-maker', 'contributor', 'observer', 'subject-matter-expert', 'approver')),
  power_level TEXT DEFAULT 'medium' CHECK (power_level IN ('high', 'medium', 'low')),
  interest_level TEXT DEFAULT 'medium' CHECK (interest_level IN ('high', 'medium', 'low')),
  attendance_status TEXT DEFAULT 'pending' CHECK (attendance_status IN ('accepted', 'tentative', 'declined', 'pending', 'attended', 'no-show')),
  attended BOOLEAN DEFAULT false,
  join_time TIMESTAMP WITH TIME ZONE,
  leave_time TIMESTAMP WITH TIME ZONE,
  speaking_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting Agenda Items
CREATE TABLE public.meeting_agenda_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  presenter_id UUID,
  presenter_name TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'skipped')),
  actual_duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting Decisions (AI-extracted or manual)
CREATE TABLE public.meeting_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  decision_type TEXT DEFAULT 'reversible' CHECK (decision_type IN ('irreversible', 'reversible', 'temporary')),
  made_by TEXT,
  made_by_user_id UUID,
  approved_by JSONB DEFAULT '[]', -- [{id, name}]
  impact TEXT DEFAULT 'medium' CHECK (impact IN ('high', 'medium', 'low')),
  linked_risks JSONB DEFAULT '[]',
  linked_tasks JSONB DEFAULT '[]',
  timestamp_in_meeting TEXT, -- e.g., "14:45"
  source TEXT DEFAULT 'manual' CHECK (source IN ('explicit', 'inferred', 'manual')),
  ai_confidence NUMERIC DEFAULT 1 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  implemented BOOLEAN DEFAULT false,
  implemented_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting Action Items (AI-extracted or manual)
CREATE TABLE public.meeting_action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_name TEXT NOT NULL,
  owner_user_id UUID,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled', 'deferred')),
  dependencies JSONB DEFAULT '[]',
  blocked_by JSONB DEFAULT '[]',
  source TEXT DEFAULT 'manual' CHECK (source IN ('explicit', 'inferred', 'manual')),
  ai_confidence NUMERIC DEFAULT 1 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  deferral_count INTEGER DEFAULT 0,
  original_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting Risks (AI-extracted or manual)
CREATE TABLE public.meeting_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  probability TEXT DEFAULT 'medium' CHECK (probability IN ('critical', 'high', 'medium', 'low')),
  impact TEXT DEFAULT 'medium' CHECK (impact IN ('critical', 'high', 'medium', 'low')),
  category TEXT,
  suggested_mitigation TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('explicit', 'inferred', 'manual')),
  ai_confidence NUMERIC DEFAULT 1 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting Scope Changes (AI-extracted)
CREATE TABLE public.meeting_scope_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('addition', 'removal', 'modification')),
  impact_area TEXT CHECK (impact_area IN ('schedule', 'budget', 'resources', 'quality')),
  magnitude TEXT CHECK (magnitude IN ('major', 'minor')),
  requires_approval BOOLEAN DEFAULT true,
  approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  ai_confidence NUMERIC DEFAULT 1 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting Conflicts (AI-extracted)
CREATE TABLE public.meeting_conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  parties JSONB DEFAULT '[]',
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('high', 'medium', 'low')),
  conflict_type TEXT CHECK (conflict_type IN ('resource', 'priority', 'scope', 'timeline', 'technical', 'stakeholder')),
  suggested_resolution TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  ai_confidence NUMERIC DEFAULT 1 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting Notes (live notes during meeting)
CREATE TABLE public.meeting_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID,
  user_email TEXT,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'note' CHECK (note_type IN ('note', 'decision', 'action', 'risk', 'question', 'highlight')),
  timestamp_in_meeting TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MoM Templates
CREATE TABLE public.mom_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  organization TEXT,
  sections JSONB DEFAULT '[]', -- [{id, title, type, required, autoPopulate}]
  formatting JSONB DEFAULT '{}', -- {headerLogo, dateFormat, includeTimestamps, etc}
  approval_workflow JSONB DEFAULT '{}', -- {required, approvers[], deadline, autoApprove}
  is_default BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_scope_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mom_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
CREATE POLICY "Users can view all meetings" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create meetings" ON public.meetings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update meetings" ON public.meetings FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their meetings" ON public.meetings FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for participants
CREATE POLICY "Users can view meeting participants" ON public.meeting_participants FOR SELECT USING (true);
CREATE POLICY "Users can manage meeting participants" ON public.meeting_participants FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for agenda items
CREATE POLICY "Users can view agenda items" ON public.meeting_agenda_items FOR SELECT USING (true);
CREATE POLICY "Users can manage agenda items" ON public.meeting_agenda_items FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for decisions
CREATE POLICY "Users can view decisions" ON public.meeting_decisions FOR SELECT USING (true);
CREATE POLICY "Users can manage decisions" ON public.meeting_decisions FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for action items
CREATE POLICY "Users can view action items" ON public.meeting_action_items FOR SELECT USING (true);
CREATE POLICY "Users can manage action items" ON public.meeting_action_items FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for risks
CREATE POLICY "Users can view meeting risks" ON public.meeting_risks FOR SELECT USING (true);
CREATE POLICY "Users can manage meeting risks" ON public.meeting_risks FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for scope changes
CREATE POLICY "Users can view scope changes" ON public.meeting_scope_changes FOR SELECT USING (true);
CREATE POLICY "Users can manage scope changes" ON public.meeting_scope_changes FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for conflicts
CREATE POLICY "Users can view conflicts" ON public.meeting_conflicts FOR SELECT USING (true);
CREATE POLICY "Users can manage conflicts" ON public.meeting_conflicts FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for notes
CREATE POLICY "Users can view meeting notes" ON public.meeting_notes FOR SELECT USING (true);
CREATE POLICY "Users can manage meeting notes" ON public.meeting_notes FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for templates
CREATE POLICY "Users can view templates" ON public.mom_templates FOR SELECT USING (true);
CREATE POLICY "Users can manage templates" ON public.mom_templates FOR ALL USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_action_items_updated_at BEFORE UPDATE ON public.meeting_action_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mom_templates_updated_at BEFORE UPDATE ON public.mom_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for meetings
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_agenda_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_action_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_notes;

-- Indexes for performance
CREATE INDEX idx_meetings_project_id ON public.meetings(project_id);
CREATE INDEX idx_meetings_date ON public.meetings(date);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meeting_participants_meeting_id ON public.meeting_participants(meeting_id);
CREATE INDEX idx_meeting_agenda_items_meeting_id ON public.meeting_agenda_items(meeting_id);
CREATE INDEX idx_meeting_decisions_meeting_id ON public.meeting_decisions(meeting_id);
CREATE INDEX idx_meeting_action_items_meeting_id ON public.meeting_action_items(meeting_id);
CREATE INDEX idx_meeting_action_items_status ON public.meeting_action_items(status);
CREATE INDEX idx_meeting_action_items_due_date ON public.meeting_action_items(due_date);
CREATE INDEX idx_meeting_risks_meeting_id ON public.meeting_risks(meeting_id);
CREATE INDEX idx_meeting_notes_meeting_id ON public.meeting_notes(meeting_id);-- Add recurring schedule columns to meetings table
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS recurring_schedule text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurring_end_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurring_parent_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurring_instance_date date DEFAULT NULL;

-- Add index for faster recurring meeting queries
CREATE INDEX IF NOT EXISTS idx_meetings_recurring_parent 
ON public.meetings(recurring_parent_id) 
WHERE recurring_parent_id IS NOT NULL;

-- Add foreign key for recurring parent
ALTER TABLE public.meetings
ADD CONSTRAINT meetings_recurring_parent_fkey 
FOREIGN KEY (recurring_parent_id) 
REFERENCES public.meetings(id) 
ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN public.meetings.recurring_schedule IS 'Recurrence pattern: none, daily, weekly, bi-weekly, monthly';
COMMENT ON COLUMN public.meetings.recurring_end_date IS 'End date for recurring series';
COMMENT ON COLUMN public.meetings.recurring_parent_id IS 'Reference to parent meeting for recurring instances';
COMMENT ON COLUMN public.meetings.recurring_instance_date IS 'Specific date for this instance in a recurring series';-- Email accounts table (personal and shared)
CREATE TABLE public.email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL DEFAULT 'personal' CHECK (account_type IN ('personal', 'shared')),
  email_address TEXT NOT NULL,
  display_name TEXT,
  
  -- IMAP Settings
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL DEFAULT 993,
  imap_username TEXT NOT NULL,
  imap_password TEXT NOT NULL, -- Encrypted via pgcrypto
  imap_encryption TEXT NOT NULL DEFAULT 'ssl' CHECK (imap_encryption IN ('ssl', 'tls', 'none')),
  
  -- SMTP Settings
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_encryption TEXT DEFAULT 'tls' CHECK (smtp_encryption IN ('ssl', 'tls', 'none')),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
  sync_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email folders table
CREATE TABLE public.email_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  remote_name TEXT NOT NULL,
  folder_type TEXT DEFAULT 'custom' CHECK (folder_type IN ('inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'custom')),
  unread_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Emails table
CREATE TABLE public.emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.email_folders(id) ON DELETE CASCADE,
  
  -- Email identifiers
  message_id TEXT NOT NULL,
  thread_id TEXT,
  in_reply_to TEXT,
  references_ids JSONB DEFAULT '[]'::jsonb,
  
  -- Email content
  subject TEXT,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses JSONB DEFAULT '[]'::jsonb,
  cc_addresses JSONB DEFAULT '[]'::jsonb,
  bcc_addresses JSONB DEFAULT '[]'::jsonb,
  reply_to TEXT,
  
  body_text TEXT,
  body_html TEXT,
  snippet TEXT,
  
  -- Attachments
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  labels JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(account_id, message_id)
);

-- Email drafts table
CREATE TABLE public.email_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Draft content
  to_addresses JSONB DEFAULT '[]'::jsonb,
  cc_addresses JSONB DEFAULT '[]'::jsonb,
  bcc_addresses JSONB DEFAULT '[]'::jsonb,
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  
  -- Reply/Forward context
  reply_to_email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  forward_email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_emails_account_folder ON public.emails(account_id, folder_id);
CREATE INDEX idx_emails_thread ON public.emails(thread_id);
CREATE INDEX idx_emails_received_at ON public.emails(received_at DESC);
CREATE INDEX idx_emails_is_read ON public.emails(is_read) WHERE is_read = false;
CREATE INDEX idx_email_accounts_user ON public.email_accounts(user_id);
CREATE INDEX idx_email_accounts_project ON public.email_accounts(project_id);

-- Enable RLS
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_accounts
CREATE POLICY "Users can view their own email accounts"
  ON public.email_accounts FOR SELECT
  USING (user_id = auth.uid() OR project_id IN (SELECT id FROM public.projects));

CREATE POLICY "Users can create their own email accounts"
  ON public.email_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own email accounts"
  ON public.email_accounts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own email accounts"
  ON public.email_accounts FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for email_folders
CREATE POLICY "Users can view folders from their accounts"
  ON public.email_folders FOR SELECT
  USING (account_id IN (
    SELECT id FROM public.email_accounts 
    WHERE user_id = auth.uid() OR project_id IN (SELECT id FROM public.projects)
  ));

CREATE POLICY "Users can manage folders from their accounts"
  ON public.email_folders FOR ALL
  USING (account_id IN (
    SELECT id FROM public.email_accounts WHERE user_id = auth.uid()
  ));

-- RLS Policies for emails
CREATE POLICY "Users can view emails from their accounts"
  ON public.emails FOR SELECT
  USING (account_id IN (
    SELECT id FROM public.email_accounts 
    WHERE user_id = auth.uid() OR project_id IN (SELECT id FROM public.projects)
  ));

CREATE POLICY "Users can manage emails from their accounts"
  ON public.emails FOR ALL
  USING (account_id IN (
    SELECT id FROM public.email_accounts WHERE user_id = auth.uid()
  ));

-- RLS Policies for email_drafts
CREATE POLICY "Users can view their own drafts"
  ON public.email_drafts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own drafts"
  ON public.email_drafts FOR ALL
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON public.email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON public.email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for emails
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;-- Add OAuth provider fields to email_accounts
ALTER TABLE public.email_accounts 
ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'imap' CHECK (provider_type IN ('imap', 'gmail', 'microsoft')),
ADD COLUMN IF NOT EXISTS oauth_client_id TEXT,
ADD COLUMN IF NOT EXISTS oauth_client_secret TEXT,
ADD COLUMN IF NOT EXISTS oauth_access_token TEXT,
ADD COLUMN IF NOT EXISTS oauth_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS oauth_token_expires_at TIMESTAMPTZ;-- Create notebooks table
CREATE TABLE public.notebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'book-open',
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sections table
CREATE TABLE public.notebook_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pages table
CREATE TABLE public.notebook_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.notebook_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  content_html TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_by TEXT,
  created_by_user_id UUID,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create page links table for wiki-style linking
CREATE TABLE public.notebook_page_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_page_id UUID NOT NULL REFERENCES public.notebook_pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES public.notebook_pages(id) ON DELETE CASCADE,
  link_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_page_id, target_page_id)
);

-- Enable RLS on all tables
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_page_links ENABLE ROW LEVEL SECURITY;

-- Notebooks policies - allow all authenticated users for now (project-scoped access can be added later)
CREATE POLICY "Allow all access to notebooks" ON public.notebooks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sections" ON public.notebook_sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pages" ON public.notebook_pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to page links" ON public.notebook_page_links FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_notebooks_project ON public.notebooks(project_id);
CREATE INDEX idx_sections_notebook ON public.notebook_sections(notebook_id);
CREATE INDEX idx_pages_section ON public.notebook_pages(section_id);
CREATE INDEX idx_pages_tags ON public.notebook_pages USING GIN(tags);
CREATE INDEX idx_page_links_source ON public.notebook_page_links(source_page_id);
CREATE INDEX idx_page_links_target ON public.notebook_page_links(target_page_id);

-- Create triggers for updated_at
CREATE TRIGGER update_notebooks_updated_at
  BEFORE UPDATE ON public.notebooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.notebook_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.notebook_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaborative editing
ALTER PUBLICATION supabase_realtime ADD TABLE public.notebooks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notebook_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notebook_pages;-- Create notebook_spreadsheets table (parallel to notebook_sections)
CREATE TABLE public.notebook_spreadsheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Spreadsheet',
  color TEXT DEFAULT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spreadsheet_sheets table (the actual sheets within a spreadsheet)
CREATE TABLE public.spreadsheet_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spreadsheet_id UUID NOT NULL REFERENCES public.notebook_spreadsheets(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Sheet 1',
  data JSONB DEFAULT '[]'::jsonb, -- Stores cell data as array of rows
  column_widths JSONB DEFAULT '{}'::jsonb, -- Stores custom column widths
  row_heights JSONB DEFAULT '{}'::jsonb, -- Stores custom row heights
  frozen_rows INTEGER DEFAULT 0,
  frozen_cols INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notebook_spreadsheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheet_sheets ENABLE ROW LEVEL SECURITY;

-- RLS policies for notebook_spreadsheets
CREATE POLICY "Allow all access to spreadsheets"
  ON public.notebook_spreadsheets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies for spreadsheet_sheets
CREATE POLICY "Allow all access to sheets"
  ON public.spreadsheet_sheets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at triggers
CREATE TRIGGER update_notebook_spreadsheets_updated_at
  BEFORE UPDATE ON public.notebook_spreadsheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spreadsheet_sheets_updated_at
  BEFORE UPDATE ON public.spreadsheet_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notebook_spreadsheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spreadsheet_sheets;-- Add linked project columns to notebook_spreadsheets
ALTER TABLE public.notebook_spreadsheets
ADD COLUMN linked_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
ADD COLUMN linked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'syncing', 'error')),
ADD COLUMN sync_direction TEXT DEFAULT 'both' CHECK (sync_direction IN ('spreadsheet', 'project', 'both'));

-- Create spreadsheet_task_mappings table for row-to-task tracking
CREATE TABLE public.spreadsheet_task_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spreadsheet_id UUID NOT NULL REFERENCES public.notebook_spreadsheets(id) ON DELETE CASCADE,
  sheet_id UUID NOT NULL REFERENCES public.spreadsheet_sheets(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sheet_id, row_index),
  UNIQUE(sheet_id, task_id)
);

-- Enable RLS
ALTER TABLE public.spreadsheet_task_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for spreadsheet_task_mappings
CREATE POLICY "Allow all access to task mappings"
ON public.spreadsheet_task_mappings
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.spreadsheet_task_mappings;

-- Create index for faster lookups
CREATE INDEX idx_task_mappings_spreadsheet ON public.spreadsheet_task_mappings(spreadsheet_id);
CREATE INDEX idx_task_mappings_task ON public.spreadsheet_task_mappings(task_id);
CREATE INDEX idx_task_mappings_sheet_row ON public.spreadsheet_task_mappings(sheet_id, row_index);-- Document Center Schema
-- Tables: documents, document_folders, document_versions, document_approvers, document_shares

-- Document Folders table
CREATE TABLE public.document_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.document_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.document_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'draft',
  uploaded_by UUID,
  uploaded_by_name TEXT,
  is_starred BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  locked_by UUID,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document Versions table
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  change_notes TEXT,
  uploaded_by UUID,
  uploaded_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'current',
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document Approvers table
CREATE TABLE public.document_approvers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT NOT NULL,
  user_role TEXT,
  order_num INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  comment TEXT,
  decided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document Shares table
CREATE TABLE public.document_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.document_folders(id) ON DELETE CASCADE,
  shared_with_user_id UUID,
  shared_with_email TEXT,
  permission TEXT NOT NULL DEFAULT 'view',
  share_link TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT document_or_folder CHECK (document_id IS NOT NULL OR folder_id IS NOT NULL)
);

-- Enable RLS on all tables
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_folders
CREATE POLICY "Users can view document folders" ON public.document_folders
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create folders" ON public.document_folders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update folders" ON public.document_folders
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete folders" ON public.document_folders
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for documents
CREATE POLICY "Users can view documents" ON public.documents
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update documents" ON public.documents
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete documents" ON public.documents
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for document_versions
CREATE POLICY "Users can view document versions" ON public.document_versions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create versions" ON public.document_versions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update versions" ON public.document_versions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete versions" ON public.document_versions
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for document_approvers
CREATE POLICY "Users can view document approvers" ON public.document_approvers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage approvers" ON public.document_approvers
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for document_shares
CREATE POLICY "Users can view shares" ON public.document_shares
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage shares" ON public.document_shares
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view project documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-documents');

CREATE POLICY "Authenticated users can update documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);

-- Enable realtime for documents
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_folders;

-- Add updated_at triggers
CREATE TRIGGER update_document_folders_updated_at
  BEFORE UPDATE ON public.document_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();-- Create presentation_folders table
CREATE TABLE presentation_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES presentation_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create presentations table
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES presentation_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Presentation',
  template TEXT DEFAULT 'custom',
  theme JSONB DEFAULT '{"primaryColor": "#3b82f6", "accentColor": "#10b981", "fontFamily": "Inter"}',
  slide_master JSONB DEFAULT '{"showHeader": true, "showFooter": true, "showPageNumbers": true}',
  transitions JSONB DEFAULT '{"type": "fade", "duration": 0.5}',
  created_by UUID,
  created_by_name TEXT,
  is_shared BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create presentation_slides table
CREATE TABLE presentation_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Slide',
  template TEXT DEFAULT 'blank',
  content JSONB DEFAULT '{}',
  html_content TEXT DEFAULT '',
  speaker_notes TEXT DEFAULT '',
  transition JSONB DEFAULT '{}',
  background JSONB DEFAULT '{"type": "solid", "color": "#ffffff"}',
  shapes JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  charts JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create presentation_versions table
CREATE TABLE presentation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  slides_snapshot JSONB NOT NULL,
  change_notes TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create presentation_collaborators table
CREATE TABLE presentation_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  user_name TEXT NOT NULL,
  user_email TEXT,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'comment', 'edit')),
  cursor_position JSONB DEFAULT '{}',
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(presentation_id, user_email)
);

-- Enable RLS on all tables
ALTER TABLE presentation_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for presentation_folders
CREATE POLICY "Users can view presentation folders" ON presentation_folders FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create folders" ON presentation_folders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update folders" ON presentation_folders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete folders" ON presentation_folders FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for presentations
CREATE POLICY "Users can view presentations" ON presentations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create presentations" ON presentations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update presentations" ON presentations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete presentations" ON presentations FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for presentation_slides
CREATE POLICY "Users can view slides" ON presentation_slides FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create slides" ON presentation_slides FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update slides" ON presentation_slides FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete slides" ON presentation_slides FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for presentation_versions
CREATE POLICY "Users can view versions" ON presentation_versions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create versions" ON presentation_versions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete versions" ON presentation_versions FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for presentation_collaborators
CREATE POLICY "Users can view collaborators" ON presentation_collaborators FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage collaborators" ON presentation_collaborators FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_presentation_folders_project ON presentation_folders(project_id);
CREATE INDEX idx_presentation_folders_parent ON presentation_folders(parent_id);
CREATE INDEX idx_presentations_project ON presentations(project_id);
CREATE INDEX idx_presentations_folder ON presentations(folder_id);
CREATE INDEX idx_slides_presentation ON presentation_slides(presentation_id);
CREATE INDEX idx_slides_order ON presentation_slides(presentation_id, sort_order);
CREATE INDEX idx_versions_presentation ON presentation_versions(presentation_id);
CREATE INDEX idx_collaborators_presentation ON presentation_collaborators(presentation_id);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE presentation_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE presentations;
ALTER PUBLICATION supabase_realtime ADD TABLE presentation_slides;
ALTER PUBLICATION supabase_realtime ADD TABLE presentation_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE presentation_collaborators;

-- Create storage bucket for presentation assets
INSERT INTO storage.buckets (id, name, public) VALUES ('presentation-assets', 'presentation-assets', true);

-- Storage policies for presentation-assets bucket
CREATE POLICY "Anyone can view presentation assets" ON storage.objects FOR SELECT USING (bucket_id = 'presentation-assets');
CREATE POLICY "Authenticated users can upload presentation assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'presentation-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update their presentation assets" ON storage.objects FOR UPDATE USING (bucket_id = 'presentation-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete their presentation assets" ON storage.objects FOR DELETE USING (bucket_id = 'presentation-assets' AND auth.uid() IS NOT NULL);-- Phase 1: Multi-Agent AI System Database Schema

-- 1. Create project role enum
CREATE TYPE public.project_role AS ENUM ('admin', 'pm', 'lead', 'developer', 'analyst', 'viewer');

-- 2. Create user_roles table for RBAC
CREATE TABLE public.user_roles (
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
  EXECUTE FUNCTION public.update_updated_at_column();-- Create briefing_preferences table for storing user section preferences
CREATE TABLE public.briefing_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  enabled_sections JSONB NOT NULL DEFAULT '["critical-alerts", "ai-insights", "profit-loss", "schedule-slippage", "budget-analysis", "risk-assessment", "actions-due", "issues-summary", "meetings-today", "recent-decisions", "team-availability"]'::jsonb,
  section_order JSONB NOT NULL DEFAULT '["critical-alerts", "ai-insights", "profit-loss", "schedule-slippage", "budget-analysis", "risk-assessment", "actions-due", "issues-summary", "meetings-today", "recent-decisions", "team-availability", "communication-intelligence"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE public.briefing_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own briefing preferences"
ON public.briefing_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own briefing preferences"
ON public.briefing_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own briefing preferences"
ON public.briefing_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete their own briefing preferences"
ON public.briefing_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_briefing_preferences_updated_at
BEFORE UPDATE ON public.briefing_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();-- Add embedded components support to presentation_slides table
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_presentations;-- Create custom enum types
CREATE TYPE item_type AS ENUM ('epic', 'story', 'task', 'bug', 'tech-debt');
CREATE TYPE backlog_status AS ENUM ('todo', 'in-progress', 'review', 'done');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE risk_status AS ENUM ('identified', 'analyzing', 'mitigating', 'closed', 'accepted');
CREATE TYPE action_status AS ENUM ('pending', 'in-progress', 'completed', 'deferred', 'cancelled');
CREATE TYPE issue_status AS ENUM ('open', 'investigating', 'in-progress', 'resolved', 'closed');
CREATE TYPE issue_severity AS ENUM ('minor', 'moderate', 'major', 'critical');
CREATE TYPE sprint_status AS ENUM ('planning', 'active', 'completed', 'cancelled');

-- =====================
-- EPICS TABLE
-- =====================
CREATE TABLE public.epics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  description TEXT,
  progress INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  completed_points INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view epics" ON public.epics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create epics" ON public.epics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update epics" ON public.epics FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete epics" ON public.epics FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================
-- SPRINTS TABLE
-- =====================
CREATE TABLE public.sprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal TEXT,
  velocity INTEGER DEFAULT 0,
  capacity INTEGER DEFAULT 0,
  status sprint_status DEFAULT 'planning',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sprints" ON public.sprints FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create sprints" ON public.sprints FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sprints" ON public.sprints FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete sprints" ON public.sprints FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================
-- BACKLOG ITEMS TABLE
-- =====================
CREATE TABLE public.backlog_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  epic_id UUID REFERENCES public.epics(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  key TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type item_type DEFAULT 'story',
  priority priority_level DEFAULT 'medium',
  story_points INTEGER,
  assignee_id UUID,
  assignee_name TEXT,
  labels JSONB DEFAULT '[]'::jsonb,
  status backlog_status DEFAULT 'todo',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.backlog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view backlog items" ON public.backlog_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create backlog items" ON public.backlog_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update backlog items" ON public.backlog_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete backlog items" ON public.backlog_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================
-- RISKS TABLE
-- =====================
CREATE TABLE public.risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  probability risk_level DEFAULT 'medium',
  impact risk_level DEFAULT 'medium',
  status risk_status DEFAULT 'identified',
  owner_id UUID,
  owner_name TEXT,
  mitigation_plan TEXT,
  contingency_plan TEXT,
  triggers TEXT,
  linked_items JSONB DEFAULT '[]'::jsonb,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view risks" ON public.risks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create risks" ON public.risks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update risks" ON public.risks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete risks" ON public.risks FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================
-- ACTIONS TABLE
-- =====================
CREATE TABLE public.actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority priority_level DEFAULT 'medium',
  status action_status DEFAULT 'pending',
  owner_id UUID,
  owner_name TEXT,
  created_by_id UUID,
  created_by_name TEXT,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  source_type TEXT,
  source_id UUID,
  source_title TEXT,
  linked_items JSONB DEFAULT '[]'::jsonb,
  dependencies JSONB DEFAULT '[]'::jsonb,
  blocked_by TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  sla_target_hours INTEGER,
  sla_started_at TIMESTAMP WITH TIME ZONE,
  sla_breached BOOLEAN DEFAULT false,
  sla_breached_at TIMESTAMP WITH TIME ZONE,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view actions" ON public.actions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create actions" ON public.actions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update actions" ON public.actions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete actions" ON public.actions FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================
-- ISSUES TABLE
-- =====================
CREATE TABLE public.issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  key TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'bug',
  severity issue_severity DEFAULT 'moderate',
  priority priority_level DEFAULT 'medium',
  status issue_status DEFAULT 'open',
  reporter_id UUID,
  reporter_name TEXT,
  assignee_id UUID,
  assignee_name TEXT,
  sla_target_resolution INTEGER,
  sla_breached BOOLEAN DEFAULT false,
  linked_items JSONB DEFAULT '[]'::jsonb,
  affected_areas JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  root_cause TEXT,
  resolution TEXT,
  comments JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view issues" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues" ON public.issues FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update issues" ON public.issues FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete issues" ON public.issues FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================
-- TRIGGERS FOR UPDATED_AT
-- =====================
CREATE TRIGGER update_epics_updated_at BEFORE UPDATE ON public.epics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON public.sprints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_backlog_items_updated_at BEFORE UPDATE ON public.backlog_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON public.risks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON public.actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ENABLE REALTIME
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.risks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.actions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.backlog_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.epics;

-- =====================
-- SLA BREACH TRIGGER FOR ACTIONS
-- =====================
CREATE OR REPLACE FUNCTION public.check_action_sla_breach()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sla_target_hours IS NOT NULL 
     AND NEW.sla_started_at IS NOT NULL 
     AND NEW.status NOT IN ('completed', 'cancelled')
     AND NEW.sla_breached = false THEN
    IF NOW() > (NEW.sla_started_at + (NEW.sla_target_hours || ' hours')::interval) THEN
      NEW.sla_breached := true;
      NEW.sla_breached_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_action_sla_on_update 
  BEFORE UPDATE ON public.actions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.check_action_sla_breach();-- Create decisions table
CREATE TABLE public.decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  key TEXT,
  title TEXT NOT NULL,
  decision TEXT NOT NULL,
  context TEXT,
  impact TEXT,
  alternatives JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'superseded', 'rejected')),
  owner_id UUID,
  owner_name TEXT,
  date DATE DEFAULT CURRENT_DATE,
  linked_tasks JSONB DEFAULT '[]'::jsonb,
  linked_risks JSONB DEFAULT '[]'::jsonb,
  linked_meetings JSONB DEFAULT '[]'::jsonb,
  linked_items JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view decisions for their projects"
  ON public.decisions FOR SELECT
  USING (true);

CREATE POLICY "Users can create decisions"
  ON public.decisions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update decisions"
  ON public.decisions FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete decisions"
  ON public.decisions FOR DELETE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.decisions;-- Create Enum Types
DO $$ BEGIN
    CREATE TYPE public.stakeholder_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.stakeholder_engagement AS ENUM ('supportive', 'neutral', 'resistant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.cr_status AS ENUM ('pending', 'analyzing', 'approved', 'rejected', 'implemented');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Stakeholders Table
CREATE TABLE IF NOT EXISTS public.stakeholders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    role text,
    organization text,
    email text,
    phone text,
    influence public.stakeholder_level DEFAULT 'medium',
    interest public.stakeholder_level DEFAULT 'medium',
    engagement public.stakeholder_engagement DEFAULT 'neutral',
    category text,
    communication_preference text,
    key_interests jsonb DEFAULT '[]'::jsonb,
    is_key_stakeholder boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create Change Requests Table
CREATE TABLE IF NOT EXISTS public.change_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status public.cr_status DEFAULT 'pending',
    priority public.priority_level DEFAULT 'medium',
    type text,
    impact_area text,
    requested_by_id uuid,
    requested_by_name text,
    approved_by_id uuid,
    approved_by_name text,
    requested_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create Lessons Learned Table
CREATE TABLE IF NOT EXISTS public.lessons_learned (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    category text,
    impact public.stakeholder_level DEFAULT 'medium',
    recommendation text,
    created_by_id uuid,
    created_by_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create Portfolios Table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active',
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id uuid REFERENCES public.portfolios(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active',
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add program_id and portfolio_id to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS portfolio_id uuid REFERENCES public.portfolios(id) ON DELETE SET NULL;

-- Create Traceability Matrix Table
CREATE TABLE IF NOT EXISTS public.traceability_matrix (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    source_id uuid NOT NULL,
    source_type text NOT NULL,
    target_id uuid NOT NULL,
    target_type text NOT NULL,
    relationship_type text DEFAULT 'covers',
    created_at timestamp with time zone DEFAULT now()
);

-- Create Scenarios Table
CREATE TABLE IF NOT EXISTS public.scenarios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    data jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traceability_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view all stakeholders" ON public.stakeholders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert stakeholders" ON public.stakeholders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update stakeholders" ON public.stakeholders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete stakeholders" ON public.stakeholders FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all change_requests" ON public.change_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert change_requests" ON public.change_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update change_requests" ON public.change_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete change_requests" ON public.change_requests FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all lessons_learned" ON public.lessons_learned FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert lessons_learned" ON public.lessons_learned FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update lessons_learned" ON public.lessons_learned FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete lessons_learned" ON public.lessons_learned FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all portfolios" ON public.portfolios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert portfolios" ON public.portfolios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view all programs" ON public.programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert programs" ON public.programs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view all traceability_matrix" ON public.traceability_matrix FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert traceability_matrix" ON public.traceability_matrix FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view all scenarios" ON public.scenarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert scenarios" ON public.scenarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update scenarios" ON public.scenarios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete scenarios" ON public.scenarios FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_stakeholders_updated_at BEFORE UPDATE ON public.stakeholders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON public.change_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_learned_updated_at BEFORE UPDATE ON public.lessons_learned FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add triggers for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stakeholders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.change_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons_learned;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.programs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.traceability_matrix;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scenarios;
-- Enhance change_requests table
ALTER TABLE "change_requests" 
ADD COLUMN IF NOT EXISTS "impact_details" jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "affected_tasks" jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "justification" text,
ADD COLUMN IF NOT EXISTS "alternatives" text;

-- Enhance stakeholders table
ALTER TABLE "stakeholders" 
ADD COLUMN IF NOT EXISTS "key_interests" jsonb DEFAULT '[]'::jsonb;

-- Ensure RLS is active (redundant but safe)
ALTER TABLE "change_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stakeholders" ENABLE ROW LEVEL SECURITY;
-- Create Project Charters Table
CREATE TABLE IF NOT EXISTS public.project_charters (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    version text DEFAULT '1.0',
    status text DEFAULT 'draft',
    vision text,
    mission text,
    objectives jsonb DEFAULT '[]'::jsonb,
    success_criteria jsonb DEFAULT '[]'::jsonb,
    assumptions jsonb DEFAULT '[]'::jsonb,
    constraints jsonb DEFAULT '[]'::jsonb,
    approval_authorities jsonb DEFAULT '[]'::jsonb,
    milestones jsonb DEFAULT '[]'::jsonb,
    budget_summary jsonb DEFAULT '{}'::jsonb,
    approved_at timestamp with time zone,
    approved_by_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(project_id)
);

-- Create Final Reports Table
CREATE TABLE IF NOT EXISTS public.final_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    completion_date date,
    executive_summary text,
    objectives_achievement jsonb DEFAULT '[]'::jsonb,
    financial_performance jsonb DEFAULT '{}'::jsonb,
    schedule_performance jsonb DEFAULT '{}'::jsonb,
    deliverables_status jsonb DEFAULT '[]'::jsonb,
    team_recognition jsonb DEFAULT '[]'::jsonb,
    stakeholder_satisfaction numeric,
    recommendations jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'draft',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.project_charters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_reports ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view all project_charters" ON public.project_charters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert project_charters" ON public.project_charters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update project_charters" ON public.project_charters FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can view all final_reports" ON public.final_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert final_reports" ON public.final_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update final_reports" ON public.final_reports FOR UPDATE TO authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_project_charters_updated_at BEFORE UPDATE ON public.project_charters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_final_reports_updated_at BEFORE UPDATE ON public.final_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_charters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.final_reports;
-- Migration: Financials and EVM Tables
-- Created at: 2026-02-03 18:00:00

-- Create project_budget_items table
CREATE TABLE IF NOT EXISTS public.project_budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    planned NUMERIC DEFAULT 0,
    actual NUMERIC DEFAULT 0,
    forecast NUMERIC DEFAULT 0,
    variance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS to project_budget_items
ALTER TABLE public.project_budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users on project_budget_items"
ON public.project_budget_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create project_invoices table
CREATE TABLE IF NOT EXISTS public.project_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'sent',
    milestone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS to project_invoices
ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users on project_invoices"
ON public.project_invoices
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create project_evm_snapshots table
CREATE TABLE IF NOT EXISTS public.project_evm_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    as_of_date DATE NOT NULL,
    pv NUMERIC DEFAULT 0,
    ev NUMERIC DEFAULT 0,
    ac NUMERIC DEFAULT 0,
    bac NUMERIC DEFAULT 0,
    spi NUMERIC DEFAULT 0,
    cpi NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS to project_evm_snapshots
ALTER TABLE public.project_evm_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users on project_evm_snapshots"
ON public.project_evm_snapshots
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add updated_at trigger for budget items and invoices
CREATE OR REPLACE TRIGGER handle_updated_at_project_budget_items
    BEFORE UPDATE ON public.project_budget_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER handle_updated_at_project_invoices
    BEFORE UPDATE ON public.project_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_budget_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_evm_snapshots;
-- Seed Portfolios
INSERT INTO portfolios (id, name, description, status)
VALUES 
  ('port-1', 'Digital Transformation', 'Strategic initiatives for digital reach and customer experience.', 'active'),
  ('port-2', 'Infrastructure Modernization', 'Upgrading core IT infrastructure and cloud capabilities.', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Programs
INSERT INTO programs (id, name, description, status, portfolio_id)
VALUES 
  ('prog-1', 'Customer Experience Platform', 'Modernizing customer touchpoints across web and mobile.', 'active', 'port-1'),
  ('prog-2', 'Data Analytics Initiative', 'Leveraging data for better business insights.', 'active', 'port-1'),
  ('prog-3', 'Cloud Migration', 'Moving legacy systems to AWS and Azure.', 'active', 'port-2')
ON CONFLICT (id) DO NOTHING;

-- Link existing projects to programs (guessing IDs based on mock data names if they exist)
-- Note: This assumes some projects already exist. If not, this part will be handled during project creation.
-- For now, let's just ensure the tables are ready.
-- Seed Traceability Data
DO $$
DECLARE
    project_id uuid := 'proj-test-1';
BEGIN
    -- Seed Project
    INSERT INTO public.projects (id, name, code, description, status)
    VALUES (project_id, 'Traceability Matrix Test', 'TMT-001', 'Project for testing traceability matrix wiring', 'active')
    ON CONFLICT (id) DO NOTHING;

    -- Seed Sprints
    INSERT INTO public.sprints (id, name, status, project_id)
    VALUES ('spr-1', 'Sprint 1 - Foundation', 'completed', project_id)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Tasks
    INSERT INTO public.tasks (id, name, status, project_id, wbs)
    VALUES 
      ('task-1', 'Setup Database Schema', 'completed', project_id, '1.1'),
      ('task-2', 'Develop API Endpoints', 'in-progress', project_id, '1.2')
    ON CONFLICT (id) DO NOTHING;

    -- Seed Issues
    INSERT INTO public.issues (id, title, status, project_id)
    VALUES ('iss-1', 'Database connection timeout', 'resolved', project_id)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Risks
    INSERT INTO public.risks (id, title, status, project_id)
    VALUES ('rsk-1', 'Scalability concerns under heavy load', 'mitigated', project_id)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Decisions
    INSERT INTO public.decisions (id, title, status, project_id)
    VALUES ('dec-1', 'Use PostgreSQL for metadata storage', 'approved', project_id)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Actions
    INSERT INTO public.actions (id, title, status, project_id)
    VALUES ('act-1', 'Optimize database indexes', 'completed', project_id)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Meetings
    INSERT INTO public.meetings (id, title, status, project_id, date, start_time)
    VALUES ('mtg-1', 'Kickoff Meeting', 'completed', project_id, CURRENT_DATE, '09:00:00')
    ON CONFLICT (id) DO NOTHING;

    -- Seed Traceability Matrix
    -- Links:
    -- Sprint 1 -> Task 1, Task 2
    -- Task 1 -> Decision 1
    -- Task 2 -> Action 1
    -- Issue 1 -> Task 1
    -- Risk 1 -> Decision 1
    -- Meeting 1 -> Decision 1, Action 1

    INSERT INTO public.traceability_matrix (project_id, source_id, source_type, target_id, target_type, relationship_type)
    VALUES 
      (project_id, 'spr-1', 'sprint', 'task-1', 'task', 'covers'),
      (project_id, 'spr-1', 'sprint', 'task-2', 'task', 'covers'),
      (project_id, 'task-1', 'task', 'dec-1', 'decision', 'implements'),
      (project_id, 'task-2', 'task', 'act-1', 'action', 'requires'),
      (project_id, 'iss-1', 'issue', 'task-1', 'task', 'affects'),
      (project_id, 'rsk-1', 'risk', 'dec-1', 'decision', 'related'),
      (project_id, 'mtg-1', 'meeting', 'dec-1', 'decision', 'recorded'),
      (project_id, 'mtg-1', 'meeting', 'act-1', 'action', 'recorded')
    ON CONFLICT DO NOTHING;
END $$;
-- Create Strategic Insights Table
CREATE TABLE IF NOT EXISTS public.strategic_insights (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'context', 'risk-discovery', 'value-engineering'
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategic_insights ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view all strategic_insights" ON public.strategic_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert strategic_insights" ON public.strategic_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update strategic_insights" ON public.strategic_insights FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete strategic_insights" ON public.strategic_insights FOR DELETE TO authenticated USING (true);

-- Add unique constraint to ensure one of each type per project (or we can allow multiple versions, but for now one is easier)
-- ALTER TABLE public.strategic_insights ADD CONSTRAINT unique_type_per_project UNIQUE (project_id, type);

-- Trigger for updated_at
CREATE TRIGGER update_strategic_insights_updated_at
    BEFORE UPDATE ON public.strategic_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- Seed Scenarios and Strategic Insights
DO $$ 
DECLARE
    project_id uuid;
BEGIN
    -- Get the first project
    SELECT id INTO project_id FROM public.projects LIMIT 1;

    IF project_id IS NOT NULL THEN
        -- Seed Scenarios
        INSERT INTO public.scenarios (project_id, name, description, data)
        VALUES 
        (project_id, 'Baseline Plan', 'Current approved project timeline - the reference point for all comparisons', '{"status": "active", "createdDate": "2024-01-15", "modifiedDate": "2024-01-15", "author": "Sarah Mitchell", "adjustments": [], "impact": {"endDateChange": 0, "costChange": 0, "riskLevel": "medium", "criticalPathAffected": false, "tasksAffected": 0}}'::jsonb),
        (project_id, 'Accelerated Delivery', 'Fast-track Wave 2 migration with additional resources to meet Q3 deadline', '{"status": "draft", "createdDate": "2024-08-01", "modifiedDate": "2024-08-05", "author": "John Doe", "adjustments": [{"id": "adj-1", "type": "acceleration", "taskId": "T-012", "taskName": "Wave 2 Migration", "field": "duration", "originalValue": 61, "newValue": 45, "unit": "days"}, {"id": "adj-2", "type": "resource", "taskId": "T-012", "taskName": "Wave 2 Migration", "field": "resources", "originalValue": 3, "newValue": 5, "unit": "FTEs"}, {"id": "adj-3", "type": "acceleration", "taskId": "T-013", "taskName": "Data Migration", "field": "duration", "originalValue": 77, "newValue": 60, "unit": "days"}], "impact": {"endDateChange": -16, "costChange": 150000, "riskLevel": "high", "criticalPathAffected": true, "tasksAffected": 3}}'::jsonb),
        (project_id, 'Risk Mitigation', 'Extended testing phase to reduce go-live risks and improve quality', '{"status": "draft", "createdDate": "2024-08-05", "modifiedDate": "2024-08-10", "author": "Emily Brown", "adjustments": [{"id": "adj-1", "type": "delay", "taskId": "T-015", "taskName": "Testing & Validation", "field": "duration", "originalValue": 90, "newValue": 120, "unit": "days"}, {"id": "adj-2", "type": "resource", "taskId": "T-015", "taskName": "Testing & Validation", "field": "resources", "originalValue": 2, "newValue": 3, "unit": "FTEs"}], "impact": {"endDateChange": 30, "costChange": 75000, "riskLevel": "low", "criticalPathAffected": true, "tasksAffected": 2}}'::jsonb)
        ON CONFLICT DO NOTHING;

        -- Seed Strategic Insights
        -- Context
        INSERT INTO public.strategic_insights (project_id, type, data)
        VALUES (project_id, 'context', '{
            "aiReadiness": 0.78,
            "contextQuality": "good",
            "businessCase": {
                "objectives": [
                    "Reduce infrastructure costs by 30% within 2 years",
                    "Improve system reliability to 99.9% uptime",
                    "Enable faster feature deployment (2 weeks vs 2 months)",
                    "Meet regulatory compliance for data sovereignty"
                ],
                "successCriteria": [
                    {"id": "SC-001", "description": "Infrastructure cost reduction", "status": "on-track", "target": "30% reduction", "currentValue": "5% reduction"},
                    {"id": "SC-002", "description": "System uptime", "status": "at-risk", "target": "99.9%", "currentValue": "99.2%"},
                    {"id": "SC-003", "description": "Deployment frequency", "status": "on-track", "target": "4/month", "currentValue": "1/month"}
                ],
                "benefits": [
                    {"id": "B-001", "type": "financial", "description": "Annual infrastructure savings", "quantified": true, "value": 750000},
                    {"id": "B-002", "type": "operational", "description": "Reduced downtime impact", "quantified": true, "value": 200000},
                    {"id": "B-003", "type": "strategic", "description": "Market competitiveness", "quantified": false}
                ],
                "assumptions": [
                    {"id": "A-001", "status": "valid", "description": "Cloud provider pricing will remain stable", "impact": "Budget accuracy"},
                    {"id": "A-002", "status": "uncertain", "description": "Team will have adequate cloud skills", "impact": "Timeline and quality"}
                ]
            },
            "regulatoryFrameworks": [
                {"id": "REG-001", "name": "GDPR", "jurisdiction": "EU", "complianceStatus": "partially-compliant", "requirements": ["Data residency", "Right to erasure"], "deadline": "2024-12-31"},
                {"id": "REG-002", "name": "SOC 2", "jurisdiction": "US", "complianceStatus": "not-assessed", "requirements": ["Security controls", "Availability"]}
            ],
            "operatingConstraints": [
                {"id": "OC-001", "flexibility": "fixed", "description": "Q4 code freeze (Nov 15 - Dec 31)", "type": "timeline", "impact": "schedule"},
                {"id": "OC-002", "flexibility": "negotiable", "description": "Senior cloud architects limited to 2 FTEs", "type": "resource", "impact": "scope"}
            ],
            "stakeholderPowerMap": {
                "stakeholders": [
                    {"id": "STK-001", "name": "CEO", "role": "Executive Sponsor", "power": "high", "interest": "medium", "attitude": "supporter", "engagementStrategy": "Monthly briefings"},
                    {"id": "STK-002", "name": "CTO", "role": "Technical Sponsor", "power": "high", "interest": "high", "attitude": "champion", "engagementStrategy": "Weekly steering committee"}
                ],
                "relationships": [
                    {"from": "STK-002", "to": "STK-001", "type": "reports-to", "strength": "strong"}
                ]
            }
        }'::jsonb)
        ON CONFLICT DO NOTHING;

        -- Risk Discovery
        INSERT INTO public.strategic_insights (project_id, type, data)
        VALUES (project_id, 'risk-discovery', '{
            "discoveredRisks": [
                {
                    "id": "AI-RISK-001",
                    "title": "Q4 Code Freeze Creates Compressed Testing Window",
                    "description": "Insufficient buffer for post-go-live issues due to Nov 15 freeze.",
                    "confidence": 0.87,
                    "probability": "high",
                    "impact": "high",
                    "source": "pattern-matching",
                    "explanation": "Analysis indicates only 2 weeks for stabilization.",
                    "dataSupport": [
                        {"description": "Historical stabilization avg", "value": "4 weeks"},
                        {"description": "Current buffer", "value": "2 weeks"}
                    ]
                }
            ],
            "hiddenRisks": [
                {
                    "id": "HIDDEN-001",
                    "title": "Knowledge Concentration Risk",
                    "confidence": 0.75,
                    "inference": "Critical knowledge in 2 members only.",
                    "indicators": ["80% tasks to Mike Johnson"],
                    "recommendation": "Knowledge transfer sessions."
                }
            ],
            "timingRisks": [
                {
                    "id": "TIME-001",
                    "type": "seasonal",
                    "period": "Dec 15 - Jan 5",
                    "description": "Holiday period reduces capacity by 40%.",
                    "impact": "Significant cascade if delayed.",
                    "mitigation": "Build 2-week buffer."
                }
            ]
        }'::jsonb)
        ON CONFLICT DO NOTHING;

        -- Value Engineering
        INSERT INTO public.strategic_insights (project_id, type, data)
        VALUES (project_id, 'value-engineering', '{
            "options": [
                {
                    "id": "OPT-001",
                    "name": "Standard Phased Migration",
                    "description": "Existing plan with sequential wave approach.",
                    "cost": 2500000,
                    "roi": 0.28,
                    "riskScore": 4,
                    "timeImpact": 0,
                    "pros": ["Proven methodology", "Balanced workload"],
                    "cons": ["Slower ROI realization"]
                },
                {
                    "id": "OPT-002",
                    "name": "Accelerated Wave 2",
                    "description": "Parallelize Wave 2 tasks with additional FTEs.",
                    "cost": 2850000,
                    "roi": 0.35,
                    "riskScore": 6,
                    "timeImpact": -25,
                    "pros": ["Faster time-to-market", "Higher total ROI"],
                    "cons": ["Increased burn rate", "Resource contention risk"]
                }
            ],
            "recommendation": {
                "selectedOption": "OPT-001",
                "justification": "Provides best balance of risk and reward given current skill levels.",
                "confidence": 0.85
            },
            "tradeoffAnalysis": {
                "optimalPoint": "Phased Approach",
                "costVsTime": {
                    "points": [{"label": "Standard", "y": 0, "isOptimal": true}, {"label": "Accelerated", "y": -25, "isOptimal": false}],
                    "recommendation": "Standard approach avoids critical path volatility."
                },
                "costVsRisk": {
                    "points": [{"label": "Standard", "y": 4, "isOptimal": true}, {"label": "Accelerated", "y": 6, "isOptimal": false}],
                    "recommendation": "Lower risk score preferred for initial cloud transition."
                }
            }
        }'::jsonb)
        ON CONFLICT DO NOTHING;

    END IF;
END $$;
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
