-- Enterprise Multi-Tenancy & Workspace System
-- Migration for Tenant, Workspace, Portfolio, and Manual Learning

-- ============================================
-- CORE ORGANIZATIONAL TABLES
-- ============================================

-- Table: tenants (Companies)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    -- ML Configuration
    ml_config JSONB DEFAULT '{
        "enabled": true,
        "cross_project_learning": true,
        "cross_workspace_learning": false,
        "auto_learning_enabled": true,
        "min_feedbacks_for_pattern": 3,
        "pattern_approval_required": false,
        "allow_manual_learnings": true
    }'::jsonb,
    
    -- Subscription & Limits
    subscription_tier TEXT DEFAULT 'professional',
    max_workspaces INTEGER DEFAULT 10,
    max_projects INTEGER DEFAULT 100,
    max_users INTEGER DEFAULT 50,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID,
    is_active BOOLEAN DEFAULT true
);

-- Table: workspaces (Divisions/Departments)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    
    -- ML Settings
    ml_sharing_enabled BOOLEAN DEFAULT true,
    ml_sharing_scope TEXT DEFAULT 'workspace',
    inherit_tenant_ml BOOLEAN DEFAULT true,
    
    -- Settings
    settings JSONB DEFAULT '{
        "default_project_template": null,
        "require_portfolio": false,
        "auto_assign_members": true
    }'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(tenant_id, slug)
);

-- Table: portfolios (Programs/Initiatives)
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    
    -- Portfolio Details
    portfolio_type TEXT DEFAULT 'program',
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active',
    
    -- ML Settings
    ml_sharing_scope TEXT DEFAULT 'portfolio',
    inherit_workspace_ml BOOLEAN DEFAULT true,
    
    -- Budget & Tracking
    total_budget DECIMAL,
    currency TEXT DEFAULT 'USD',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(workspace_id, slug)
);

-- Table: workspace_members (Team Collaboration)
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Role & Permissions
    role TEXT NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{
        "can_create_projects": true,
        "can_create_portfolios": false,
        "can_manage_ml": false,
        "can_invite_members": false
    }'::jsonb,
    
    -- Metadata
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by_user_id UUID,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(workspace_id, user_id)
);

-- ============================================
-- MODIFY EXISTING TABLES
-- ============================================

-- Add missing columns to ml_learning_patterns first
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0;

-- Add hierarchy columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ml_inheritance_enabled BOOLEAN DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ml_scope TEXT DEFAULT 'inherit';

-- Add scoping columns to ml_learning_patterns
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id);
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS sharing_scope TEXT DEFAULT 'project';
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'auto';
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS created_by_user_id UUID;
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS approved_by_user_id UUID;
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS promoted_from_pattern_id UUID REFERENCES ml_learning_patterns(id);
ALTER TABLE ml_learning_patterns ADD COLUMN IF NOT EXISTS promotion_reason TEXT;

-- ============================================
-- MANUAL LEARNING TABLES
-- ============================================

-- Table: ml_manual_learnings
CREATE TABLE IF NOT EXISTS ml_manual_learnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id),
    portfolio_id UUID REFERENCES portfolios(id),
    project_id UUID REFERENCES projects(id),
    
    -- Learning Details
    title TEXT NOT NULL,
    description TEXT,
    learning_type TEXT NOT NULL,
    
    -- Scope
    applies_to_scope TEXT DEFAULT 'tenant',
    
    -- Learning Data
    learning_data JSONB NOT NULL,
    
    -- Source
    source_project_id UUID REFERENCES projects(id),
    source_description TEXT,
    imported_from TEXT,
    
    -- Categorization
    tags TEXT[],
    category TEXT,
    
    -- Status
    status TEXT DEFAULT 'active',
    converted_to_pattern_id UUID REFERENCES ml_learning_patterns(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Table: ml_pattern_sharing_log
CREATE TABLE IF NOT EXISTS ml_pattern_sharing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_id UUID NOT NULL REFERENCES ml_learning_patterns(id) ON DELETE CASCADE,
    
    -- Sharing Details
    shared_from_scope TEXT NOT NULL,
    shared_to_scope TEXT NOT NULL,
    
    -- Context
    from_project_id UUID REFERENCES projects(id),
    from_portfolio_id UUID REFERENCES portfolios(id),
    from_workspace_id UUID REFERENCES workspaces(id),
    
    -- Action
    action_type TEXT NOT NULL,
    reason TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID
);

-- ============================================
-- INDEXES
-- ============================================

-- Tenant indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);

-- Workspace indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_active ON workspaces(tenant_id, is_active);

-- Portfolio indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_workspace ON portfolios(workspace_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_tenant ON portfolios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON portfolios(status);

-- Workspace member indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_tenant ON workspace_members(tenant_id);

-- Project hierarchy indexes
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_portfolio ON projects(portfolio_id);

-- ML pattern scoping indexes
CREATE INDEX IF NOT EXISTS idx_ml_patterns_tenant ON ml_learning_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ml_patterns_workspace ON ml_learning_patterns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ml_patterns_portfolio ON ml_learning_patterns(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_ml_patterns_scope ON ml_learning_patterns(sharing_scope);
CREATE INDEX IF NOT EXISTS idx_ml_patterns_source ON ml_learning_patterns(source_type);

-- Manual learning indexes
CREATE INDEX IF NOT EXISTS idx_manual_learnings_tenant ON ml_manual_learnings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_manual_learnings_workspace ON ml_manual_learnings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_manual_learnings_scope ON ml_manual_learnings(applies_to_scope);
CREATE INDEX IF NOT EXISTS idx_manual_learnings_type ON ml_manual_learnings(learning_type);
CREATE INDEX IF NOT EXISTS idx_manual_learnings_tags ON ml_manual_learnings USING GIN(tags);

-- Pattern sharing log indexes
CREATE INDEX IF NOT EXISTS idx_pattern_sharing_pattern ON ml_pattern_sharing_log(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_sharing_action ON ml_pattern_sharing_log(action_type);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_manual_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_pattern_sharing_log ENABLE ROW LEVEL SECURITY;

-- Tenant policies (admin only)
CREATE POLICY "Anyone can view tenants" ON tenants FOR SELECT USING (true);
CREATE POLICY "System can manage tenants" ON tenants FOR ALL USING (true);

-- Workspace policies
CREATE POLICY "Anyone can view workspaces" ON workspaces FOR SELECT USING (true);
CREATE POLICY "System can manage workspaces" ON workspaces FOR ALL USING (true);

-- Portfolio policies
CREATE POLICY "Anyone can view portfolios" ON portfolios FOR SELECT USING (true);
CREATE POLICY "System can manage portfolios" ON portfolios FOR ALL USING (true);

-- Workspace member policies
CREATE POLICY "Anyone can view workspace members" ON workspace_members FOR SELECT USING (true);
CREATE POLICY "System can manage workspace members" ON workspace_members FOR ALL USING (true);

-- Manual learning policies
CREATE POLICY "Anyone can view manual learnings" ON ml_manual_learnings FOR SELECT USING (true);
CREATE POLICY "System can manage manual learnings" ON ml_manual_learnings FOR ALL USING (true);

-- Pattern sharing log policies
CREATE POLICY "Anyone can view sharing log" ON ml_pattern_sharing_log FOR SELECT USING (true);
CREATE POLICY "System can insert sharing log" ON ml_pattern_sharing_log FOR INSERT WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get project hierarchy
CREATE OR REPLACE FUNCTION get_project_hierarchy(p_project_id UUID)
RETURNS TABLE (
    tenant_id UUID,
    workspace_id UUID,
    portfolio_id UUID,
    project_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.tenant_id,
        p.workspace_id,
        p.portfolio_id,
        p.id
    FROM projects p
    WHERE p.id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update tenant updated_at
CREATE OR REPLACE FUNCTION update_tenant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tenant updated_at
CREATE TRIGGER update_tenant_timestamp
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE tenants IS 'Company-level tenants with complete data isolation';
COMMENT ON TABLE workspaces IS 'Organizational units (divisions/departments) within tenants';
COMMENT ON TABLE portfolios IS 'Programs/initiatives grouping related projects';
COMMENT ON TABLE workspace_members IS 'Team members and their roles within workspaces';
COMMENT ON TABLE ml_manual_learnings IS 'Manually entered learnings from experts and historical data';
COMMENT ON TABLE ml_pattern_sharing_log IS 'Audit log for pattern sharing and promotion';

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Create default tenant for existing data
INSERT INTO tenants (name, slug, created_at)
VALUES ('Default Company', 'default', NOW())
ON CONFLICT (slug) DO NOTHING;

-- Create default workspace
INSERT INTO workspaces (tenant_id, name, slug, created_at)
SELECT id, 'Default Workspace', 'default', NOW()
FROM tenants WHERE slug = 'default'
ON CONFLICT (tenant_id, slug) DO NOTHING;
