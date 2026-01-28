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
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_dependencies;