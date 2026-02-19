-- Add charts support to spreadsheet sheets
ALTER TABLE spreadsheet_sheets
ADD COLUMN IF NOT EXISTS charts JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN spreadsheet_sheets.charts IS 'Array of chart configurations for this sheet';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_spreadsheet_sheets_charts ON spreadsheet_sheets USING GIN (charts);
