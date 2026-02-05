-- Create decisions table
CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    key TEXT,
    title TEXT NOT NULL,
    decision TEXT NOT NULL,
    context TEXT,
    impact TEXT,
    alternatives TEXT[] DEFAULT '{}',
    status TEXT CHECK (status IN ('pending', 'active', 'superseded', 'rejected')) DEFAULT 'pending',
    owner_name TEXT,
    date TIMESTAMPTZ DEFAULT now(),
    linked_tasks TEXT[] DEFAULT '{}',
    linked_risks TEXT[] DEFAULT '{}',
    linked_meetings TEXT[] DEFAULT '{}',
    linked_items JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS for decisions
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- Policies for decisions
CREATE POLICY "Users can view decisions of their projects"
    ON public.decisions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.decisions.project_id
        )
    );

CREATE POLICY "Users can insert decisions into their projects"
    ON public.decisions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.decisions.project_id
            AND role::text IN ('owner', 'admin', 'manager', 'member')
        )
    );

CREATE POLICY "Users can update decisions of their projects"
    ON public.decisions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND project_id = public.decisions.project_id
            AND role::text IN ('owner', 'admin', 'manager', 'member')
        )
    );

CREATE POLICY "Users can delete decisions of their projects"
    ON public.decisions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role::text IN ('admin', 'pm')
        )
    );

-- Trigger for updated_at on decisions
CREATE TRIGGER handle_updated_at_decisions
    BEFORE UPDATE ON public.decisions
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Create index on key
CREATE INDEX IF NOT EXISTS idx_decisions_key ON public.decisions(key);
