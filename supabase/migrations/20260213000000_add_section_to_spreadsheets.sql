-- Add section_id to notebook_spreadsheets to allow organizing spreadsheets within sections
ALTER TABLE public.notebook_spreadsheets
  ADD COLUMN section_id UUID REFERENCES public.notebook_sections(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_notebook_spreadsheets_section_id
  ON public.notebook_spreadsheets(section_id);

-- Add comment
COMMENT ON COLUMN public.notebook_spreadsheets.section_id IS 'Optional section that contains this spreadsheet. NULL means spreadsheet is at notebook level.';
