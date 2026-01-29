-- Create decisions table
CREATE TABLE public.decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  key TEXT,
  title TEXT NOT NULL,
  decision TEXT NOT NULL,
  context TEXT,
  impact TEXT,
  alternatives JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'superseded', 'rejected')),
  owner_id UUID,
  owner_name TEXT,
  date DATE DEFAULT CURRENT_DATE,
  linked_tasks JSONB DEFAULT '[]'::jsonb,
  linked_risks JSONB DEFAULT '[]'::jsonb,
  linked_meetings JSONB DEFAULT '[]'::jsonb,
  linked_items JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view decisions for their projects"
  ON public.decisions FOR SELECT
  USING (true);

CREATE POLICY "Users can create decisions"
  ON public.decisions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update decisions"
  ON public.decisions FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete decisions"
  ON public.decisions FOR DELETE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.decisions;