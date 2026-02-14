-- ============================================
-- PHASE 3: DOCUMENTS & KNOWLEDGE MANAGEMENT
-- ============================================
-- This migration adds hierarchical document sharing,
-- knowledge base, templates, version control, and
-- collaboration features.

-- ============================================
-- 1. MODIFY DOCUMENTS TABLE
-- ============================================

-- Add hierarchy columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES portfolios(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);

-- Add sharing scope
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sharing_scope TEXT DEFAULT 'project' 
    CHECK (sharing_scope IN ('private', 'project', 'program', 'portfolio', 'workspace', 'tenant', 'public'));

-- Add document type
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'document'
    CHECK (document_type IN ('document', 'knowledge_article', 'template', 'policy', 'procedure', 'guide'));

-- Add metadata
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS template_scope TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES documents(id);

-- ============================================
-- 2. DOCUMENT VERSION HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS document_version_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Version Content
    title TEXT NOT NULL,
    content TEXT,
    
    -- Change Info
    change_summary TEXT,
    changed_by_user_id UUID NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    file_size BIGINT,
    checksum TEXT,
    
    UNIQUE(document_id, version_number)
);

-- ============================================
-- 3. KNOWLEDGE BASE ARTICLES
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Article Info
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    
    -- Classification
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    article_type TEXT DEFAULT 'how-to' 
        CHECK (article_type IN ('how-to', 'troubleshooting', 'best-practice', 'faq', 'reference', 'tutorial')),
    
    -- Scope
    scope TEXT DEFAULT 'workspace' 
        CHECK (scope IN ('program', 'portfolio', 'workspace', 'tenant', 'public')),
    
    -- Status
    status TEXT DEFAULT 'draft' 
        CHECK (status IN ('draft', 'review', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Related
    related_articles UUID[],
    related_documents UUID[],
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID NOT NULL,
    last_reviewed_at TIMESTAMPTZ,
    reviewed_by_user_id UUID
);

-- ============================================
-- 4. DOCUMENT TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Template Info
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT DEFAULT 'document',
    
    -- Template Content
    content TEXT NOT NULL,
    placeholders JSONB DEFAULT '[]'::jsonb,
    
    -- Scope
    scope TEXT DEFAULT 'workspace' 
        CHECK (scope IN ('program', 'portfolio', 'workspace', 'tenant')),
    
    -- Category
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Usage
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 5. DOCUMENT COLLABORATORS
-- ============================================

CREATE TABLE IF NOT EXISTS document_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Permissions
    role TEXT DEFAULT 'viewer' 
        CHECK (role IN ('owner', 'editor', 'commenter', 'viewer')),
    
    -- Access
    can_edit BOOLEAN DEFAULT false,
    can_comment BOOLEAN DEFAULT true,
    can_share BOOLEAN DEFAULT false,
    
    -- Metadata
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by_user_id UUID,
    last_accessed_at TIMESTAMPTZ,
    
    UNIQUE(document_id, user_id)
);

-- ============================================
-- 6. DOCUMENT COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Comment
    content TEXT NOT NULL,
    
    -- Location (for inline comments)
    location_data JSONB,
    
    -- Thread
    parent_comment_id UUID REFERENCES document_comments(id),
    is_resolved BOOLEAN DEFAULT false,
    resolved_by_user_id UUID,
    resolved_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false
);

-- ============================================
-- 7. INDEXES
-- ============================================

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_portfolio_id ON documents(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_documents_program_id ON documents(program_id);
CREATE INDEX IF NOT EXISTS idx_documents_sharing_scope ON documents(sharing_scope);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- Document version history indexes
CREATE INDEX IF NOT EXISTS idx_document_version_history_document_id ON document_version_history(document_id);
CREATE INDEX IF NOT EXISTS idx_document_version_history_changed_at ON document_version_history(changed_at DESC);

-- Knowledge articles indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_tenant_id ON knowledge_articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_workspace_id ON knowledge_articles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_program_id ON knowledge_articles(program_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_scope ON knowledge_articles(scope);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_status ON knowledge_articles(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_tags ON knowledge_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_featured ON knowledge_articles(is_featured) WHERE is_featured = true;

-- Document templates indexes
CREATE INDEX IF NOT EXISTS idx_document_templates_tenant_id ON document_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_workspace_id ON document_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_program_id ON document_templates(program_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_scope ON document_templates(scope);
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active) WHERE is_active = true;

-- Document collaborators indexes
CREATE INDEX IF NOT EXISTS idx_document_collaborators_document_id ON document_collaborators(document_id);
CREATE INDEX IF NOT EXISTS idx_document_collaborators_user_id ON document_collaborators(user_id);

-- Document comments indexes
CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_parent_id ON document_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_created_at ON document_comments(created_at DESC);

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Populate document hierarchy from project
CREATE OR REPLACE FUNCTION populate_document_hierarchy()
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

CREATE TRIGGER populate_document_hierarchy_trigger
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION populate_document_hierarchy();

-- Update knowledge article timestamp
CREATE OR REPLACE FUNCTION update_knowledge_article_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_article_timestamp_trigger
    BEFORE UPDATE ON knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_article_timestamp();

-- Increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_template = false AND NEW.parent_document_id IS NOT NULL THEN
        UPDATE document_templates
        SET usage_count = usage_count + 1
        WHERE id = NEW.parent_document_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_template_usage_trigger
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION increment_template_usage();

-- Update document comment timestamp
CREATE OR REPLACE FUNCTION update_document_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.is_edited = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_comment_timestamp_trigger
    BEFORE UPDATE ON document_comments
    FOR EACH ROW
    WHEN (OLD.content IS DISTINCT FROM NEW.content)
    EXECUTE FUNCTION update_document_comment_timestamp();

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE document_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

-- Document version history policies
CREATE POLICY "Users can view document version history they have access to"
    ON document_version_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_version_history.document_id
            AND (
                d.uploaded_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM document_collaborators dc
                    WHERE dc.document_id = d.id
                    AND dc.user_id = auth.uid()
                )
            )
        )
    );

-- Knowledge articles policies
CREATE POLICY "Users can view published articles in their scope"
    ON knowledge_articles FOR SELECT
    USING (
        status = 'published'
        OR created_by_user_id = auth.uid()
    );

CREATE POLICY "Users can create articles"
    ON knowledge_articles FOR INSERT
    WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can update their own articles"
    ON knowledge_articles FOR UPDATE
    USING (created_by_user_id = auth.uid());

-- Document templates policies
CREATE POLICY "Users can view active templates in their scope"
    ON document_templates FOR SELECT
    USING (is_active = true);

CREATE POLICY "Users can create templates"
    ON document_templates FOR INSERT
    WITH CHECK (created_by_user_id = auth.uid());

-- Document collaborators policies
CREATE POLICY "Users can view collaborators of documents they have access to"
    ON document_collaborators FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_collaborators.document_id
            AND d.uploaded_by = auth.uid()
        )
    );

-- Document comments policies
CREATE POLICY "Users can view comments on documents they have access to"
    ON document_comments FOR SELECT
    USING (
        NOT is_deleted
        AND EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_comments.document_id
            AND (
                d.uploaded_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM document_collaborators dc
                    WHERE dc.document_id = d.id
                    AND dc.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create comments on documents they have access to"
    ON document_comments FOR INSERT
    WITH CHECK (
        created_by_user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM document_collaborators dc
            WHERE dc.document_id = document_comments.document_id
            AND dc.user_id = auth.uid()
            AND dc.can_comment = true
        )
    );
