-- Add conditional formatting support to spreadsheet sheets
ALTER TABLE spreadsheet_sheets
ADD COLUMN IF NOT EXISTS conditional_formats JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN spreadsheet_sheets.conditional_formats IS 'Array of conditional formatting rules for the sheet';
