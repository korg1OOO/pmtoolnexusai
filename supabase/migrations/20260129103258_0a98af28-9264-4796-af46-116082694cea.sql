-- Add linked project columns to notebook_spreadsheets
ALTER TABLE public.notebook_spreadsheets
ADD COLUMN linked_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
ADD COLUMN linked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'syncing', 'error')),
ADD COLUMN sync_direction TEXT DEFAULT 'both' CHECK (sync_direction IN ('spreadsheet', 'project', 'both'));

-- Create spreadsheet_task_mappings table for row-to-task tracking
CREATE TABLE public.spreadsheet_task_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spreadsheet_id UUID NOT NULL REFERENCES public.notebook_spreadsheets(id) ON DELETE CASCADE,
  sheet_id UUID NOT NULL REFERENCES public.spreadsheet_sheets(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sheet_id, row_index),
  UNIQUE(sheet_id, task_id)
);

-- Enable RLS
ALTER TABLE public.spreadsheet_task_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for spreadsheet_task_mappings
CREATE POLICY "Allow all access to task mappings"
ON public.spreadsheet_task_mappings
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.spreadsheet_task_mappings;

-- Create index for faster lookups
CREATE INDEX idx_task_mappings_spreadsheet ON public.spreadsheet_task_mappings(spreadsheet_id);
CREATE INDEX idx_task_mappings_task ON public.spreadsheet_task_mappings(task_id);
CREATE INDEX idx_task_mappings_sheet_row ON public.spreadsheet_task_mappings(sheet_id, row_index);