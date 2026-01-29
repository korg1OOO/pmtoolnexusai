-- Create notebook_spreadsheets table (parallel to notebook_sections)
CREATE TABLE public.notebook_spreadsheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Spreadsheet',
  color TEXT DEFAULT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spreadsheet_sheets table (the actual sheets within a spreadsheet)
CREATE TABLE public.spreadsheet_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spreadsheet_id UUID NOT NULL REFERENCES public.notebook_spreadsheets(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Sheet 1',
  data JSONB DEFAULT '[]'::jsonb, -- Stores cell data as array of rows
  column_widths JSONB DEFAULT '{}'::jsonb, -- Stores custom column widths
  row_heights JSONB DEFAULT '{}'::jsonb, -- Stores custom row heights
  frozen_rows INTEGER DEFAULT 0,
  frozen_cols INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notebook_spreadsheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spreadsheet_sheets ENABLE ROW LEVEL SECURITY;

-- RLS policies for notebook_spreadsheets
CREATE POLICY "Allow all access to spreadsheets"
  ON public.notebook_spreadsheets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies for spreadsheet_sheets
CREATE POLICY "Allow all access to sheets"
  ON public.spreadsheet_sheets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at triggers
CREATE TRIGGER update_notebook_spreadsheets_updated_at
  BEFORE UPDATE ON public.notebook_spreadsheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spreadsheet_sheets_updated_at
  BEFORE UPDATE ON public.spreadsheet_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notebook_spreadsheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spreadsheet_sheets;