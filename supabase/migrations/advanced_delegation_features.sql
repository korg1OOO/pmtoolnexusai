-- Advanced Delegation Features Migration
-- Adds support for expiry, templates, and sub-delegation

-- Add new columns to delegations table
ALTER TABLE delegations 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parent_delegation_id UUID REFERENCES delegations(id),
ADD COLUMN IF NOT EXISTS delegation_depth INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS can_subdelegate BOOLEAN DEFAULT FALSE;

-- Create delegation_templates table
CREATE TABLE IF NOT EXISTS delegation_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  delegate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegation_type VARCHAR(50) NOT NULL CHECK (delegation_type IN ('temporary', 'permanent')),
  reason TEXT,
  duration_days INTEGER,
  can_subdelegate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delegation_templates_user ON delegation_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_delegations_expires ON delegations(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delegations_parent ON delegations(parent_delegation_id) WHERE parent_delegation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delegations_depth ON delegations(delegation_depth);

-- Add status column to track delegation lifecycle
ALTER TABLE delegations 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' 
CHECK (status IN ('active', 'completed', 'revoked', 'expired'));

-- Create function to auto-expire delegations
CREATE OR REPLACE FUNCTION check_expired_delegations()
RETURNS void AS $$
BEGIN
  UPDATE delegations
  SET status = 'expired'
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Create function to validate delegation depth
CREATE OR REPLACE FUNCTION validate_delegation_depth()
RETURNS TRIGGER AS $$
DECLARE
  max_depth INTEGER := 2; -- Maximum delegation chain depth
  current_depth INTEGER;
BEGIN
  -- If this is a sub-delegation, check depth
  IF NEW.parent_delegation_id IS NOT NULL THEN
    -- Get parent delegation depth
    SELECT delegation_depth INTO current_depth
    FROM delegations
    WHERE id = NEW.parent_delegation_id;
    
    -- Check if parent can sub-delegate
    IF NOT EXISTS (
      SELECT 1 FROM delegations
      WHERE id = NEW.parent_delegation_id
      AND can_subdelegate = TRUE
      AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Parent delegation does not allow sub-delegation';
    END IF;
    
    -- Check depth limit
    IF current_depth >= max_depth THEN
      RAISE EXCEPTION 'Maximum delegation depth (%) exceeded', max_depth;
    END IF;
    
    -- Set new delegation depth
    NEW.delegation_depth := current_depth + 1;
  ELSE
    -- Root delegation
    NEW.delegation_depth := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for delegation depth validation
DROP TRIGGER IF EXISTS trg_validate_delegation_depth ON delegations;
CREATE TRIGGER trg_validate_delegation_depth
  BEFORE INSERT ON delegations
  FOR EACH ROW
  EXECUTE FUNCTION validate_delegation_depth();

-- Create function to prevent circular delegations
CREATE OR REPLACE FUNCTION prevent_circular_delegation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if delegate is in the delegation chain
  IF EXISTS (
    WITH RECURSIVE delegation_chain AS (
      -- Base case: current delegation
      SELECT id, delegator_id, delegate_id, parent_delegation_id
      FROM delegations
      WHERE id = NEW.parent_delegation_id
      
      UNION ALL
      
      -- Recursive case: parent delegations
      SELECT d.id, d.delegator_id, d.delegate_id, d.parent_delegation_id
      FROM delegations d
      INNER JOIN delegation_chain dc ON d.id = dc.parent_delegation_id
    )
    SELECT 1 FROM delegation_chain
    WHERE delegate_id = NEW.delegate_id
  ) THEN
    RAISE EXCEPTION 'Circular delegation detected';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for circular delegation prevention
DROP TRIGGER IF EXISTS trg_prevent_circular_delegation ON delegations;
CREATE TRIGGER trg_prevent_circular_delegation
  BEFORE INSERT ON delegations
  FOR EACH ROW
  WHEN (NEW.parent_delegation_id IS NOT NULL)
  EXECUTE FUNCTION prevent_circular_delegation();

-- Add updated_at trigger for templates
CREATE OR REPLACE FUNCTION update_delegation_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_delegation_template_timestamp ON delegation_templates;
CREATE TRIGGER trg_update_delegation_template_timestamp
  BEFORE UPDATE ON delegation_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_delegation_template_timestamp();

-- Create view for delegation history with user details
CREATE OR REPLACE VIEW delegation_history AS
SELECT 
  d.id,
  d.approval_id,
  d.delegator_id,
  delegator.email as delegator_email,
  COALESCE(delegator_profile.full_name, delegator.email) as delegator_name,
  d.delegate_id,
  delegate.email as delegate_email,
  COALESCE(delegate_profile.full_name, delegate.email) as delegate_name,
  d.delegation_type,
  d.reason,
  d.status,
  d.created_at,
  d.revoked_at,
  d.expires_at,
  d.parent_delegation_id,
  d.delegation_depth,
  d.can_subdelegate
FROM delegations d
LEFT JOIN auth.users delegator ON d.delegator_id = delegator.id
LEFT JOIN profiles delegator_profile ON d.delegator_id = delegator_profile.id
LEFT JOIN auth.users delegate ON d.delegate_id = delegate.id
LEFT JOIN profiles delegate_profile ON d.delegate_id = delegate_profile.id;

-- Grant permissions
GRANT SELECT ON delegation_history TO authenticated;
GRANT ALL ON delegation_templates TO authenticated;

-- Add comments
COMMENT ON TABLE delegation_templates IS 'Stores reusable delegation templates for quick delegation';
COMMENT ON COLUMN delegations.expires_at IS 'Optional expiration timestamp for temporary delegations';
COMMENT ON COLUMN delegations.parent_delegation_id IS 'Reference to parent delegation for sub-delegations';
COMMENT ON COLUMN delegations.delegation_depth IS 'Depth in delegation chain (0 = root, 1 = first sub-delegation, etc.)';
COMMENT ON COLUMN delegations.can_subdelegate IS 'Whether this delegation allows further sub-delegation';
COMMENT ON COLUMN delegations.status IS 'Current status of delegation (active/completed/revoked/expired)';
