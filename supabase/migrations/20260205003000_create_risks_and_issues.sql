-- Create risks table
CREATE TABLE IF NOT EXISTS public.risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    probability TEXT CHECK (probability IN ('low', 'medium', 'high', 'critical')),
    impact TEXT CHECK (impact IN ('low', 'medium', 'high', 'critical')),
    status TEXT CHECK (status IN ('identified', 'analyzing', 'mitigating', 'monitoring', 'closed')) DEFAULT 'identified',
    owner_name TEXT,
    mitigation_plan TEXT,
    contingency_plan TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS for risks
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- Policies for risks
CREATE POLICY "Users can view risks of their projects"
    ON public.risks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.risks.project_id
        )
    );

CREATE POLICY "Users can insert risks into their projects"
    ON public.risks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.risks.project_id
            AND role IN ('owner', 'admin', 'manager', 'member')
        )
    );

CREATE POLICY "Users can update risks of their projects"
    ON public.risks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.risks.project_id
            AND role IN ('owner', 'admin', 'manager', 'member')
        )
    );

CREATE POLICY "Users can delete risks of their projects"
    ON public.risks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.risks.project_id
            AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Trigger for updated_at on risks
CREATE TRIGGER handle_updated_at_risks
    BEFORE UPDATE ON public.risks
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();


-- Create issues table
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('bug', 'blocker', 'impediment', 'defect', 'incident')),
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT CHECK (status IN ('open', 'investigating', 'in-progress', 'blocked', 'resolved', 'closed')) DEFAULT 'open',
    reporter_name TEXT,
    assignee_name TEXT,
    affected_areas TEXT[],
    root_cause TEXT,
    resolution TEXT,
    sla_target_resolution TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS for issues
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Policies for issues
CREATE POLICY "Users can view issues of their projects"
    ON public.issues FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.issues.project_id
        )
    );

CREATE POLICY "Users can insert issues into their projects"
    ON public.issues FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.issues.project_id
            AND role IN ('owner', 'admin', 'manager', 'member')
        )
    );

CREATE POLICY "Users can update issues of their projects"
    ON public.issues FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.issues.project_id
            AND role IN ('owner', 'admin', 'manager', 'member')
        )
    );

CREATE POLICY "Users can delete issues of their projects"
    ON public.issues FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.issues.project_id
            AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Trigger for updated_at on issues
CREATE TRIGGER handle_updated_at_issues
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
