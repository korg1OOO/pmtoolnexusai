-- Record Locks Table
-- Stores temporary locks on records to prevent concurrent edits

CREATE TABLE IF NOT EXISTS record_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(table_name, record_id)
);

CREATE INDEX IF NOT EXISTS idx_record_locks_expiry ON record_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_record_locks_record ON record_locks(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_record_locks_user ON record_locks(user_id);

-- Auto-cleanup expired locks function
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
    DELETE FROM record_locks WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE record_locks ENABLE ROW LEVEL SECURITY;

-- Anyone can view locks
CREATE POLICY record_locks_select_policy ON record_locks
    FOR SELECT USING (true);

-- Users can only create locks for themselves
CREATE POLICY record_locks_insert_policy ON record_locks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own locks or expired locks
CREATE POLICY record_locks_delete_policy ON record_locks
    FOR DELETE USING (auth.uid() = user_id OR expires_at < NOW());

COMMENT ON TABLE record_locks IS 'Temporary locks on records to prevent concurrent edits';
COMMENT ON COLUMN record_locks.expires_at IS 'Lock automatically expires after this time (typically 5-10 minutes)';
