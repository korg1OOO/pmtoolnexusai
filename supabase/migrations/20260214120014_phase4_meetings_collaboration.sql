-- ============================================
-- PHASE 4: MEETINGS & COLLABORATION
-- ============================================
-- This migration adds program-level meetings,
-- cross-project collaboration, action items,
-- and meeting templates.

-- ============================================
-- 1. MODIFY MEETINGS TABLE
-- ============================================

-- Add hierarchy columns
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id);
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);

-- Add meeting scope
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_scope TEXT DEFAULT 'project' 
    CHECK (meeting_scope IN ('project', 'program', 'portfolio', 'workspace', 'tenant'));

-- Add meeting type
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_type TEXT DEFAULT 'general'
    CHECK (meeting_type IN ('general', 'standup', 'planning', 'review', 'retrospective', 'steering', 'status'));

-- Add recurrence
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS parent_meeting_id UUID REFERENCES meetings(id);

-- Add metadata
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS template_id UUID;

-- ============================================
-- 2. MEETING ATTENDEES
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Attendance
    role TEXT DEFAULT 'participant' 
        CHECK (role IN ('organizer', 'required', 'optional', 'participant')),
    status TEXT DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'declined', 'tentative', 'attended', 'absent')),
    
    -- Response
    response_at TIMESTAMPTZ,
    response_note TEXT,
    
    -- Metadata
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by_user_id UUID,
    
    UNIQUE(meeting_id, user_id)
);

-- ============================================
-- 3. MEETING ACTION ITEMS (Modify existing table)
-- ============================================

-- Table already exists, just add missing columns if needed
ALTER TABLE meeting_action_items ADD COLUMN IF NOT EXISTS assigned_by_user_id UUID;
ALTER TABLE meeting_action_items ADD COLUMN IF NOT EXISTS created_by_user_id UUID;

-- ============================================
-- 4. MEETING TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Template Info
    name TEXT NOT NULL,
    description TEXT,
    meeting_type TEXT DEFAULT 'general',
    
    -- Template Content
    agenda TEXT,
    default_duration INTEGER DEFAULT 60, -- minutes
    default_attendees JSONB DEFAULT '[]'::jsonb,
    
    -- Scope
    scope TEXT DEFAULT 'workspace' 
        CHECK (scope IN ('program', 'portfolio', 'workspace', 'tenant')),
    
    -- Usage
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 5. MEETING NOTES (Table already exists)
-- ============================================

-- Table already exists with different schema, skip creation

-- ============================================
-- 6. COLLABORATION SPACES
-- ============================================

CREATE TABLE IF NOT EXISTS collaboration_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Space Info
    name TEXT NOT NULL,
    description TEXT,
    purpose TEXT,
    
    -- Projects Involved
    project_ids UUID[] NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'archived', 'completed')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID NOT NULL
);

-- ============================================
-- 7. COLLABORATION SPACE MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS collaboration_space_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES collaboration_spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    project_id UUID REFERENCES projects(id),
    
    -- Role
    role TEXT DEFAULT 'member' 
        CHECK (role IN ('owner', 'moderator', 'member')),
    
    -- Metadata
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    added_by_user_id UUID,
    
    UNIQUE(space_id, user_id)
);

-- ============================================
-- 8. INDEXES
-- ============================================

-- Meetings indexes
CREATE INDEX IF NOT EXISTS idx_meetings_tenant_id ON meetings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meetings_workspace_id ON meetings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meetings_portfolio_id ON meetings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_meetings_program_id ON meetings(program_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scope ON meetings(meeting_scope);
CREATE INDEX IF NOT EXISTS idx_meetings_type ON meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_meetings_recurring ON meetings(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_meetings_parent ON meetings(parent_meeting_id);
CREATE INDEX IF NOT EXISTS idx_meetings_tags ON meetings USING GIN(tags);

-- Meeting attendees indexes
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user_id ON meeting_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_status ON meeting_attendees(status);

-- Meeting action items indexes
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_meeting_id ON meeting_action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_owner ON meeting_action_items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_status ON meeting_action_items(status);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_due_date ON meeting_action_items(due_date);

-- Meeting templates indexes
CREATE INDEX IF NOT EXISTS idx_meeting_templates_tenant_id ON meeting_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meeting_templates_workspace_id ON meeting_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meeting_templates_program_id ON meeting_templates(program_id);
CREATE INDEX IF NOT EXISTS idx_meeting_templates_scope ON meeting_templates(scope);
CREATE INDEX IF NOT EXISTS idx_meeting_templates_active ON meeting_templates(is_active) WHERE is_active = true;

-- Meeting notes indexes
CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON meeting_notes(meeting_id);

-- Collaboration spaces indexes
CREATE INDEX IF NOT EXISTS idx_collaboration_spaces_program_id ON collaboration_spaces(program_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_spaces_status ON collaboration_spaces(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_spaces_project_ids ON collaboration_spaces USING GIN(project_ids);

-- Collaboration space members indexes
CREATE INDEX IF NOT EXISTS idx_collaboration_space_members_space_id ON collaboration_space_members(space_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_space_members_user_id ON collaboration_space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_space_members_project_id ON collaboration_space_members(project_id);

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Populate meeting hierarchy from project
CREATE OR REPLACE FUNCTION populate_meeting_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL THEN
        SELECT 
            p.tenant_id,
            p.workspace_id,
            p.portfolio_id,
            p.program_id
        INTO 
            NEW.tenant_id,
            NEW.workspace_id,
            NEW.portfolio_id,
            NEW.program_id
        FROM projects p
        WHERE p.id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER populate_meeting_hierarchy_trigger
    BEFORE INSERT OR UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION populate_meeting_hierarchy();

-- Update action item timestamp
CREATE OR REPLACE FUNCTION update_action_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_action_item_timestamp_trigger
    BEFORE UPDATE ON meeting_action_items
    FOR EACH ROW
    EXECUTE FUNCTION update_action_item_timestamp();

-- Update meeting note timestamp
CREATE OR REPLACE FUNCTION update_meeting_note_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meeting_note_timestamp_trigger
    BEFORE UPDATE ON meeting_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_meeting_note_timestamp();

-- Increment template usage
CREATE OR REPLACE FUNCTION increment_meeting_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE meeting_templates
        SET usage_count = usage_count + 1
        WHERE id = NEW.template_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_meeting_template_usage_trigger
    AFTER INSERT ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION increment_meeting_template_usage();

-- Update collaboration space timestamp
CREATE OR REPLACE FUNCTION update_collaboration_space_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collaboration_space_timestamp_trigger
    BEFORE UPDATE ON collaboration_spaces
    FOR EACH ROW
    EXECUTE FUNCTION update_collaboration_space_timestamp();

-- ============================================
-- 10. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_space_members ENABLE ROW LEVEL SECURITY;

-- Meeting attendees policies
CREATE POLICY "Users can view attendees of meetings they are part of"
    ON meeting_attendees FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM meeting_attendees ma
            WHERE ma.meeting_id = meeting_attendees.meeting_id
            AND ma.user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can manage attendees"
    ON meeting_attendees FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM meeting_attendees ma
            WHERE ma.meeting_id = meeting_attendees.meeting_id
            AND ma.user_id = auth.uid()
            AND ma.role = 'organizer'
        )
    );

-- Meeting action items policies
CREATE POLICY "Users can view action items from meetings they attend"
    ON meeting_action_items FOR SELECT
    USING (
        owner_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM meeting_attendees ma
            WHERE ma.meeting_id = meeting_action_items.meeting_id
            AND ma.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own action items"
    ON meeting_action_items FOR UPDATE
    USING (owner_user_id = auth.uid());

-- Meeting templates policies
CREATE POLICY "Users can view active templates in their scope"
    ON meeting_templates FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users can create templates"
    ON meeting_templates FOR INSERT
    WITH CHECK (created_by_user_id = auth.uid());

-- Meeting notes policies
CREATE POLICY "Users can view notes from meetings they attend"
    ON meeting_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM meeting_attendees ma
            WHERE ma.meeting_id = meeting_notes.meeting_id
            AND ma.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create notes in meetings they attend"
    ON meeting_notes FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM meeting_attendees ma
            WHERE ma.meeting_id = meeting_notes.meeting_id
            AND ma.user_id = auth.uid()
        )
    );

-- Collaboration spaces policies
CREATE POLICY "Users can view spaces they are members of"
    ON collaboration_spaces FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM collaboration_space_members csm
            WHERE csm.space_id = collaboration_spaces.id
            AND csm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create collaboration spaces"
    ON collaboration_spaces FOR INSERT
    WITH CHECK (created_by_user_id = auth.uid());

-- Collaboration space members policies
CREATE POLICY "Users can view members of spaces they belong to"
    ON collaboration_space_members FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM collaboration_space_members csm
            WHERE csm.space_id = collaboration_space_members.space_id
            AND csm.user_id = auth.uid()
        )
    );

CREATE POLICY "Space owners can manage members"
    ON collaboration_space_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM collaboration_space_members csm
            WHERE csm.space_id = collaboration_space_members.space_id
            AND csm.user_id = auth.uid()
            AND csm.role = 'owner'
        )
    );
