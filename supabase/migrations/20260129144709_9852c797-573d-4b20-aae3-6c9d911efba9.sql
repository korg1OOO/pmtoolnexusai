-- Create custom enum types
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
  EXECUTE FUNCTION public.check_action_sla_breach();