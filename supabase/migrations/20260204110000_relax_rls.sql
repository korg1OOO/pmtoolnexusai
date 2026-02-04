-- Relax RLS for Timeline Tables to allow Public Access (Development Mode)

-- timeline_swimlanes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON timeline_swimlanes;
CREATE POLICY "Enable read access for authenticated users" ON timeline_swimlanes FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON timeline_swimlanes;
CREATE POLICY "Enable insert access for authenticated users" ON timeline_swimlanes FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON timeline_swimlanes;
CREATE POLICY "Enable update access for authenticated users" ON timeline_swimlanes FOR UPDATE TO public USING (true);
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON timeline_swimlanes;
CREATE POLICY "Enable delete access for authenticated users" ON timeline_swimlanes FOR DELETE TO public USING (true);

-- timeline_activities
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON timeline_activities;
CREATE POLICY "Enable read access for authenticated users" ON timeline_activities FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON timeline_activities;
CREATE POLICY "Enable insert access for authenticated users" ON timeline_activities FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON timeline_activities;
CREATE POLICY "Enable update access for authenticated users" ON timeline_activities FOR UPDATE TO public USING (true);
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON timeline_activities;
CREATE POLICY "Enable delete access for authenticated users" ON timeline_activities FOR DELETE TO public USING (true);

-- timeline_dependencies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON timeline_dependencies;
CREATE POLICY "Enable read access for authenticated users" ON timeline_dependencies FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON timeline_dependencies;
CREATE POLICY "Enable insert access for authenticated users" ON timeline_dependencies FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON timeline_dependencies;
CREATE POLICY "Enable delete access for authenticated users" ON timeline_dependencies FOR DELETE TO public USING (true);

-- timeline_milestones
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON timeline_milestones;
CREATE POLICY "Enable read access for authenticated users" ON timeline_milestones FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON timeline_milestones;
CREATE POLICY "Enable insert access for authenticated users" ON timeline_milestones FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON timeline_milestones;
CREATE POLICY "Enable update access for authenticated users" ON timeline_milestones FOR UPDATE TO public USING (true);
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON timeline_milestones;
CREATE POLICY "Enable delete access for authenticated users" ON timeline_milestones FOR DELETE TO public USING (true);

-- timeline_snapshots
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON timeline_snapshots;
CREATE POLICY "Enable read access for authenticated users" ON timeline_snapshots FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON timeline_snapshots;
CREATE POLICY "Enable insert access for authenticated users" ON timeline_snapshots FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON timeline_snapshots;
CREATE POLICY "Enable delete access for authenticated users" ON timeline_snapshots FOR DELETE TO public USING (true);

-- timeline_sites
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON timeline_sites;
CREATE POLICY "Enable read access for authenticated users" ON timeline_sites FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON timeline_sites;
CREATE POLICY "Enable insert access for authenticated users" ON timeline_sites FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON timeline_sites;
CREATE POLICY "Enable update access for authenticated users" ON timeline_sites FOR UPDATE TO public USING (true);
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON timeline_sites;
CREATE POLICY "Enable delete access for authenticated users" ON timeline_sites FOR DELETE TO public USING (true);

-- timeline_teams
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON timeline_teams;
CREATE POLICY "Enable read access for authenticated users" ON timeline_teams FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON timeline_teams;
CREATE POLICY "Enable insert access for authenticated users" ON timeline_teams FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON timeline_teams;
CREATE POLICY "Enable update access for authenticated users" ON timeline_teams FOR UPDATE TO public USING (true);
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON timeline_teams;
CREATE POLICY "Enable delete access for authenticated users" ON timeline_teams FOR DELETE TO public USING (true);
