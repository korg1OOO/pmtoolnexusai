-- Create Timeline Swimlanes
CREATE TABLE IF NOT EXISTS timeline_swimlanes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  collapsed BOOLEAN DEFAULT false,
  target_duration INTEGER,
  site_ids TEXT[] DEFAULT '{}',
  team_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Timeline Activities
CREATE TABLE IF NOT EXISTS timeline_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimlane_id UUID NOT NULL REFERENCES timeline_swimlanes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_month INTEGER NOT NULL,
  duration_months INTEGER NOT NULL,
  color TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  resources_per_month JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Timeline Dependencies
CREATE TABLE IF NOT EXISTS timeline_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_activity_id UUID NOT NULL REFERENCES timeline_activities(id) ON DELETE CASCADE,
  target_activity_id UUID NOT NULL REFERENCES timeline_activities(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('FS', 'SS', 'FF', 'SF')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Timeline Milestones
CREATE TABLE IF NOT EXISTS timeline_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  month_index INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Timeline Snapshots (Scenarios)
CREATE TABLE IF NOT EXISTS timeline_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_timeline_swimlanes_project_id ON timeline_swimlanes(project_id);
CREATE INDEX idx_timeline_activities_swimlane_id ON timeline_activities(swimlane_id);
CREATE INDEX idx_timeline_dependencies_source ON timeline_dependencies(source_activity_id);
CREATE INDEX idx_timeline_dependencies_target ON timeline_dependencies(target_activity_id);
CREATE INDEX idx_timeline_milestones_project_id ON timeline_milestones(project_id);
CREATE INDEX idx_timeline_snapshots_project_id ON timeline_snapshots(project_id);

-- Enable RLS (Assuming RLS is generally used, but keeping policies open for now or copying standard project access)
ALTER TABLE timeline_swimlanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_snapshots ENABLE ROW LEVEL SECURITY;

-- Standard policies (Project member access - simplified for this iteration to public or authenticated)
CREATE POLICY "Enable read access for authenticated users" ON timeline_swimlanes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON timeline_swimlanes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON timeline_swimlanes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON timeline_swimlanes FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON timeline_activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON timeline_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON timeline_activities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON timeline_activities FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON timeline_dependencies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON timeline_dependencies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON timeline_dependencies FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON timeline_milestones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON timeline_milestones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON timeline_milestones FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON timeline_milestones FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON timeline_snapshots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON timeline_snapshots FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON timeline_snapshots FOR DELETE USING (auth.role() = 'authenticated');
