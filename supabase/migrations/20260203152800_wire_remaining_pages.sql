-- Create Enum Types
DO $$ BEGIN
    CREATE TYPE public.stakeholder_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.stakeholder_engagement AS ENUM ('supportive', 'neutral', 'resistant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.cr_status AS ENUM ('pending', 'analyzing', 'approved', 'rejected', 'implemented');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Stakeholders Table
CREATE TABLE IF NOT EXISTS public.stakeholders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    role text,
    organization text,
    email text,
    phone text,
    influence public.stakeholder_level DEFAULT 'medium',
    interest public.stakeholder_level DEFAULT 'medium',
    engagement public.stakeholder_engagement DEFAULT 'neutral',
    category text,
    communication_preference text,
    key_interests jsonb DEFAULT '[]'::jsonb,
    is_key_stakeholder boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create Change Requests Table
CREATE TABLE IF NOT EXISTS public.change_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status public.cr_status DEFAULT 'pending',
    priority public.priority_level DEFAULT 'medium',
    type text,
    impact_area text,
    requested_by_id uuid,
    requested_by_name text,
    approved_by_id uuid,
    approved_by_name text,
    requested_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create Lessons Learned Table
CREATE TABLE IF NOT EXISTS public.lessons_learned (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    category text,
    impact public.stakeholder_level DEFAULT 'medium',
    recommendation text,
    created_by_id uuid,
    created_by_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create Portfolios Table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active',
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id uuid REFERENCES public.portfolios(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active',
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add program_id and portfolio_id to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS portfolio_id uuid REFERENCES public.portfolios(id) ON DELETE SET NULL;

-- Create Traceability Matrix Table
CREATE TABLE IF NOT EXISTS public.traceability_matrix (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    source_id uuid NOT NULL,
    source_type text NOT NULL,
    target_id uuid NOT NULL,
    target_type text NOT NULL,
    relationship_type text DEFAULT 'covers',
    created_at timestamp with time zone DEFAULT now()
);

-- Create Scenarios Table
CREATE TABLE IF NOT EXISTS public.scenarios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    data jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traceability_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view all stakeholders" ON public.stakeholders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert stakeholders" ON public.stakeholders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update stakeholders" ON public.stakeholders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete stakeholders" ON public.stakeholders FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all change_requests" ON public.change_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert change_requests" ON public.change_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update change_requests" ON public.change_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete change_requests" ON public.change_requests FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all lessons_learned" ON public.lessons_learned FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert lessons_learned" ON public.lessons_learned FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update lessons_learned" ON public.lessons_learned FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete lessons_learned" ON public.lessons_learned FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view all portfolios" ON public.portfolios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert portfolios" ON public.portfolios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view all programs" ON public.programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert programs" ON public.programs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view all traceability_matrix" ON public.traceability_matrix FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert traceability_matrix" ON public.traceability_matrix FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view all scenarios" ON public.scenarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert scenarios" ON public.scenarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update scenarios" ON public.scenarios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete scenarios" ON public.scenarios FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_stakeholders_updated_at BEFORE UPDATE ON public.stakeholders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON public.change_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_learned_updated_at BEFORE UPDATE ON public.lessons_learned FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add triggers for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stakeholders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.change_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons_learned;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.programs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.traceability_matrix;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scenarios;
