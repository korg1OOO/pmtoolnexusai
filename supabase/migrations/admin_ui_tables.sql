-- Admin UI Database Migration
-- Creates tables for Tenant, Workspace, Portfolio, and Program admin features

-- ============================================================================
-- 1. TENANT LEVEL TABLES
-- ============================================================================

-- Enhance tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'MM/DD/YYYY';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fiscal_year_start INTEGER DEFAULT 1;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email_settings JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  budget DECIMAL(15,2),
  spent DECIMAL(15,2) DEFAULT 0,
  manager_id UUID,  -- References user, but no FK constraint
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_id);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  license_type TEXT NOT NULL,
  total_licenses INTEGER NOT NULL,
  allocated_licenses INTEGER DEFAULT 0,
  price_per_license DECIMAL(10,2),
  renewal_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_tenant ON licenses(tenant_id);

-- ============================================================================
-- 2. WORKSPACE LEVEL TABLES
-- ============================================================================

-- Enhance workspaces table
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS spent DECIMAL(15,2) DEFAULT 0;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS resource_capacity INTEGER DEFAULT 0;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS resource_allocated INTEGER DEFAULT 0;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Workspace teams table
CREATE TABLE IF NOT EXISTS workspace_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,  -- References user, but no FK constraint
  role TEXT NOT NULL,
  allocation_percentage INTEGER DEFAULT 100 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  skills JSONB DEFAULT '[]',
  availability_status TEXT DEFAULT 'available',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_teams_workspace ON workspace_teams(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_teams_user ON workspace_teams(user_id);

-- ============================================================================
-- 3. PORTFOLIO LEVEL TABLES
-- ============================================================================

-- Enhance portfolios table
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS spent DECIMAL(15,2) DEFAULT 0;
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS expected_roi DECIMAL(15,2);
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS strategic_goals JSONB DEFAULT '[]';

-- Portfolio initiatives table
CREATE TABLE IF NOT EXISTS portfolio_initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planned',
  milestones INTEGER DEFAULT 0,
  dependencies JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_initiatives_portfolio ON portfolio_initiatives(portfolio_id);

-- Portfolio resources table
CREATE TABLE IF NOT EXISTS portfolio_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES programs(id),
  required INTEGER NOT NULL,
  allocated INTEGER DEFAULT 0,
  skills_needed JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_resources_portfolio ON portfolio_resources(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_resources_program ON portfolio_resources(program_id);

-- ============================================================================
-- 4. PROGRAM LEVEL TABLES
-- ============================================================================

-- Enhance programs table
ALTER TABLE programs ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS spent DECIMAL(15,2) DEFAULT 0;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS forecast DECIMAL(15,2);

-- Program stakeholders table
CREATE TABLE IF NOT EXISTS program_stakeholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  influence TEXT CHECK (influence IN ('high', 'medium', 'low')),
  interest TEXT CHECK (interest IN ('high', 'medium', 'low')),
  engagement_level TEXT CHECK (engagement_level IN ('champion', 'supporter', 'neutral', 'resistant')),
  satisfaction INTEGER CHECK (satisfaction >= 0 AND satisfaction <= 100),
  contact_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_stakeholders_program ON program_stakeholders(program_id);

-- Program resources table
CREATE TABLE IF NOT EXISTS program_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id),
  required INTEGER NOT NULL,
  allocated INTEGER DEFAULT 0,
  skills_needed JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_resources_program ON program_resources(program_id);
CREATE INDEX IF NOT EXISTS idx_program_resources_project ON program_resources(project_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_resources ENABLE ROW LEVEL SECURITY;

-- Departments RLS Policies
-- TODO: Add RLS policies after users table is available
-- CREATE POLICY "Users can view departments in their tenant"
--   ON departments FOR SELECT
--   USING (
--     tenant_id IN (
--       SELECT tenant_id FROM users WHERE id = auth.uid()
--     )
--   );

-- Licenses RLS Policies  
-- TODO: Add RLS policies after users table is available

-- Workspace Teams RLS Policies
-- TODO: Add RLS policies after users table is available

-- Portfolio Initiatives RLS Policies
-- TODO: Add RLS policies after users table is available

-- Portfolio Resources RLS Policies
-- TODO: Add RLS policies after users table is available

-- Program Stakeholders RLS Policies
-- TODO: Add RLS policies after users table is available

-- Program Resources RLS Policies
-- TODO: Add RLS policies after users table is available

-- ============================================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_initiatives_updated_at BEFORE UPDATE ON portfolio_initiatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_resources_updated_at BEFORE UPDATE ON portfolio_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_stakeholders_updated_at BEFORE UPDATE ON program_stakeholders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_resources_updated_at BEFORE UPDATE ON program_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
