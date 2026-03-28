CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'on-track' CHECK (status IN ('completed', 'on-track', 'at-risk', 'overdue')),
    due_date DATE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    dependencies INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view milestones in their projects" ON project_milestones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.project_id = project_milestones.project_id
            AND user_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert milestones in their projects" ON project_milestones
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.project_id = project_milestones.project_id
            AND user_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update milestones in their projects" ON project_milestones
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.project_id = project_milestones.project_id
            AND user_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete milestones in their projects" ON project_milestones
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.project_id = project_milestones.project_id
            AND user_roles.user_id = auth.uid()
        )
    );

-- Grant permissions to authenticated users to fix 403 Forbidden
GRANT ALL ON project_milestones TO authenticated;
