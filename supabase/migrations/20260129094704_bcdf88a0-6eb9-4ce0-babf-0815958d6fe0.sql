-- Create notebooks table
CREATE TABLE public.notebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'book-open',
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sections table
CREATE TABLE public.notebook_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pages table
CREATE TABLE public.notebook_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.notebook_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  content_html TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_by TEXT,
  created_by_user_id UUID,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create page links table for wiki-style linking
CREATE TABLE public.notebook_page_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_page_id UUID NOT NULL REFERENCES public.notebook_pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES public.notebook_pages(id) ON DELETE CASCADE,
  link_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_page_id, target_page_id)
);

-- Enable RLS on all tables
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_page_links ENABLE ROW LEVEL SECURITY;

-- Notebooks policies - allow all authenticated users for now (project-scoped access can be added later)
CREATE POLICY "Allow all access to notebooks" ON public.notebooks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sections" ON public.notebook_sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to pages" ON public.notebook_pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to page links" ON public.notebook_page_links FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_notebooks_project ON public.notebooks(project_id);
CREATE INDEX idx_sections_notebook ON public.notebook_sections(notebook_id);
CREATE INDEX idx_pages_section ON public.notebook_pages(section_id);
CREATE INDEX idx_pages_tags ON public.notebook_pages USING GIN(tags);
CREATE INDEX idx_page_links_source ON public.notebook_page_links(source_page_id);
CREATE INDEX idx_page_links_target ON public.notebook_page_links(target_page_id);

-- Create triggers for updated_at
CREATE TRIGGER update_notebooks_updated_at
  BEFORE UPDATE ON public.notebooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.notebook_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.notebook_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaborative editing
ALTER PUBLICATION supabase_realtime ADD TABLE public.notebooks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notebook_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notebook_pages;