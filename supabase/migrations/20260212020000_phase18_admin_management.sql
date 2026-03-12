/**
 * Phase 18 Database Migration: Admin User Management
 * Creates tables for admin roles, permissions, and activity logging
 */

-- =============================================
-- ADMIN ROLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system_role BOOLEAN DEFAULT false, -- cannot be deleted if true
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create default roles
INSERT INTO admin_roles (name, description, permissions, is_system_role) VALUES
('super_admin', 'Full system access', '{
  "users": ["create", "read", "update", "delete"],
  "subscriptions": ["create", "read", "update", "delete"],
  "billing": ["create", "read", "update", "delete"],
  "discounts": ["create", "read", "update", "delete"],
  "licenses": ["create", "read", "update", "delete"],
  "analytics": ["read"],
  "admin_management": ["create", "read", "update", "delete"],
  "settings": ["create", "read", "update", "delete"]
}'::jsonb, true),

('admin', 'Standard admin access', '{
  "users": ["read", "update"],
  "subscriptions": ["read", "update"],
  "billing": ["read"],
  "discounts": ["create", "read", "update"],
  "licenses": ["create", "read", "update"],
  "analytics": ["read"],
  "settings": ["read"]
}'::jsonb, true),

('support', 'Customer support access', '{
  "users": ["read"],
  "subscriptions": ["read"],
  "billing": ["read"],
  "discounts": ["read"],
  "licenses": ["read"],
  "analytics": ["read"]
}'::jsonb, true),

('viewer', 'Read-only access', '{
  "users": ["read"],
  "subscriptions": ["read"],
  "billing": ["read"],
  "discounts": ["read"],
  "licenses": ["read"],
  "analytics": ["read"]
}'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- ADMIN USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES admin_roles(id),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create index for active admins
CREATE INDEX IF NOT EXISTS idx_admin_users_active 
ON admin_users(user_id) 
WHERE revoked_at IS NULL;

-- =============================================
-- ADMIN ACTIVITY LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_resource ON admin_activity_log(resource_type, resource_id);

-- =============================================
-- VIEWS
-- =============================================

-- Active admin users with role information
CREATE OR REPLACE VIEW active_admin_users AS
SELECT 
  au.user_id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  ar.name as role_name,
  ar.description as role_description,
  ar.permissions,
  au.granted_at,
  au.granted_by
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
JOIN admin_roles ar ON au.role_id = ar.id
WHERE au.revoked_at IS NULL
ORDER BY au.granted_at DESC;

-- Admin activity summary
CREATE OR REPLACE VIEW admin_activity_summary AS
SELECT 
  admin_user_id,
  u.email as admin_email,
  DATE_TRUNC('day', aal.created_at) as activity_date,
  COUNT(*) as action_count,
  COUNT(DISTINCT resource_type) as resource_types_affected,
  array_agg(DISTINCT action) as unique_actions
FROM admin_activity_log aal
JOIN auth.users u ON aal.admin_user_id = u.id
GROUP BY admin_user_id, u.email, DATE_TRUNC('day', aal.created_at)
ORDER BY activity_date DESC;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION check_admin_permission(
  p_user_id UUID,
  p_resource TEXT,
  p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_permissions JSONB;
  v_resource_permissions TEXT[];
BEGIN
  -- Get user's role permissions
  SELECT ar.permissions
  INTO v_permissions
  FROM admin_users au
  JOIN admin_roles ar ON au.role_id = ar.id
  WHERE au.user_id = p_user_id
    AND au.revoked_at IS NULL;
  
  -- If no role found, return false
  IF v_permissions IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get permissions for the resource
  SELECT array_agg(value::TEXT)
  INTO v_resource_permissions
  FROM jsonb_array_elements_text(v_permissions->p_resource);
  
  -- Check if action is in permissions
  RETURN p_action = ANY(v_resource_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_activity_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_admin_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at on admin_roles
CREATE OR REPLACE FUNCTION update_admin_role_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_role_timestamp();

-- =============================================
-- RLS POLICIES (Strict - admin access only)
-- =============================================

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin roles - only super admins can manage
CREATE POLICY admin_roles_select ON admin_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
        AND (ar.permissions->'admin_management')::jsonb ? 'read'
    )
  );

CREATE POLICY admin_roles_insert ON admin_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
        AND (ar.permissions->'admin_management')::jsonb ? 'create'
    )
  );

CREATE POLICY admin_roles_update ON admin_roles
  FOR UPDATE USING (
    is_system_role = false
    AND EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
        AND (ar.permissions->'admin_management')::jsonb ? 'update'
    )
  );

-- Admin users - can view if admin
CREATE POLICY admin_users_select ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
    )
  );

-- Admin activity log - can view own or if admin
CREATE POLICY admin_activity_log_select ON admin_activity_log
  FOR SELECT USING (
    admin_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
        AND (ar.permissions->'admin_management')::jsonb ? 'read'
    )
  );

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE admin_roles IS 'Defines admin roles with granular permissions';
COMMENT ON TABLE admin_users IS 'Maps users to admin roles with grant/revoke tracking';
COMMENT ON TABLE admin_activity_log IS 'Comprehensive audit log of all admin actions';
COMMENT ON FUNCTION check_admin_permission IS 'Check if user has specific permission for resource';
COMMENT ON FUNCTION log_admin_activity IS 'Log admin action with context and metadata';
