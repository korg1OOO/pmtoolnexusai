-- Create password_policies table for password policy configuration
-- Stores global password requirements and security settings

CREATE TABLE IF NOT EXISTS password_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_length INTEGER DEFAULT 8 CHECK (min_length >= 6 AND min_length <= 128),
  require_uppercase BOOLEAN DEFAULT true,
  require_lowercase BOOLEAN DEFAULT true,
  require_numbers BOOLEAN DEFAULT true,
  require_special_chars BOOLEAN DEFAULT true,
  password_expiry_days INTEGER DEFAULT 90 CHECK (password_expiry_days > 0),
  prevent_reuse_count INTEGER DEFAULT 5 CHECK (prevent_reuse_count >= 0),
  max_login_attempts INTEGER DEFAULT 5 CHECK (max_login_attempts > 0),
  lockout_duration_minutes INTEGER DEFAULT 30 CHECK (lockout_duration_minutes > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default policy (singleton pattern - only one row allowed)
INSERT INTO password_policies (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE password_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read password policy
CREATE POLICY "Everyone can read password policy"
  ON password_policies
  FOR SELECT
  USING (true);

-- Policy: Only admins can update password policy
CREATE POLICY "Admins can update password policy"
  ON password_policies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_password_policies_updated_at
  BEFORE UPDATE ON password_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate password against policy
CREATE OR REPLACE FUNCTION validate_password(
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_policy RECORD;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_is_valid BOOLEAN := true;
BEGIN
  -- Get current policy
  SELECT * INTO v_policy
  FROM password_policies
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  -- Check minimum length
  IF LENGTH(p_password) < v_policy.min_length THEN
    v_errors := array_append(v_errors, 'Password must be at least ' || v_policy.min_length || ' characters long');
    v_is_valid := false;
  END IF;
  
  -- Check uppercase requirement
  IF v_policy.require_uppercase AND p_password !~ '[A-Z]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one uppercase letter');
    v_is_valid := false;
  END IF;
  
  -- Check lowercase requirement
  IF v_policy.require_lowercase AND p_password !~ '[a-z]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one lowercase letter');
    v_is_valid := false;
  END IF;
  
  -- Check numbers requirement
  IF v_policy.require_numbers AND p_password !~ '[0-9]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one number');
    v_is_valid := false;
  END IF;
  
  -- Check special characters requirement
  IF v_policy.require_special_chars AND p_password !~ '[^A-Za-z0-9]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one special character');
    v_is_valid := false;
  END IF;
  
  RETURN jsonb_build_object(
    'is_valid', v_is_valid,
    'errors', v_errors
  );
END;
$$;
