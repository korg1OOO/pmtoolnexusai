
-- ============================================
-- Phase 1: Create 15 missing tables + add FK columns
-- ============================================

-- 1. TENANTS
CREATE TABLE public.tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    ml_config JSONB NOT NULL DEFAULT '{"enabled":true,"cross_project_learning":true,"cross_workspace_learning":false,"auto_learning_enabled":true,"min_feedbacks_for_pattern":3,"pattern_approval_required":false,"allow_manual_learnings":true}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    subscription_tier TEXT NOT NULL DEFAULT 'free',
    max_workspaces INTEGER NOT NULL DEFAULT 5,
    max_projects INTEGER NOT NULL DEFAULT 50,
    max_users INTEGER NOT NULL DEFAULT 25,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. WORKSPACES
CREATE TABLE public.workspaces (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    ml_sharing_enabled BOOLEAN NOT NULL DEFAULT true,
    ml_sharing_scope TEXT NOT NULL DEFAULT 'workspace',
    inherit_tenant_ml BOOLEAN NOT NULL DEFAULT true,
    settings JSONB NOT NULL DEFAULT '{"require_portfolio":false,"auto_assign_members":true}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, slug)
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 3. WORKSPACE_MEMBERS
CREATE TABLE public.workspace_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    permissions JSONB NOT NULL DEFAULT '{"can_create_projects":false,"can_create_portfolios":false,"can_manage_ml":false,"can_invite_members":false}'::jsonb,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(workspace_id, user_id)
);
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 4. DEPARTMENTS
CREATE TABLE public.departments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    budget NUMERIC DEFAULT 0,
    spent NUMERIC DEFAULT 0,
    manager_id UUID,
    member_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 5. LICENSES
CREATE TABLE public.licenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    license_type TEXT NOT NULL,
    total_licenses INTEGER NOT NULL DEFAULT 0,
    allocated_licenses INTEGER NOT NULL DEFAULT 0,
    price_per_license NUMERIC,
    renewal_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- 6. LICENSE_KEYS
CREATE TABLE public.license_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'pro',
    status TEXT NOT NULL DEFAULT 'active',
    max_uses INTEGER NOT NULL DEFAULT 1,
    current_uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- 7. DISCOUNT_CODES
CREATE TABLE public.discount_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC NOT NULL DEFAULT 0,
    max_uses INTEGER,
    current_uses INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    applicable_plans TEXT[] DEFAULT '{}',
    created_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- 8. TEAM_MEMBERS
CREATE TABLE public.team_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID,
    role TEXT DEFAULT 'member',
    skills TEXT[] DEFAULT '{}',
    allocation_percentage INTEGER DEFAULT 0,
    availability_status TEXT DEFAULT 'available',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 9. PROJECT_MEMBERS
CREATE TABLE public.project_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(project_id, user_id)
);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 10. PROJECT_CUSTOM_ROLES
CREATE TABLE public.project_custom_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    role_description TEXT,
    permissions TEXT[] DEFAULT '{}',
    color TEXT DEFAULT '#6b7280',
    icon TEXT DEFAULT 'Users',
    is_custom BOOLEAN NOT NULL DEFAULT true,
    based_on_role TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, role_id)
);
ALTER TABLE public.project_custom_roles ENABLE ROW LEVEL SECURITY;

-- 11. WORKSPACE_BUDGETS
CREATE TABLE public.workspace_budgets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    total_budget NUMERIC NOT NULL DEFAULT 0,
    allocated_budget NUMERIC NOT NULL DEFAULT 0,
    spent_budget NUMERIC NOT NULL DEFAULT 0,
    variance NUMERIC NOT NULL DEFAULT 0,
    forecast NUMERIC NOT NULL DEFAULT 0,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workspace_budgets ENABLE ROW LEVEL SECURITY;

-- 12. WORKSPACE_RESOURCES
CREATE TABLE public.workspace_resources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    resource_name TEXT NOT NULL,
    resource_type TEXT NOT NULL DEFAULT 'member',
    total_capacity NUMERIC NOT NULL DEFAULT 100,
    allocated_capacity NUMERIC NOT NULL DEFAULT 0,
    available_capacity NUMERIC NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workspace_resources ENABLE ROW LEVEL SECURITY;

-- 13. AI_PROVIDER_API_KEYS
CREATE TABLE public.ai_provider_api_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_provider_api_keys ENABLE ROW LEVEL SECURITY;

-- 14. SPREADSHEET_COMMENTS
CREATE TABLE public.spreadsheet_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    spreadsheet_id UUID NOT NULL,
    cell_reference TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID NOT NULL,
    user_name TEXT,
    resolved BOOLEAN NOT NULL DEFAULT false,
    parent_id UUID REFERENCES public.spreadsheet_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.spreadsheet_comments ENABLE ROW LEVEL SECURITY;

-- 15. WORKSPACE_TEAMS
CREATE TABLE public.workspace_teams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID,
    role TEXT DEFAULT 'member',
    skills TEXT[] DEFAULT '{}',
    allocation_percentage INTEGER DEFAULT 0,
    availability_status TEXT DEFAULT 'available',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workspace_teams ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Add workspace_id and tenant_id to existing tables
-- ============================================
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
ALTER TABLE public.user_tenants ADD COLUMN IF NOT EXISTS tenant_name TEXT;

-- ============================================
-- RLS Policies (using text cast for user_tenants.tenant_id)
-- ============================================

CREATE POLICY "Users can view their tenants" ON public.tenants
    FOR SELECT USING (
        id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their tenants" ON public.tenants
    FOR UPDATE USING (
        id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Users can insert tenants" ON public.tenants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view workspaces in their tenant" ON public.workspaces
    FOR SELECT USING (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can insert workspaces" ON public.workspaces
    FOR INSERT WITH CHECK (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Admins can update workspaces" ON public.workspaces
    FOR UPDATE USING (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Admins can delete workspaces" ON public.workspaces
    FOR DELETE USING (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Users can view workspace members" ON public.workspace_members
    FOR SELECT USING (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can insert workspace members" ON public.workspace_members
    FOR INSERT WITH CHECK (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Admins can update workspace members" ON public.workspace_members
    FOR UPDATE USING (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Admins can delete workspace members" ON public.workspace_members
    FOR DELETE USING (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Users can view departments" ON public.departments
    FOR SELECT USING (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage departments" ON public.departments
    FOR ALL USING (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Users can view licenses" ON public.licenses
    FOR SELECT USING (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage licenses" ON public.licenses
    FOR ALL USING (
        tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "Admins can manage license keys" ON public.license_keys
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage discount codes" ON public.discount_codes
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view team members" ON public.team_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Admins can manage team members" ON public.team_members
    FOR ALL USING (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        )
    );

CREATE POLICY "Users can view project members" ON public.project_members
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage project members" ON public.project_members
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view project roles" ON public.project_custom_roles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage project roles" ON public.project_custom_roles
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view workspace budgets" ON public.workspace_budgets
    FOR SELECT USING (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Admins can manage workspace budgets" ON public.workspace_budgets
    FOR ALL USING (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        )
    );

CREATE POLICY "Users can view workspace resources" ON public.workspace_resources
    FOR SELECT USING (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Admins can manage workspace resources" ON public.workspace_resources
    FOR ALL USING (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        )
    );

CREATE POLICY "Admins can manage AI provider keys" ON public.ai_provider_api_keys
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view spreadsheet comments" ON public.spreadsheet_comments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their comments" ON public.spreadsheet_comments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view workspace teams" ON public.workspace_teams
    FOR SELECT USING (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Admins can manage workspace teams" ON public.workspace_teams
    FOR ALL USING (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.tenant_id::text IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        )
    );

-- ============================================
-- Triggers
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_license_keys_updated_at BEFORE UPDATE ON public.license_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON public.discount_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workspace_budgets_updated_at BEFORE UPDATE ON public.workspace_budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workspace_resources_updated_at BEFORE UPDATE ON public.workspace_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_provider_api_keys_updated_at BEFORE UPDATE ON public.ai_provider_api_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_spreadsheet_comments_updated_at BEFORE UPDATE ON public.spreadsheet_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_custom_roles_updated_at BEFORE UPDATE ON public.project_custom_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_workspaces_tenant_id ON public.workspaces(tenant_id);
CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX idx_departments_tenant_id ON public.departments(tenant_id);
CREATE INDEX idx_licenses_tenant_id ON public.licenses(tenant_id);
CREATE INDEX idx_team_members_workspace_id ON public.team_members(workspace_id);
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_workspace_teams_workspace_id ON public.workspace_teams(workspace_id);
CREATE INDEX idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX idx_projects_tenant_id ON public.projects(tenant_id);
CREATE INDEX idx_programs_workspace_id ON public.programs(workspace_id);
CREATE INDEX idx_programs_tenant_id ON public.programs(tenant_id);
CREATE INDEX idx_portfolios_workspace_id ON public.portfolios(workspace_id);
CREATE INDEX idx_portfolios_tenant_id ON public.portfolios(tenant_id);
