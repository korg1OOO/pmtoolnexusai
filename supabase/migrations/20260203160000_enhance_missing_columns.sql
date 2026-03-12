-- Enhance change_requests table
ALTER TABLE "change_requests" 
ADD COLUMN IF NOT EXISTS "impact_details" jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "affected_tasks" jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "justification" text,
ADD COLUMN IF NOT EXISTS "alternatives" text;

-- Enhance stakeholders table
ALTER TABLE "stakeholders" 
ADD COLUMN IF NOT EXISTS "key_interests" jsonb DEFAULT '[]'::jsonb;

-- Ensure RLS is active (redundant but safe)
ALTER TABLE "change_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stakeholders" ENABLE ROW LEVEL SECURITY;
