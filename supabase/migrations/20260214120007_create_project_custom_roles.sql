-- Create project_custom_roles table for project-specific role customization
-- This allows Project Managers to define custom roles and modify standard roles per project

CREATE TABLE IF NOT EXISTS project_custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL, -- e.g., 'project_manager', 'custom_architect'
  role_name TEXT NOT NULL,
  role_description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'User',
  is_custom BOOLEAN DEFAULT false, -- true if user-created, false if modified standard
  based_on_role TEXT, -- original role if modified from standard
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(project_id, role_id)
);

-- Create index for faster lookups by project
CREATE INDEX IF NOT EXISTS idx_project_custom_roles_project ON project_custom_roles(project_id);

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_project_custom_roles_role ON project_custom_roles(project_id, role_id);

-- Enable RLS
ALTER TABLE project_custom_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view roles for projects they're members of
CREATE POLICY "Users can view project roles they have access to"
  ON project_custom_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.project_id = project_custom_roles.project_id
      AND user_roles.user_id = auth.uid()
    )
  );

-- Policy: Project managers can manage roles
CREATE POLICY "Project managers can manage custom roles"
  ON project_custom_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.project_id = project_custom_roles.project_id
      AND user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'pm')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_project_custom_roles_updated_at
  BEFORE UPDATE ON project_custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
