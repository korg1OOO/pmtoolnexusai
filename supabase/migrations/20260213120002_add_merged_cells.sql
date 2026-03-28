-- Add merged_cells column to spreadsheet_sheets table
ALTER TABLE spreadsheet_sheets 
ADD COLUMN IF NOT EXISTS merged_cells JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN spreadsheet_sheets.merged_cells IS 
'Array of merged cell ranges in format: [{"startRow": 0, "startCol": 0, "endRow": 1, "endCol": 1}]';
