-- Add validation_rules column to spreadsheet_sheets
-- Migration: Add data validation support

ALTER TABLE spreadsheet_sheets
ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN spreadsheet_sheets.validation_rules IS 'Array of validation rules for cells in this sheet';
