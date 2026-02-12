-- Phase 9: Admin Dashboard Migration
-- Creates admin_activity_log and system_status tables

-- Drop existing tables if exist
DROP TABLE IF EXISTS admin_activity_log CASCADE;
DROP TABLE IF EXISTS system_status CASCADE;

-- Create admin_activity_log table
CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('success', 'info', 'warning', 'error')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system_status table
CREATE TABLE system_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'down')),
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_activity_log_user_id ON admin_activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action_type ON admin_activity_log(action_type);
CREATE INDEX idx_system_status_service ON system_status(service_name);
CREATE INDEX idx_system_status_status ON system_status(status);

-- Enable RLS
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_activity_log

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
    ON admin_activity_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- System can insert activity
CREATE POLICY "System can log activity"
    ON admin_activity_log
    FOR INSERT
    WITH CHECK (true);

-- RLS Policies for system_status

-- Everyone can view system status (for health checks)
CREATE POLICY "Everyone can view system status"
    ON system_status
    FOR SELECT
    USING (true);

-- Only admins can update system status
CREATE POLICY "Admins can update system status"
    ON system_status
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create updated_at trigger for system_status
CREATE TRIGGER update_system_status_updated_at
    BEFORE UPDATE ON system_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default system services
INSERT INTO system_status (service_name, status, uptime_percentage) VALUES
    ('API Server', 'operational', 99.9),
    ('Database', 'operational', 100.0),
    ('File Storage', 'operational', 99.8),
    ('Email Service', 'operational', 98.5)
ON CONFLICT (service_name) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE admin_activity_log IS 'Tracks admin and user activity for audit trail';
COMMENT ON TABLE system_status IS 'Monitors system service health and uptime';
