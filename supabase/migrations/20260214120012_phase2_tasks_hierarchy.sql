-- Phase 2: Tasks & Work Management
-- Migration for task hierarchy, cross-project features, templates, and comments

-- ============================================
-- MODIFY TASKS TABLE
-- ============================================

-- Add hierarchy columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);

-- Add visibility and sharing
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visibility_scope TEXT DEFAULT 'project' 
    CHECK (visibility_scope IN ('private', 'project', 'program', 'portfolio', 'workspace', 'tenant'));

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS shared_across_program BOOLEAN DEFAULT false;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS milestone_type TEXT DEFAULT 'project'
    CHECK (milestone_type IN ('project', 'program', 'portfolio'));

-- Add metadata
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by_user_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ============================================
-- TASK TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Template Info
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT DEFAULT 'task' CHECK (template_type IN ('task', 'milestone', 'phase', 'workstream')),
    
    -- Template Data (stores task structure)
    task_data JSONB NOT NULL DEFAULT '{
        "name": "",
        "type": "task",
        "duration": 1,
        "priority": "medium",
        "assignee_id": null,
        "notes": ""
    }'::jsonb,
    
    -- Scope
    scope TEXT DEFAULT 'workspace' CHECK (scope IN ('program', 'portfolio', 'workspace', 'tenant')),
    
    -- Category
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0
);

-- ============================================
-- TASK COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Comment Content
    content TEXT NOT NULL,
    
    -- Mentions & Links
    mentioned_users UUID[] DEFAULT '{}',
    mentioned_tasks UUID[] DEFAULT '{}',
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false
);

-- ============================================
-- TASK LINKS (Cross-references)
-- ============================================

CREATE TABLE IF NOT EXISTS task_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source task
    source_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    source_project_id UUID NOT NULL REFERENCES projects(id),
    
    -- Target task
    target_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    target_project_id UUID NOT NULL REFERENCES projects(id),
    
    -- Link type
    link_type TEXT DEFAULT 'related' CHECK (link_type IN ('related', 'blocks', 'blocked-by', 'duplicates', 'parent-of', 'child-of')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID,
    
    UNIQUE(source_task_id, target_task_id, link_type)
);

-- ============================================
-- INDEXES
-- ============================================

-- Task hierarchy indexes
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_portfolio ON tasks(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_tasks_program ON tasks(program_id);
CREATE INDEX IF NOT EXISTS idx_tasks_visibility ON tasks(visibility_scope);
CREATE INDEX IF NOT EXISTS idx_tasks_shared ON tasks(shared_across_program) WHERE shared_across_program = true;
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_type ON tasks(milestone_type);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN(tags);

-- Task template indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_tenant ON task_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_workspace ON task_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_program ON task_templates(program_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_scope ON task_templates(scope);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_tags ON task_templates USING GIN(tags);

-- Task comment indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_project ON task_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_by ON task_comments(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);

-- Task link indexes
CREATE INDEX IF NOT EXISTS idx_task_links_source ON task_links(source_task_id);
CREATE INDEX IF NOT EXISTS idx_task_links_target ON task_links(target_task_id);
CREATE INDEX IF NOT EXISTS idx_task_links_type ON task_links(link_type);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;

-- Task template policies
CREATE POLICY "Anyone can view task templates" ON task_templates FOR SELECT USING (true);
CREATE POLICY "System can manage task templates" ON task_templates FOR ALL USING (true);

-- Task comment policies
CREATE POLICY "Anyone can view task comments" ON task_comments FOR SELECT USING (true);
CREATE POLICY "System can manage task comments" ON task_comments FOR ALL USING (true);

-- Task link policies
CREATE POLICY "Anyone can view task links" ON task_links FOR SELECT USING (true);
CREATE POLICY "System can manage task links" ON task_links FOR ALL USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to populate task hierarchy from project
CREATE OR REPLACE FUNCTION populate_task_hierarchy()
RETURNS void AS $$
BEGIN
    UPDATE tasks t
    SET 
        tenant_id = p.tenant_id,
        workspace_id = p.workspace_id,
        portfolio_id = p.portfolio_id,
        program_id = p.program_id
    FROM projects p
    WHERE t.project_id = p.id
    AND t.tenant_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get task hierarchy
CREATE OR REPLACE FUNCTION get_task_hierarchy(p_task_id UUID)
RETURNS TABLE (
    tenant_id UUID,
    workspace_id UUID,
    portfolio_id UUID,
    program_id UUID,
    project_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tenant_id,
        t.workspace_id,
        t.portfolio_id,
        t.program_id,
        t.project_id
    FROM tasks t
    WHERE t.id = p_task_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get visible tasks for user based on scope
CREATE OR REPLACE FUNCTION get_visible_tasks_for_scope(
    p_user_id UUID,
    p_scope TEXT,
    p_scope_id UUID
)
RETURNS TABLE (
    id UUID,
    project_id UUID,
    name TEXT,
    status task_status,
    visibility_scope TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.project_id,
        t.name,
        t.status,
        t.visibility_scope
    FROM tasks t
    WHERE 
        CASE p_scope
            WHEN 'project' THEN t.project_id = p_scope_id
            WHEN 'program' THEN t.program_id = p_scope_id
            WHEN 'portfolio' THEN t.portfolio_id = p_scope_id
            WHEN 'workspace' THEN t.workspace_id = p_scope_id
            WHEN 'tenant' THEN t.tenant_id = p_scope_id
        END
    AND (
        t.visibility_scope = p_scope
        OR t.visibility_scope IN ('program', 'portfolio', 'workspace', 'tenant')
    );
END;
$$ LANGUAGE plpgsql;

-- Function to detect circular dependencies
CREATE OR REPLACE FUNCTION check_circular_dependency(
    p_source_task_id UUID,
    p_target_task_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    has_circular BOOLEAN;
BEGIN
    -- Check if adding this dependency would create a cycle
    WITH RECURSIVE dep_chain AS (
        -- Start with the proposed target
        SELECT target_task_id as task_id
        FROM cross_project_dependencies
        WHERE source_task_id = p_target_task_id
        
        UNION
        
        -- Follow the chain
        SELECT cpd.target_task_id
        FROM cross_project_dependencies cpd
        INNER JOIN dep_chain dc ON cpd.source_task_id = dc.task_id
    )
    SELECT EXISTS(
        SELECT 1 FROM dep_chain WHERE task_id = p_source_task_id
    ) INTO has_circular;
    
    RETURN has_circular;
END;
$$ LANGUAGE plpgsql;

-- Function to update task template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment usage count when template is used
    UPDATE task_templates
    SET usage_count = usage_count + 1
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update task comment edited timestamp
CREATE OR REPLACE FUNCTION update_comment_edited_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content != OLD.content THEN
        NEW.is_edited = true;
        NEW.edited_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment edits
CREATE TRIGGER update_task_comment_edited
    BEFORE UPDATE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_edited_timestamp();

-- ============================================
-- DATA POPULATION
-- ============================================

-- Populate hierarchy for existing tasks
SELECT populate_task_hierarchy();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE task_templates IS 'Reusable task templates for quick task creation';
COMMENT ON TABLE task_comments IS 'Comments and discussions on tasks';
COMMENT ON TABLE task_links IS 'Cross-references between tasks (non-dependency relationships)';

COMMENT ON COLUMN tasks.visibility_scope IS 'Controls who can see this task: private, project, program, portfolio, workspace, tenant';
COMMENT ON COLUMN tasks.shared_across_program IS 'If true, task is visible to all projects in the program';
COMMENT ON COLUMN tasks.milestone_type IS 'Level of milestone: project, program, or portfolio';
