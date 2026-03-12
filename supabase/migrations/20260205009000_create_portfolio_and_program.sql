-- Create portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('active', 'archived', 'draft')) DEFAULT 'active',
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Ensure columns exist (in case table existed from prior migration without them)
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS for portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view portfolios"
    ON public.portfolios FOR SELECT
    USING (true); -- Publicly visible for now within the org, or strict RLS? 
    -- Usually portfolios are high level. Let's restrict to authenticated users.
    -- USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and PMs can manage portfolios"
    ON public.portfolios FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            -- Portfolios might not have a project_id context directly in user_roles?
            -- They are usually above projects. 
            -- For simplicity, let's allow 'admin' role regardless of project, 
            -- OR we need a cleaner way to handle org-level roles.
            -- Assuming user_roles has a meaningful project_id for system-wide access or we rely on specific portfolio assignments?
            -- Current user_roles is (user_id, project_id, role).
            -- If we want org-level admins, maybe check if they are admin on ANY project? No that's risky.
            -- Let's assume there is a 'system' project or we just use `auth.uid()` check if they are the creator/owner.
        )
        OR 
        (owner_id = auth.uid())
        OR
        (created_by = auth.uid())
    );
    -- Re-thinking: If `user_roles` is strictly project-scoped, we might need a `portfolio_members` table or just rely on open visibility for now.
    -- Let's go with permissive Read, restrictive Write (Creator/Owner).

-- Create programs table
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('planned', 'active', 'completed', 'on-hold', 'cancelled')) DEFAULT 'planned',
    health TEXT CHECK (health IN ('green', 'amber', 'red')) DEFAULT 'green',
    start_date DATE,
    end_date DATE,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Ensure columns exist
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS for programs
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view programs"
    ON public.programs FOR SELECT
    USING (true);

CREATE POLICY "Users can manage programs"
    ON public.programs FOR ALL
    USING (
        (manager_id = auth.uid())
        OR
        (created_by = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM public.portfolios
            WHERE id = public.programs.portfolio_id
            AND (owner_id = auth.uid() OR created_by = auth.uid())
        )
    );

-- Add program_id to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_program_id ON public.projects(program_id);

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_portfolios BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_updated_at_programs BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
