-- Create project_members table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'invited', 'inactive'
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS for project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- project_members policies
CREATE POLICY "Users can view members of their projects" ON public.project_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members WHERE project_id = public.project_members.project_id
    )
  );

CREATE POLICY "Project admins can manage members" ON public.project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_id = public.project_members.project_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Create stage_gates table
CREATE TABLE IF NOT EXISTS public.stage_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phase TEXT, -- 'Discovery', 'Planning', 'Execution', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in-review', 'approved', 'rejected', 'deferred'
  scheduled_date DATE,
  actual_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for stage_gates
ALTER TABLE public.stage_gates ENABLE ROW LEVEL SECURITY;

-- stage_gates policies
CREATE POLICY "Users can view stage gates of their projects" ON public.stage_gates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_id = public.stage_gates.project_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can manage stage gates" ON public.stage_gates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_id = public.stage_gates.project_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );


-- Create gate_criteria table
CREATE TABLE IF NOT EXISTS public.gate_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_id UUID NOT NULL REFERENCES public.stage_gates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not-met', -- 'met', 'not-met', 'partial', 'na'
  evidence_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for gate_criteria
ALTER TABLE public.gate_criteria ENABLE ROW LEVEL SECURITY;

-- gate_criteria policies (Inherit from stage_gates/project membership)
CREATE POLICY "Users can view gate criteria of their projects" ON public.gate_criteria
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stage_gates
      JOIN public.project_members ON public.stage_gates.project_id = public.project_members.project_id
      WHERE public.stage_gates.id = public.gate_criteria.gate_id
      AND public.project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can manage gate criteria" ON public.gate_criteria
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stage_gates
      JOIN public.project_members ON public.stage_gates.project_id = public.project_members.project_id
      WHERE public.stage_gates.id = public.gate_criteria.gate_id
      AND public.project_members.user_id = auth.uid()
      AND public.project_members.role IN ('owner', 'admin', 'member')
    )
  );

-- Create gate_approvers table
CREATE TABLE IF NOT EXISTS public.gate_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_id UUID NOT NULL REFERENCES public.stage_gates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT, -- e.g. 'Project Sponsor', 'Tech Lead'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  comments TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gate_id, user_id)
);

-- Enable RLS for gate_approvers
ALTER TABLE public.gate_approvers ENABLE ROW LEVEL SECURITY;

-- gate_approvers policies
CREATE POLICY "Users can view gate approvers of their projects" ON public.gate_approvers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stage_gates
      JOIN public.project_members ON public.stage_gates.project_id = public.project_members.project_id
      WHERE public.stage_gates.id = public.gate_approvers.gate_id
      AND public.project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own approvals" ON public.gate_approvers
  FOR UPDATE USING (
    auth.uid() = user_id
  );

CREATE POLICY "Project admins can manage approvers list" ON public.gate_approvers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stage_gates
      JOIN public.project_members ON public.stage_gates.project_id = public.project_members.project_id
      WHERE public.stage_gates.id = gate_id
      AND public.project_members.user_id = auth.uid()
      AND public.project_members.role IN ('owner', 'admin')
    )
  );
