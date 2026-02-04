-- Create scenarios table
CREATE TABLE IF NOT EXISTS public.scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    base_plan_snapshot_id UUID, -- Optional link to a snapshot if we use that system
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    data JSONB -- For flexible storage of specific scenario meta-data
);

-- Add Index on project_id for scenarios
CREATE INDEX IF NOT EXISTS idx_scenarios_project_id ON public.scenarios(project_id);

-- Add scenario_id to tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE;

-- Add Index on scenario_id for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_scenario_id ON public.tasks(scenario_id);

-- Add scenario_id to task_dependencies
ALTER TABLE public.task_dependencies 
ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE;

-- Add Index on scenario_id for task_dependencies
CREATE INDEX IF NOT EXISTS idx_task_dependencies_scenario_id ON public.task_dependencies(scenario_id);

-- RLS Policies for scenarios
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.scenarios
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.scenarios
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.scenarios
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.scenarios
    FOR DELETE USING (auth.role() = 'authenticated');
