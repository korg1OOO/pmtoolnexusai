-- Add Agile types to task_type enum
ALTER TYPE public.task_type ADD VALUE IF NOT EXISTS 'story';
ALTER TYPE public.task_type ADD VALUE IF NOT EXISTS 'bug';
ALTER TYPE public.task_type ADD VALUE IF NOT EXISTS 'epic';

-- Create sprints table
CREATE TABLE IF NOT EXISTS public.sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK (status IN ('planned', 'active', 'completed', 'closed')) DEFAULT 'planned',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for sprints
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sprints of their projects"
    ON public.sprints FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.sprints.project_id));

CREATE POLICY "Users can manage sprints of their projects"
    ON public.sprints FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.sprints.project_id AND role IN ('owner', 'admin', 'manager')));

-- Add Agile columns to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS story_points INTEGER;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS acceptance_criteria TEXT;

-- Index for sprint lookups
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON public.tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON public.sprints(project_id);

-- Trigger for sprints updated_at
CREATE TRIGGER handle_updated_at_sprints BEFORE UPDATE ON public.sprints FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
