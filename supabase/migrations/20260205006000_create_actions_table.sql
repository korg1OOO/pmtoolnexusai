-- Create actions table
CREATE TABLE IF NOT EXISTS public.actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('pending', 'in-progress', 'completed', 'deferred', 'cancelled')) DEFAULT 'pending',
    owner_name TEXT,
    created_by_name TEXT,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    progress INTEGER DEFAULT 0,
    notes TEXT,
    source_type TEXT,
    source_id TEXT,
    source_title TEXT,
    linked_items JSONB DEFAULT '[]'::jsonb,
    dependencies JSONB DEFAULT '[]'::jsonb,
    blocked_by TEXT,
    tags TEXT[] DEFAULT '{}',
    sla_target_hours INTEGER,
    sla_started_at TIMESTAMPTZ,
    sla_breached BOOLEAN DEFAULT false,
    sla_breached_at TIMESTAMPTZ,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS for actions
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- Policies for actions
CREATE POLICY "Users can view actions of their projects"
    ON public.actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.actions.project_id
        )
    );

CREATE POLICY "Users can insert actions into their projects"
    ON public.actions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.actions.project_id
            AND role::text IN ('owner', 'admin', 'manager', 'member')
        )
    );

CREATE POLICY "Users can update actions of their projects"
    ON public.actions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.actions.project_id
            AND role::text IN ('owner', 'admin', 'manager', 'member')
        )
    );

CREATE POLICY "Users can delete actions of their projects"
    ON public.actions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.actions.project_id
            AND role::text IN ('admin', 'pm')
        )
    );

-- Trigger for updated_at on actions
CREATE TRIGGER handle_updated_at_actions
    BEFORE UPDATE ON public.actions
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
