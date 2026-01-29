-- ============================================
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
CREATE INDEX idx_meeting_notes_meeting_id ON public.meeting_notes(meeting_id);