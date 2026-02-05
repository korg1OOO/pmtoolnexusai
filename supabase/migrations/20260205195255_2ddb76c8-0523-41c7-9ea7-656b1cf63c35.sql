-- Add missing columns to change_requests table
ALTER TABLE public.change_requests 
ADD COLUMN IF NOT EXISTS impact_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS justification TEXT,
ADD COLUMN IF NOT EXISTS alternatives TEXT[];

-- Add cancelled status to invoices if not exists (for AddInvoiceDialog)
-- First check the current constraint and update it
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
  
  -- Add new constraint with cancelled status
  ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
    CHECK (status IN ('pending', 'sent', 'paid', 'cancelled'));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Add child_project_id to tasks table if not exists (for LinkChildProjectDialog)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS child_project_id UUID REFERENCES public.projects(id);