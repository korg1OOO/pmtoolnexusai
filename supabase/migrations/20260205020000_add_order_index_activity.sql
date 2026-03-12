-- Add order_index to timeline_activities to support drag-and-drop reordering
ALTER TABLE timeline_activities ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
