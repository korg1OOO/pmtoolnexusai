-- Create presentation_folders table
CREATE TABLE presentation_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES presentation_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create presentations table
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES presentation_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Presentation',
  template TEXT DEFAULT 'custom',
  theme JSONB DEFAULT '{"primaryColor": "#3b82f6", "accentColor": "#10b981", "fontFamily": "Inter"}',
  slide_master JSONB DEFAULT '{"showHeader": true, "showFooter": true, "showPageNumbers": true}',
  transitions JSONB DEFAULT '{"type": "fade", "duration": 0.5}',
  created_by UUID,
  created_by_name TEXT,
  is_shared BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create presentation_slides table
CREATE TABLE presentation_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Slide',
  template TEXT DEFAULT 'blank',
  content JSONB DEFAULT '{}',
  html_content TEXT DEFAULT '',
  speaker_notes TEXT DEFAULT '',
  transition JSONB DEFAULT '{}',
  background JSONB DEFAULT '{"type": "solid", "color": "#ffffff"}',
  shapes JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  charts JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create presentation_versions table
CREATE TABLE presentation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  slides_snapshot JSONB NOT NULL,
  change_notes TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create presentation_collaborators table
CREATE TABLE presentation_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  user_name TEXT NOT NULL,
  user_email TEXT,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'comment', 'edit')),
  cursor_position JSONB DEFAULT '{}',
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(presentation_id, user_email)
);

-- Enable RLS on all tables
ALTER TABLE presentation_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for presentation_folders
CREATE POLICY "Users can view presentation folders" ON presentation_folders FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create folders" ON presentation_folders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update folders" ON presentation_folders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete folders" ON presentation_folders FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for presentations
CREATE POLICY "Users can view presentations" ON presentations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create presentations" ON presentations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update presentations" ON presentations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete presentations" ON presentations FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for presentation_slides
CREATE POLICY "Users can view slides" ON presentation_slides FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create slides" ON presentation_slides FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update slides" ON presentation_slides FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete slides" ON presentation_slides FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for presentation_versions
CREATE POLICY "Users can view versions" ON presentation_versions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create versions" ON presentation_versions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete versions" ON presentation_versions FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for presentation_collaborators
CREATE POLICY "Users can view collaborators" ON presentation_collaborators FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage collaborators" ON presentation_collaborators FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_presentation_folders_project ON presentation_folders(project_id);
CREATE INDEX idx_presentation_folders_parent ON presentation_folders(parent_id);
CREATE INDEX idx_presentations_project ON presentations(project_id);
CREATE INDEX idx_presentations_folder ON presentations(folder_id);
CREATE INDEX idx_slides_presentation ON presentation_slides(presentation_id);
CREATE INDEX idx_slides_order ON presentation_slides(presentation_id, sort_order);
CREATE INDEX idx_versions_presentation ON presentation_versions(presentation_id);
CREATE INDEX idx_collaborators_presentation ON presentation_collaborators(presentation_id);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE presentation_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE presentations;
ALTER PUBLICATION supabase_realtime ADD TABLE presentation_slides;
ALTER PUBLICATION supabase_realtime ADD TABLE presentation_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE presentation_collaborators;

-- Create storage bucket for presentation assets
INSERT INTO storage.buckets (id, name, public) VALUES ('presentation-assets', 'presentation-assets', true);

-- Storage policies for presentation-assets bucket
CREATE POLICY "Anyone can view presentation assets" ON storage.objects FOR SELECT USING (bucket_id = 'presentation-assets');
CREATE POLICY "Authenticated users can upload presentation assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'presentation-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update their presentation assets" ON storage.objects FOR UPDATE USING (bucket_id = 'presentation-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete their presentation assets" ON storage.objects FOR DELETE USING (bucket_id = 'presentation-assets' AND auth.uid() IS NOT NULL);