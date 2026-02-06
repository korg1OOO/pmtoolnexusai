
-- Emergency fix for missing order_index columns that should have been in previous migrations
-- This ensures the schema matches what the application expects

DO $$
BEGIN
    -- Fix timeline_swimlanes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timeline_swimlanes' AND column_name = 'order_index') THEN
        ALTER TABLE timeline_swimlanes ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;

    -- Fix timeline_activities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timeline_activities' AND column_name = 'order_index') THEN
        ALTER TABLE timeline_activities ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;
END $$;
