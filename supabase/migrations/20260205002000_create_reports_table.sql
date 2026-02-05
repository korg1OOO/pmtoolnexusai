-- Create reports table
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('status', 'financial', 'resource', 'risk', 'custom')),
    category TEXT NOT NULL CHECK (category IN ('Status', 'Financial', 'Resource', 'Risk', 'Custom')),
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'on-demand')),
    last_generated TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    is_scheduled BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view reports of their projects"
    ON public.reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.reports.project_id
        )
    );

CREATE POLICY "Users can insert reports into their projects"
    ON public.reports FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.reports.project_id
            AND role IN ('owner', 'admin', 'manager')
        )
    );

CREATE POLICY "Users can update reports of their projects"
    ON public.reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.reports.project_id
            AND role IN ('owner', 'admin', 'manager')
        )
    );

CREATE POLICY "Users can delete reports of their projects"
    ON public.reports FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.reports.project_id
            AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_reports
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
