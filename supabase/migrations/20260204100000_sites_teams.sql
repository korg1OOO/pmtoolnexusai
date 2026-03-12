-- Create Timeline Sites
CREATE TABLE IF NOT EXISTS timeline_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region TEXT DEFAULT 'Global',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Timeline Teams
CREATE TABLE IF NOT EXISTS timeline_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT DEFAULT 'Remote',
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timeline_sites_project_id ON timeline_sites(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_teams_project_id ON timeline_teams(project_id);

-- Enable RLS
ALTER TABLE timeline_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_teams ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON timeline_sites;
CREATE POLICY "Enable read access for authenticated users" ON timeline_sites FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON timeline_sites;
CREATE POLICY "Enable insert access for authenticated users" ON timeline_sites FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON timeline_sites;
CREATE POLICY "Enable update access for authenticated users" ON timeline_sites FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON timeline_sites;
CREATE POLICY "Enable delete access for authenticated users" ON timeline_sites FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON timeline_teams;
CREATE POLICY "Enable read access for authenticated users" ON timeline_teams FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON timeline_teams;
CREATE POLICY "Enable insert access for authenticated users" ON timeline_teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON timeline_teams;
CREATE POLICY "Enable update access for authenticated users" ON timeline_teams FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON timeline_teams;
CREATE POLICY "Enable delete access for authenticated users" ON timeline_teams FOR DELETE USING (auth.role() = 'authenticated');
