-- notifications.sql: Notifications system for real-time user alerts
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('sla_breach', 'sla_warning', 'action_overdue', 'sync_failed', 'mention', 'info')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    related_item_type VARCHAR(50),
    related_item_id TEXT,
    related_item_title TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
    ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON notifications(user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
    ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- System/admins can insert notifications for any user
-- (This policy allows server-side code to create notifications)
CREATE POLICY "System can create notifications"
    ON notifications
    FOR INSERT
    WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Add comment
COMMENT ON TABLE notifications IS 'User notifications for system events, SLA alerts, mentions, etc.';
