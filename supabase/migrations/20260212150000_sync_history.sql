-- Phase 8: Sync History Migration
-- Creates sync_history table for tracking synchronization events

-- Drop existing table if exists
DROP TABLE IF EXISTS sync_history CASCADE;

-- Create sync_history table
CREATE TABLE sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('synced', 'syncing', 'partial', 'failed', 'pending')),
    message TEXT NOT NULL,
    items_processed INTEGER DEFAULT 0,
    items_total INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sync_history_project_id ON sync_history(project_id);
CREATE INDEX idx_sync_history_user_id ON sync_history(user_id);
CREATE INDEX idx_sync_history_status ON sync_history(status);
CREATE INDEX idx_sync_history_created_at ON sync_history(created_at DESC);

-- Enable RLS
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view sync history for projects they own
CREATE POLICY "Users can view sync history for their projects"
    ON sync_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = sync_history.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- Users can create sync history entries for their projects
CREATE POLICY "Users can create sync history for their projects"
    ON sync_history
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = sync_history.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- Users can update sync history they created
CREATE POLICY "Users can update their sync history"
    ON sync_history
    FOR UPDATE
    USING (user_id = auth.uid());

-- Admins can manage all sync history
CREATE POLICY "Admins can manage all sync history"
    ON sync_history
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_sync_history_updated_at
    BEFORE UPDATE ON sync_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comment
COMMENT ON TABLE sync_history IS 'Tracks synchronization events and status for projects';
