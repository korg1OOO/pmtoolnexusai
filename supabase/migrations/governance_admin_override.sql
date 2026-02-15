-- Add admin override tracking to approvers table
ALTER TABLE approvers
ADD COLUMN IF NOT EXISTS override_reason TEXT,
ADD COLUMN IF NOT EXISTS is_override BOOLEAN DEFAULT false;

-- Add index for override queries
CREATE INDEX IF NOT EXISTS idx_approvers_override ON approvers(is_override) WHERE is_override = true;

-- Add comment
COMMENT ON COLUMN approvers.override_reason IS 'Reason provided when admin overrides normal approval flow';
COMMENT ON COLUMN approvers.is_override IS 'True if this approval was an admin override';
