-- ============================================
-- CONSOLIDATED DATABASE MIGRATIONS
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- Migration 1: Security Audit Logs
-- ============================================

CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_ip_address ON security_audit_logs(ip_address);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all security logs" ON security_audit_logs;
DROP POLICY IF EXISTS "System can insert security logs" ON security_audit_logs;

CREATE POLICY "Admins can view all security logs"
    ON security_audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert security logs"
    ON security_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_user_email TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'info',
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

-- ============================================
-- Migration 2: Password Policies
-- ============================================

CREATE TABLE IF NOT EXISTS password_policies (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
    min_length INTEGER NOT NULL DEFAULT 8,
    require_uppercase BOOLEAN NOT NULL DEFAULT true,
    require_lowercase BOOLEAN NOT NULL DEFAULT true,
    require_numbers BOOLEAN NOT NULL DEFAULT true,
    require_special_chars BOOLEAN NOT NULL DEFAULT true,
    password_expiry_days INTEGER NOT NULL DEFAULT 90,
    prevent_reuse_count INTEGER NOT NULL DEFAULT 5,
    max_login_attempts INTEGER NOT NULL DEFAULT 5,
    lockout_duration_minutes INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO password_policies (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE password_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view password policy" ON password_policies;
DROP POLICY IF EXISTS "Admins can update password policy" ON password_policies;

CREATE POLICY "Anyone can view password policy"
    ON password_policies FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can update password policy"
    ON password_policies FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE OR REPLACE FUNCTION validate_password(p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_policy RECORD;
    v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
    SELECT * INTO v_policy FROM password_policies WHERE id = '00000000-0000-0000-0000-000000000001';
    
    IF LENGTH(p_password) < v_policy.min_length THEN
        v_errors := array_append(v_errors, format('Password must be at least %s characters long', v_policy.min_length));
    END IF;
    
    IF v_policy.require_uppercase AND p_password !~ '[A-Z]' THEN
        v_errors := array_append(v_errors, 'Password must contain at least one uppercase letter');
    END IF;
    
    IF v_policy.require_lowercase AND p_password !~ '[a-z]' THEN
        v_errors := array_append(v_errors, 'Password must contain at least one lowercase letter');
    END IF;
    
    IF v_policy.require_numbers AND p_password !~ '[0-9]' THEN
        v_errors := array_append(v_errors, 'Password must contain at least one number');
    END IF;
    
    IF v_policy.require_special_chars AND p_password !~ '[^A-Za-z0-9]' THEN
        v_errors := array_append(v_errors, 'Password must contain at least one special character');
    END IF;
    
    RETURN jsonb_build_object(
        'is_valid', array_length(v_errors, 1) IS NULL,
        'errors', to_jsonb(v_errors)
    );
END;
$$;

-- ============================================
-- Migration 3: Refunds Table
-- ============================================

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    stripe_refund_id TEXT,
    amount BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_invoice_id ON refunds(invoice_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_refund_id ON refunds(stripe_refund_id);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all refunds" ON refunds;
DROP POLICY IF EXISTS "Admins can insert refunds" ON refunds;

CREATE POLICY "Admins can view all refunds"
    ON refunds FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert refunds"
    ON refunds FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- VERIFICATION QUERY
-- ============================================

SELECT 
    'Migration Complete!' as status,
    COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('security_audit_logs', 'password_policies', 'refunds');
