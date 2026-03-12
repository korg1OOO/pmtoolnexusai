-- Users table for user management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    avatar_url TEXT,
    phone TEXT,
    job_title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspace_id);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read all users in their tenant
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM auth.users WHERE id = auth.uid()));

-- Allow admins to insert users
CREATE POLICY users_insert_policy ON users
    FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM auth.users WHERE id = auth.uid() AND role = 'admin'));

-- Allow admins to update users
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM auth.users WHERE id = auth.uid() AND role = 'admin'));

-- Allow admins to delete users
CREATE POLICY users_delete_policy ON users
    FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM auth.users WHERE id = auth.uid() AND role = 'admin'));

-- User roles table for role-based access control
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update user_roles if it exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'role_name') THEN
        ALTER TABLE user_roles ADD COLUMN role_name TEXT;
        -- If 'role' column exists (from previous schema), copy it
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'role') THEN
            UPDATE user_roles SET role_name = role::text WHERE role_name IS NULL;
        END IF;
        -- Default for new rows or if role was null/missing
        UPDATE user_roles SET role_name = 'member' WHERE role_name IS NULL;
        ALTER TABLE user_roles ALTER COLUMN role_name SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'permissions') THEN
        ALTER TABLE user_roles ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'assigned_by') THEN
        ALTER TABLE user_roles ADD COLUMN assigned_by UUID REFERENCES users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'assigned_at') THEN
        ALTER TABLE user_roles ADD COLUMN assigned_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'expires_at') THEN
        ALTER TABLE user_roles ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'is_active') THEN
        ALTER TABLE user_roles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Ensure updated_at exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'updated_at') THEN
        ALTER TABLE user_roles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_name ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

-- RLS Policies for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_roles_select_policy ON user_roles
    FOR SELECT
    USING (user_id IN (SELECT id FROM users WHERE tenant_id IN (SELECT tenant_id FROM auth.users WHERE id = auth.uid())));

CREATE POLICY user_roles_insert_policy ON user_roles
    FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM users WHERE tenant_id IN (SELECT tenant_id FROM auth.users WHERE id = auth.uid() AND role = 'admin')));

CREATE POLICY user_roles_update_policy ON user_roles
    FOR UPDATE
    USING (user_id IN (SELECT id FROM users WHERE tenant_id IN (SELECT tenant_id FROM auth.users WHERE id = auth.uid() AND role = 'admin')));

CREATE POLICY user_roles_delete_policy ON user_roles
    FOR DELETE
    USING (user_id IN (SELECT id FROM users WHERE tenant_id IN (SELECT tenant_id FROM auth.users WHERE id = auth.uid() AND role = 'admin')));
