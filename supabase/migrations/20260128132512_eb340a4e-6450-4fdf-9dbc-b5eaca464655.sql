-- =============================================
-- MS PROJECT FEATURE ENHANCEMENT - PHASE 1
-- =============================================

-- New enums for constraint types and resource types
CREATE TYPE constraint_type AS ENUM ('ASAP', 'ALAP', 'MSO', 'MFO', 'SNET', 'SNLT', 'FNET', 'FNLT');
CREATE TYPE resource_type AS ENUM ('work', 'material', 'cost');
CREATE TYPE cost_accrual AS ENUM ('start', 'end', 'prorated');

-- =============================================
-- PROJECT CALENDARS
-- =============================================
CREATE TABLE public.project_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Standard',
  is_default BOOLEAN NOT NULL DEFAULT false,
  working_days JSONB NOT NULL DEFAULT '{"mon": true, "tue": true, "wed": true, "thu": true, "fri": true, "sat": false, "sun": false}',
  work_hours JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "17:00", "hours_per_day": 8}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calendar exceptions (holidays, special working days)
CREATE TABLE public.calendar_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID NOT NULL REFERENCES public.project_calendars(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exception_type TEXT NOT NULL DEFAULT 'holiday', -- 'holiday' or 'working'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  work_hours JSONB, -- null for non-working, or custom hours
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- RESOURCES
-- =============================================
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  type resource_type NOT NULL DEFAULT 'work',
  max_units NUMERIC NOT NULL DEFAULT 1.0, -- 1.0 = 100%
  standard_rate NUMERIC NOT NULL DEFAULT 0,
  overtime_rate NUMERIC NOT NULL DEFAULT 0,
  cost_per_use NUMERIC NOT NULL DEFAULT 0,
  calendar_id UUID REFERENCES public.project_calendars(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- RESOURCE ASSIGNMENTS
-- =============================================
CREATE TABLE public.resource_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  units NUMERIC NOT NULL DEFAULT 1.0, -- allocation percentage (1.0 = 100%)
  work_hours NUMERIC NOT NULL DEFAULT 0, -- planned work
  actual_work_hours NUMERIC NOT NULL DEFAULT 0, -- completed work
  remaining_work_hours NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  cost NUMERIC NOT NULL DEFAULT 0,
  actual_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, resource_id)
);

-- =============================================
-- EXTEND TASKS TABLE
-- =============================================

-- Constraint columns
ALTER TABLE public.tasks ADD COLUMN constraint_type constraint_type DEFAULT 'ASAP';
ALTER TABLE public.tasks ADD COLUMN constraint_date DATE;
ALTER TABLE public.tasks ADD COLUMN deadline DATE;

-- Work/effort columns
ALTER TABLE public.tasks ADD COLUMN work_hours NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN actual_work_hours NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN remaining_work_hours NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN effort_driven BOOLEAN DEFAULT false;

-- Cost columns
ALTER TABLE public.tasks ADD COLUMN cost NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN actual_cost NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN fixed_cost NUMERIC DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN fixed_cost_accrual cost_accrual DEFAULT 'prorated';

-- CPM/Scheduling columns
ALTER TABLE public.tasks ADD COLUMN early_start DATE;
ALTER TABLE public.tasks ADD COLUMN early_finish DATE;
ALTER TABLE public.tasks ADD COLUMN late_start DATE;
ALTER TABLE public.tasks ADD COLUMN late_finish DATE;
ALTER TABLE public.tasks ADD COLUMN free_slack INTEGER DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN total_slack INTEGER DEFAULT 0;

-- Scheduling mode
ALTER TABLE public.tasks ADD COLUMN manually_scheduled BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN calendar_id UUID REFERENCES public.project_calendars(id) ON DELETE SET NULL;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Project Calendars RLS
ALTER TABLE public.project_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project calendars" 
ON public.project_calendars FOR SELECT USING (true);

CREATE POLICY "Users can create project calendars" 
ON public.project_calendars FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update project calendars" 
ON public.project_calendars FOR UPDATE USING (true);

CREATE POLICY "Users can delete project calendars" 
ON public.project_calendars FOR DELETE USING (true);

-- Calendar Exceptions RLS
ALTER TABLE public.calendar_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calendar exceptions" 
ON public.calendar_exceptions FOR SELECT USING (true);

CREATE POLICY "Users can create calendar exceptions" 
ON public.calendar_exceptions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update calendar exceptions" 
ON public.calendar_exceptions FOR UPDATE USING (true);

CREATE POLICY "Users can delete calendar exceptions" 
ON public.calendar_exceptions FOR DELETE USING (true);

-- Resources RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view resources" 
ON public.resources FOR SELECT USING (true);

CREATE POLICY "Users can create resources" 
ON public.resources FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update resources" 
ON public.resources FOR UPDATE USING (true);

CREATE POLICY "Users can delete resources" 
ON public.resources FOR DELETE USING (true);

-- Resource Assignments RLS
ALTER TABLE public.resource_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view resource assignments" 
ON public.resource_assignments FOR SELECT USING (true);

CREATE POLICY "Users can create resource assignments" 
ON public.resource_assignments FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update resource assignments" 
ON public.resource_assignments FOR UPDATE USING (true);

CREATE POLICY "Users can delete resource assignments" 
ON public.resource_assignments FOR DELETE USING (true);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps for resources
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamps for resource assignments
CREATE TRIGGER update_resource_assignments_updated_at
BEFORE UPDATE ON public.resource_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ENABLE REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_calendars;

-- =============================================
-- CREATE DEFAULT CALENDAR FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.create_default_calendar()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_calendars (project_id, name, is_default)
  VALUES (NEW.id, 'Standard', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default calendar when project is created
CREATE TRIGGER create_project_default_calendar
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.create_default_calendar();