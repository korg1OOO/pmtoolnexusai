-- Phase 1: Programs and Core Hierarchy
-- Migration for Programs table and project hierarchy enhancements

-- ============================================
-- PROGRAMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    
    -- Basic Info
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    
    -- Program Details
    program_type TEXT DEFAULT 'standard' CHECK (program_type IN ('standard', 'strategic', 'operational', 'transformation')),
    status TEXT DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')),
    health TEXT DEFAULT 'green' CHECK (health IN ('green', 'amber', 'red')),
    
    -- Dates & Budget
    start_date DATE,
    end_date DATE,
    total_budget DECIMAL(15,2) DEFAULT 0,
    spent_budget DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    
    -- Ownership
    program_manager_id UUID,
    sponsor_id UUID,
    
    -- Settings
    settings JSONB DEFAULT '{
        "auto_rollup_status": true,
        "auto_rollup_budget": true,
        "auto_rollup_progress": true,
        "allow_cross_project_dependencies": true,
        "require_project_approval": false
    }'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(tenant_id, code)
);

-- ============================================
-- MODIFY PROJECTS TABLE
-- ============================================

-- Add program reference
ALTER TABLE projects ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);

-- Add inheritance settings
ALTER TABLE projects ADD COLUMN IF NOT EXISTS inheritance_settings JSONB DEFAULT '{
    "inherit_templates": true,
    "inherit_resources": true,
    "inherit_risks": false,
    "inherit_decisions": false,
    "inherit_documents": false
}'::jsonb;

-- Add program-level visibility
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility_scope TEXT DEFAULT 'program' CHECK (visibility_scope IN ('private', 'program', 'portfolio', 'workspace', 'tenant'));

-- ============================================
-- PROGRAM MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS program_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Role & Permissions
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('manager', 'lead', 'member', 'viewer')),
    permissions JSONB DEFAULT '{
        "can_create_projects": true,
        "can_edit_program": false,
        "can_manage_members": false,
        "can_view_financials": true,
        "can_approve_changes": false
    }'::jsonb,
    
    -- Metadata
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by_user_id UUID,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(program_id, user_id)
);

-- ============================================
-- PROGRAM MILESTONES
-- ============================================

CREATE TABLE IF NOT EXISTS program_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Milestone Info
    name TEXT NOT NULL,
    description TEXT,
    milestone_type TEXT DEFAULT 'program' CHECK (milestone_type IN ('program', 'phase', 'gate', 'deliverable')),
    
    -- Dates
    target_date DATE NOT NULL,
    actual_date DATE,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'missed', 'cancelled')),
    
    -- Linked Items
    linked_project_tasks JSONB DEFAULT '[]'::jsonb,
    dependencies JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- CROSS-PROJECT DEPENDENCIES
-- ============================================

CREATE TABLE IF NOT EXISTS cross_project_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Source (predecessor)
    source_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Target (successor)
    target_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    target_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Dependency Details
    dependency_type TEXT DEFAULT 'FS' CHECK (dependency_type IN ('FS', 'SS', 'FF', 'SF')),
    lag INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'blocked')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID,
    
    UNIQUE(source_task_id, target_task_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Program indexes
CREATE INDEX IF NOT EXISTS idx_programs_tenant ON programs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_programs_workspace ON programs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_programs_portfolio ON programs(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code);

-- Program member indexes
CREATE INDEX IF NOT EXISTS idx_program_members_program ON program_members(program_id);
CREATE INDEX IF NOT EXISTS idx_program_members_user ON program_members(user_id);
CREATE INDEX IF NOT EXISTS idx_program_members_tenant ON program_members(tenant_id);

-- Program milestone indexes
CREATE INDEX IF NOT EXISTS idx_program_milestones_program ON program_milestones(program_id);
CREATE INDEX IF NOT EXISTS idx_program_milestones_status ON program_milestones(status);
CREATE INDEX IF NOT EXISTS idx_program_milestones_date ON program_milestones(target_date);

-- Cross-project dependency indexes
CREATE INDEX IF NOT EXISTS idx_cross_deps_program ON cross_project_dependencies(program_id);
CREATE INDEX IF NOT EXISTS idx_cross_deps_source_project ON cross_project_dependencies(source_project_id);
CREATE INDEX IF NOT EXISTS idx_cross_deps_target_project ON cross_project_dependencies(target_project_id);
CREATE INDEX IF NOT EXISTS idx_cross_deps_source_task ON cross_project_dependencies(source_task_id);
CREATE INDEX IF NOT EXISTS idx_cross_deps_target_task ON cross_project_dependencies(target_task_id);

-- Project program index
CREATE INDEX IF NOT EXISTS idx_projects_program ON projects(program_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_project_dependencies ENABLE ROW LEVEL SECURITY;

-- Program policies
CREATE POLICY "Anyone can view programs" ON programs FOR SELECT USING (true);
CREATE POLICY "System can manage programs" ON programs FOR ALL USING (true);

-- Program member policies
CREATE POLICY "Anyone can view program members" ON program_members FOR SELECT USING (true);
CREATE POLICY "System can manage program members" ON program_members FOR ALL USING (true);

-- Program milestone policies
CREATE POLICY "Anyone can view program milestones" ON program_milestones FOR SELECT USING (true);
CREATE POLICY "System can manage program milestones" ON program_milestones FOR ALL USING (true);

-- Cross-project dependency policies
CREATE POLICY "Anyone can view cross-project dependencies" ON cross_project_dependencies FOR SELECT USING (true);
CREATE POLICY "System can manage cross-project dependencies" ON cross_project_dependencies FOR ALL USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get program hierarchy
CREATE OR REPLACE FUNCTION get_program_hierarchy(p_program_id UUID)
RETURNS TABLE (
    tenant_id UUID,
    workspace_id UUID,
    portfolio_id UUID,
    program_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.tenant_id,
        p.workspace_id,
        p.portfolio_id,
        p.id
    FROM programs p
    WHERE p.id = p_program_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get program projects count
CREATE OR REPLACE FUNCTION get_program_projects_count(p_program_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM projects
        WHERE program_id = p_program_id
        AND status != 'cancelled'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate program health (rollup from projects)
CREATE OR REPLACE FUNCTION calculate_program_health(p_program_id UUID)
RETURNS TEXT AS $$
DECLARE
    red_count INTEGER;
    amber_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE health = 'red'),
        COUNT(*) FILTER (WHERE health = 'amber'),
        COUNT(*)
    INTO red_count, amber_count, total_count
    FROM projects
    WHERE program_id = p_program_id
    AND status IN ('active', 'on-hold');
    
    IF total_count = 0 THEN
        RETURN 'green';
    END IF;
    
    IF red_count > 0 OR (amber_count::FLOAT / total_count) > 0.3 THEN
        RETURN 'red';
    ELSIF amber_count > 0 THEN
        RETURN 'amber';
    ELSE
        RETURN 'green';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update program updated_at
CREATE OR REPLACE FUNCTION update_program_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for program updated_at
CREATE TRIGGER update_program_timestamp
    BEFORE UPDATE ON programs
    FOR EACH ROW
    EXECUTE FUNCTION update_program_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE programs IS 'Programs group related projects for coordinated delivery';
COMMENT ON TABLE program_members IS 'Team members and their roles within programs';
COMMENT ON TABLE program_milestones IS 'Key milestones tracked at program level';
COMMENT ON TABLE cross_project_dependencies IS 'Dependencies between tasks across different projects';

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Create default program for existing projects
INSERT INTO programs (tenant_id, workspace_id, portfolio_id, name, code, created_at)
SELECT 
    t.id,
    w.id,
    p.id,
    'Default Program',
    'DEFAULT',
    NOW()
FROM tenants t
CROSS JOIN workspaces w
CROSS JOIN portfolios p
WHERE t.slug = 'default' 
  AND w.slug = 'default'
  AND p.slug = 'default'
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Update existing projects to link to default program
UPDATE projects
SET program_id = (
    SELECT id FROM programs WHERE code = 'DEFAULT' LIMIT 1
)
WHERE program_id IS NULL;
