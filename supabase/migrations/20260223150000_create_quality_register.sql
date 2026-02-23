CREATE TABLE IF NOT EXISTS public.project_quality_register (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  standard_reference text,
  status text NOT NULL DEFAULT 'pending',
  inspection_date date,
  inspector_name text,
  comments text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  tenant_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_quality_register ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "Users can view quality items in their tenant"
  ON public.project_quality_register FOR SELECT
  USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert quality items in their tenant"
  ON public.project_quality_register FOR INSERT
  WITH CHECK (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update quality items in their tenant"
  ON public.project_quality_register FOR UPDATE
  USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete quality items in their tenant"
  ON public.project_quality_register FOR DELETE
  USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

-- Trigger for updated_at
CREATE TRIGGER set_project_quality_register_updated_at
BEFORE UPDATE ON public.project_quality_register
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Additional policy specific to project access
CREATE POLICY "Project access controls quality items"
  ON public.project_quality_register FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid
    )
  );
