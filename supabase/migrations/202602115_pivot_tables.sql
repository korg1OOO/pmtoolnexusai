-- Phase 4: Pivot Tables
-- This migration adds pivot table configuration storage

ALTER TABLE spreadsheet_sheets
ADD COLUMN IF NOT EXISTS pivot_tables JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_sheets_pivot_tables 
ON spreadsheet_sheets USING GIN (pivot_tables);

COMMENT ON COLUMN spreadsheet_sheets.pivot_tables IS 'Pivot table configurations as JSONB array';
