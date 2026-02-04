ALTER TABLE tasks ADD COLUMN IF NOT EXISTS child_project_id UUID REFERENCES projects(id);
