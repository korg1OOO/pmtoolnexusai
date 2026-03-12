-- ============================================================
-- Phase 12 Database Migration: Roles & RTM
-- Apply in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Platform-level role definitions (platform + tenant scoped)
CREATE TABLE IF NOT EXISTS platform_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  scope text NOT NULL DEFAULT 'platform',   -- 'platform' | 'tenant'
  tenant_id uuid,                            -- only set for tenant-scoped roles
  is_system_role boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Role → Feature permission mapping
CREATE TABLE IF NOT EXISTS platform_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES platform_roles(id) ON DELETE CASCADE,
  feature_key text NOT NULL,                 -- e.g. 'financials.approve'
  is_enabled boolean DEFAULT false,
  UNIQUE(role_id, feature_key)
);

-- 3. User → Platform Role assignments
CREATE TABLE IF NOT EXISTS platform_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES platform_roles(id) ON DELETE CASCADE,
  tenant_id uuid,
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id, tenant_id)
);

-- 4. Platform Features catalog
CREATE TABLE IF NOT EXISTS platform_features (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text DEFAULT 'CORE',             -- 'CORE' | 'ADVANCED' | 'EXPERIMENTAL'
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Immutable Role Audit Log
CREATE TABLE IF NOT EXISTS platform_role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,                     -- 'CREATE_ROLE' | 'DELETE_ROLE' | 'TOGGLE_PERMISSION' | 'ASSIGN_ROLE' | 'REVOKE_ROLE'
  role_id uuid,
  user_id uuid,
  feature_key text,
  before_state jsonb,
  after_state jsonb,
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 6. Requirements Traceability Matrix items
CREATE TABLE IF NOT EXISTS requirement_traceability_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  code text,
  requirement text,
  description text,
  process text,
  module text,
  department text,
  owner text,
  consultant text,
  date date,
  meeting_reference text,
  status text DEFAULT 'Open',              -- 'Open' | 'In Review' | 'Approved' | 'Rejected' | 'Deferred' | 'Implemented'
  custom_fields jsonb DEFAULT '{}',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_platform_roles_scope ON platform_roles(scope);
CREATE INDEX IF NOT EXISTS idx_platform_roles_tenant ON platform_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_role_permissions_role ON platform_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_platform_user_roles_user ON platform_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_user_roles_role ON platform_user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_rtm_project ON requirement_traceability_items(project_id, sort_order);

-- ─── Enable Row Level Security ────────────────────────────────────────────────
ALTER TABLE platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_role_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_traceability_items ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ────────────────────────────────────────────────────────────
-- Read (all authenticated users)
CREATE POLICY IF NOT EXISTS "roles_read_all"        ON platform_roles           FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "perms_read_all"         ON platform_role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "user_roles_read_all"    ON platform_user_roles      FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "features_read_all"      ON platform_features        FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "audit_read_all"         ON platform_role_audit_log  FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "rtm_read_all"           ON requirement_traceability_items FOR SELECT TO authenticated USING (true);

-- Write (authenticated users — further gated in app via RBAC)
CREATE POLICY IF NOT EXISTS "roles_write_auth"       ON platform_roles           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "perms_write_auth"       ON platform_role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "user_roles_write_auth"  ON platform_user_roles      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "features_write_service" ON platform_features        FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "audit_insert_auth"      ON platform_role_audit_log  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "rtm_write_auth"         ON requirement_traceability_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Seed System Roles ────────────────────────────────────────────────────────
INSERT INTO platform_roles (name, description, scope, is_system_role)
VALUES
  ('Super Admin',     'Full platform access',              'platform', true),
  ('Project Manager', 'Manage projects and teams',         'platform', true),
  ('Team Member',     'View and contribute to projects',   'platform', true),
  ('Viewer',          'Read-only access',                  'platform', true),
  ('Finance Analyst', 'Financial data management',          'platform', true),
  ('Risk Officer',    'Risk register management',          'platform', true)
ON CONFLICT (name) DO NOTHING;
