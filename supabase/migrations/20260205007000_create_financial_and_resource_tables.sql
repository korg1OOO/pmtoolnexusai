-- Create project_budget_items table
CREATE TABLE IF NOT EXISTS public.project_budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Personnel', 'Contractors', 'Infrastructure', 'Software', 'Training', 'Contingency', 'Travel', 'Other')),
    planned NUMERIC(15, 2) DEFAULT 0,
    actual NUMERIC(15, 2) DEFAULT 0,
    forecast NUMERIC(15, 2) DEFAULT 0,
    variance NUMERIC(15, 2) GENERATED ALWAYS AS (planned - actual) STORED,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(project_id, category)
);

-- Enable RLS for budget items
ALTER TABLE public.project_budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget items of their projects"
    ON public.project_budget_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.project_budget_items.project_id));

CREATE POLICY "Users can manage budget items of their projects"
    ON public.project_budget_items FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.project_budget_items.project_id AND role IN ('owner', 'admin', 'manager')));

-- Create project_invoices table
CREATE TABLE IF NOT EXISTS public.project_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    status TEXT CHECK (status IN ('paid', 'sent', 'pending', 'cancelled')) DEFAULT 'pending',
    milestone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS for invoices
ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices of their projects"
    ON public.project_invoices FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.project_invoices.project_id));

CREATE POLICY "Users can manage invoices of their projects"
    ON public.project_invoices FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.project_invoices.project_id AND role IN ('owner', 'admin', 'manager')));

-- Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    type TEXT CHECK (type IN ('work', 'material', 'cost', 'equipment')) DEFAULT 'work',
    max_units INTEGER DEFAULT 100,
    standard_rate NUMERIC(15, 2) DEFAULT 0,
    overtime_rate NUMERIC(15, 2) DEFAULT 0,
    cost_per_use NUMERIC(15, 2) DEFAULT 0,
    calendar_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS for resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view resources of their projects"
    ON public.resources FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.resources.project_id));

CREATE POLICY "Users can manage resources of their projects"
    ON public.resources FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.resources.project_id AND role IN ('owner', 'admin', 'manager')));

-- Create resource_assignments table
CREATE TABLE IF NOT EXISTS public.resource_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL, -- Assuming tasks table exists or will be created. Making it nullable if task doesn't exist yet but usually distinct.
    -- Wait, tasks table might not be created yet? I see mockTasks but real tasks might be in a 'tasks' table.
    -- Assuming 'tasks' table exists from previous phases or will be. 
    -- If 'tasks' strictly refers to project_tasks (if that's the name), I should check.
    -- Based on useResources, it queries 'tasks' table. 
    -- I will assume 'tasks' table exists or use UUID.
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    units INTEGER DEFAULT 100,
    work_hours NUMERIC(10, 2) DEFAULT 0,
    actual_work_hours NUMERIC(10, 2) DEFAULT 0,
    remaining_work_hours NUMERIC(10, 2) DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    cost NUMERIC(15, 2) DEFAULT 0,
    actual_cost NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS for resource_assignments
ALTER TABLE public.resource_assignments ENABLE ROW LEVEL SECURITY;

-- Note: Policies for assignments rely on project access. 
-- Since task_id links to tasks, we need to know the project_id via task or resource.
-- Resource links to project, so we can verify via resource_id.

CREATE POLICY "Users can view assignments of their project resources"
    ON public.resource_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.resources r
            JOIN public.user_roles ur ON ur.project_id = r.project_id
            WHERE r.id = public.resource_assignments.resource_id
            AND ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage assignments of their project resources"
    ON public.resource_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.resources r
            JOIN public.user_roles ur ON ur.project_id = r.project_id
            WHERE r.id = public.resource_assignments.resource_id
            AND ur.user_id = auth.uid()
            AND ur.role IN ('owner', 'admin', 'manager')
        )
    );

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_budget BEFORE UPDATE ON public.project_budget_items FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at_invoices BEFORE UPDATE ON public.project_invoices FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at_resources BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at_assignments BEFORE UPDATE ON public.resource_assignments FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
