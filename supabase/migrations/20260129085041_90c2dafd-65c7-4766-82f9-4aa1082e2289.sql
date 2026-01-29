-- Add recurring schedule columns to meetings table
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS recurring_schedule text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurring_end_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurring_parent_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurring_instance_date date DEFAULT NULL;

-- Add index for faster recurring meeting queries
CREATE INDEX IF NOT EXISTS idx_meetings_recurring_parent 
ON public.meetings(recurring_parent_id) 
WHERE recurring_parent_id IS NOT NULL;

-- Add foreign key for recurring parent
ALTER TABLE public.meetings
ADD CONSTRAINT meetings_recurring_parent_fkey 
FOREIGN KEY (recurring_parent_id) 
REFERENCES public.meetings(id) 
ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN public.meetings.recurring_schedule IS 'Recurrence pattern: none, daily, weekly, bi-weekly, monthly';
COMMENT ON COLUMN public.meetings.recurring_end_date IS 'End date for recurring series';
COMMENT ON COLUMN public.meetings.recurring_parent_id IS 'Reference to parent meeting for recurring instances';
COMMENT ON COLUMN public.meetings.recurring_instance_date IS 'Specific date for this instance in a recurring series';