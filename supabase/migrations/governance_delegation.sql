-- Create delegations table for tracking approval delegations
CREATE TABLE IF NOT EXISTS delegations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delegator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    delegate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    approval_id UUID REFERENCES approval_workflows(id) ON DELETE CASCADE, -- NULL for permanent delegation
    entity_id UUID NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'portfolio', 'program', 'workspace')),
    delegation_type TEXT NOT NULL CHECK (delegation_type IN ('temporary', 'permanent')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    CONSTRAINT no_self_delegation CHECK (delegator_id != delegate_id)
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_delegations_delegator ON delegations(delegator_id, status);
CREATE INDEX IF NOT EXISTS idx_delegations_delegate ON delegations(delegate_id, status);
CREATE INDEX IF NOT EXISTS idx_delegations_approval ON delegations(approval_id) WHERE approval_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delegations_entity ON delegations(entity_id, entity_type, status);

-- Add delegation tracking to approvers table
ALTER TABLE approvers
ADD COLUMN IF NOT EXISTS delegated_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delegation_id UUID REFERENCES delegations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_delegated BOOLEAN DEFAULT false;

-- Add index for delegated approvers
CREATE INDEX IF NOT EXISTS idx_approvers_delegated ON approvers(delegated_to) WHERE delegated_to IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE delegations IS 'Tracks approval task delegations from one user to another';
COMMENT ON COLUMN delegations.delegator_id IS 'User who is delegating their approval task';
COMMENT ON COLUMN delegations.delegate_id IS 'User who will perform the approval on behalf of delegator';
COMMENT ON COLUMN delegations.approval_id IS 'Specific approval workflow (NULL for permanent delegation)';
COMMENT ON COLUMN delegations.delegation_type IS 'temporary: single approval, permanent: all future approvals';
COMMENT ON COLUMN delegations.status IS 'active: currently in effect, revoked: cancelled, completed: approval done';

COMMENT ON COLUMN approvers.delegated_to IS 'User ID if this approval has been delegated';
COMMENT ON COLUMN approvers.delegation_id IS 'Reference to the delegation record';
COMMENT ON COLUMN approvers.is_delegated IS 'True if this approval is currently delegated';
