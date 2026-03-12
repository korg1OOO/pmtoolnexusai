-- Create deliverables table
CREATE TABLE public.deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    phase TEXT,
    type TEXT CHECK (type IN ('document', 'system', 'process', 'training', 'other')),
    status TEXT CHECK (status IN ('not-started', 'in-progress', 'review', 'approved', 'rejected')) DEFAULT 'not-started',
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE,
    completed_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    acceptance_criteria JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view deliverables of their projects"
    ON public.deliverables FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.deliverables.project_id
        )
    );

CREATE POLICY "Users can insert deliverables into their projects"
    ON public.deliverables FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.deliverables.project_id
            AND role IN ('admin', 'pm', 'lead')
        )
    );

CREATE POLICY "Users can update deliverables of their projects"
    ON public.deliverables FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.deliverables.project_id
            AND role IN ('admin', 'pm', 'lead', 'developer', 'analyst')
        )
    );

CREATE POLICY "Users can delete deliverables of their projects"
    ON public.deliverables FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.deliverables.project_id
            AND role IN ('admin', 'pm')
        )
    );

-- Add junction table for linking deliverables to tasks
CREATE TABLE public.deliverable_tasks (
    deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (deliverable_id, task_id)
);

ALTER TABLE public.deliverable_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deliverable tasks"
    ON public.deliverable_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.deliverables
            JOIN public.user_roles ON public.deliverables.project_id = public.user_roles.project_id
            WHERE public.deliverables.id = public.deliverable_tasks.deliverable_id
            AND public.user_roles.user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_deliverables
    BEFORE UPDATE ON public.deliverables
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
