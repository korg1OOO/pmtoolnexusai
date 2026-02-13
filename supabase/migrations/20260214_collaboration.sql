-- Phase 3: Collaboration - Realtime Presence & Comments
-- This migration adds support for:
-- 1. Real-time user presence tracking
-- 2. Cell-level comments and threads
-- 3. Sharing and permissions
-- 4. Version history/snapshots

-- Enable realtime for spreadsheet_sheets table
ALTER PUBLICATION supabase_realtime ADD TABLE spreadsheet_sheets;

-- ===== PRESENCE SYSTEM =====

CREATE TABLE IF NOT EXISTS spreadsheet_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES spreadsheet_sheets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT,
  user_color TEXT NOT NULL DEFAULT '#3b82f6', -- Blue default
  cursor_position JSONB, -- {row: number, col: number}
  selection JSONB, -- {start: {row, col}, end: {row, col}}
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for presence queries
CREATE INDEX idx_presence_sheet_id ON spreadsheet_presence(sheet_id);
CREATE INDEX idx_presence_user_id ON spreadsheet_presence(user_id);
CREATE INDEX idx_presence_last_seen ON spreadsheet_presence(last_seen);
CREATE INDEX idx_presence_sheet_user ON spreadsheet_presence(sheet_id, user_id);

-- Function to auto-cleanup stale presence (>5 minutes inactive)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM spreadsheet_presence
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- ===== COMMENTS SYSTEM =====

CREATE TABLE IF NOT EXISTS spreadsheet_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES spreadsheet_sheets(id) ON DELETE CASCADE,
  cell_ref TEXT NOT NULL, -- e.g., "A1", "B5"
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_email TEXT,
  content TEXT NOT NULL,
  mentions UUID[], -- Array of mentioned user IDs
  parent_id UUID REFERENCES spreadsheet_comments(id) ON DELETE CASCADE, -- For threaded replies
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for comment queries
CREATE INDEX idx_comments_sheet_id ON spreadsheet_comments(sheet_id);
CREATE INDEX idx_comments_cell_ref ON spreadsheet_comments(sheet_id, cell_ref);
CREATE INDEX idx_comments_user_id ON spreadsheet_comments(user_id);
CREATE INDEX idx_comments_parent_id ON spreadsheet_comments(parent_id);
CREATE INDEX idx_comments_resolved ON spreadsheet_comments(sheet_id, resolved);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE spreadsheet_comments;

-- ===== SHARING & PERMISSIONS =====

CREATE TYPE share_permission AS ENUM ('view', 'edit', 'admin');

CREATE TABLE IF NOT EXISTS spreadsheet_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spreadsheet_id UUID NOT NULL REFERENCES notebook_spreadsheets(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT, -- For email-based sharing
  permission share_permission NOT NULL DEFAULT 'view',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Either user_id or email must be set
  CONSTRAINT share_target_check CHECK (
    (shared_with_user_id IS NOT NULL AND shared_with_email IS NULL) OR
    (shared_with_user_id IS NULL AND shared_with_email IS NOT NULL)
  )
);

-- Indexes for sharing queries
CREATE INDEX idx_shares_spreadsheet_id ON spreadsheet_shares(spreadsheet_id);
CREATE INDEX idx_shares_user_id ON spreadsheet_shares(shared_with_user_id);
CREATE INDEX idx_shares_email ON spreadsheet_shares(shared_with_email);
CREATE INDEX idx_shares_created_by ON spreadsheet_shares(created_by);

-- ===== VERSION HISTORY =====

CREATE TABLE IF NOT EXISTS spreadsheet_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES spreadsheet_sheets(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL, -- Full sheet data snapshot
  cell_formats JSONB, -- Cell formats at time of snapshot
  conditional_formats JSONB, -- Conditional formats
  validation_rules JSONB, -- Validation rules
  charts JSONB, -- Charts configuration
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  label TEXT, -- Optional label like "Before formula change"
  change_summary TEXT, -- Auto-generated or manual description
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for version queries
CREATE INDEX idx_versions_sheet_id ON spreadsheet_versions(sheet_id);
CREATE INDEX idx_versions_created_at ON spreadsheet_versions(sheet_id, created_at DESC);
CREATE INDEX idx_versions_user_id ON spreadsheet_versions(user_id);

-- Function to limit versions per sheet (keep last 50)
CREATE OR REPLACE FUNCTION limit_spreadsheet_versions()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old versions keeping only the latest 50
  DELETE FROM spreadsheet_versions
  WHERE sheet_id = NEW.sheet_id
  AND id NOT IN (
    SELECT id FROM spreadsheet_versions
    WHERE sheet_id = NEW.sheet_id
    ORDER BY created_at DESC
    LIMIT 50
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_limit_versions
AFTER INSERT ON spreadsheet_versions
FOR EACH ROW
EXECUTE FUNCTION limit_spreadsheet_versions();

-- ===== RLS POLICIES =====

-- Presence policies
ALTER TABLE spreadsheet_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view presence for sheets they have access to"
ON spreadsheet_presence FOR SELECT
USING (
  sheet_id IN (
    SELECT id FROM spreadsheet_sheets WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert their own presence"
ON spreadsheet_presence FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own presence"
ON spreadsheet_presence FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own presence"
ON spreadsheet_presence FOR DELETE
USING (user_id = auth.uid());

-- Comments policies
ALTER TABLE spreadsheet_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on sheets they have access to"
ON spreadsheet_comments FOR SELECT
USING (
  sheet_id IN (
    SELECT id FROM spreadsheet_sheets WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert comments on sheets they have edit access"
ON spreadsheet_comments FOR INSERT
WITH CHECK (
  sheet_id IN (
    SELECT id FROM spreadsheet_sheets WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own comments"
ON spreadsheet_comments FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
ON spreadsheet_comments FOR DELETE
USING (user_id = auth.uid());

-- Shares policies
ALTER TABLE spreadsheet_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares for their spreadsheets"
ON spreadsheet_shares FOR SELECT
USING (
  spreadsheet_id IN (
    SELECT id FROM notebook_spreadsheets WHERE user_id = auth.uid()
  ) OR
  shared_with_user_id = auth.uid()
);

CREATE POLICY "Spreadsheet owners can manage shares"
ON spreadsheet_shares FOR ALL
USING (
  spreadsheet_id IN (
    SELECT id FROM notebook_spreadsheets WHERE user_id = auth.uid()
  )
);

-- Versions policies
ALTER TABLE spreadsheet_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions for their sheets"
ON spreadsheet_versions FOR SELECT
USING (
  sheet_id IN (
    SELECT id FROM spreadsheet_sheets WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create versions for their sheets"
ON spreadsheet_versions FOR INSERT
WITH CHECK (
  sheet_id IN (
    SELECT id FROM spreadsheet_sheets WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  )
);

-- Grant permissions
GRANT ALL ON spreadsheet_presence TO authenticated;
GRANT ALL ON spreadsheet_comments TO authenticated;
GRANT ALL ON spreadsheet_shares TO authenticated;
GRANT ALL ON spreadsheet_versions TO authenticated;

-- Comments
COMMENT ON TABLE spreadsheet_presence IS 'Real-time user presence tracking for collaborative editing';
COMMENT ON TABLE spreadsheet_comments IS 'Cell-level comments and threaded discussions';
COMMENT ON TABLE spreadsheet_shares IS 'Sharing and permission management for spreadsheets';
COMMENT ON TABLE spreadsheet_versions IS 'Version history and snapshots for sheet data';
