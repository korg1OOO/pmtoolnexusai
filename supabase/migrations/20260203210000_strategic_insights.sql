-- Create Strategic Insights Table
CREATE TABLE IF NOT EXISTS public.strategic_insights (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'context', 'risk-discovery', 'value-engineering'
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategic_insights ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view all strategic_insights" ON public.strategic_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert strategic_insights" ON public.strategic_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update strategic_insights" ON public.strategic_insights FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete strategic_insights" ON public.strategic_insights FOR DELETE TO authenticated USING (true);

-- Add unique constraint to ensure one of each type per project (or we can allow multiple versions, but for now one is easier)
-- ALTER TABLE public.strategic_insights ADD CONSTRAINT unique_type_per_project UNIQUE (project_id, type);

-- Trigger for updated_at
CREATE TRIGGER update_strategic_insights_updated_at
    BEFORE UPDATE ON public.strategic_insights
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

