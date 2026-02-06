-- Create project_status_reports table
CREATE TABLE IF NOT EXISTS public.project_status_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    audience TEXT NOT NULL, /* steering-committee, sponsor, team, etc. */
    report_date TIMESTAMPTZ DEFAULT now(),
    content JSONB NOT NULL, /* Stores the full AI JSON structure */
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.project_status_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view status reports of their projects"
    ON public.project_status_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.project_status_reports.project_id
        )
    );

CREATE POLICY "Users can insert status reports"
    ON public.project_status_reports FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.project_status_reports.project_id
            AND role IN ('admin', 'pm', 'lead', 'developer', 'analyst')
        )
    );
