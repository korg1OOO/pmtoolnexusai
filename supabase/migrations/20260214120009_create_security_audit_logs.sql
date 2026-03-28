-- Create security_audit_logs table for security event tracking
-- Logs authentication events, security changes, and suspicious activities

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- login_success, login_failed, password_changed, 2fa_enabled, etc.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_email ON security_audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_security_logs_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_audit_logs(ip_address);

-- Enable RLS
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own security logs
CREATE POLICY "Users can view their own security logs"
  ON security_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all security logs
CREATE POLICY "Admins can view all security logs"
  ON security_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: System can insert security logs
CREATE POLICY "System can insert security logs"
  ON security_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_user_id UUID,
  p_user_email TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_severity TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_audit_logs (
    event_type,
    user_id,
    user_email,
    ip_address,
    user_agent,
    severity,
    details
  ) VALUES (
    p_event_type,
    p_user_id,
    p_user_email,
    p_ip_address,
    p_user_agent,
    p_severity,
    p_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;
