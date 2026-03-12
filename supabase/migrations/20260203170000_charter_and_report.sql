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
