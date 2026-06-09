-- =============================================================================
-- PMCC Phase 1 Migration: New tables for all 10 modules
-- Created: 27-Mar-2026
-- Non-breaking: only CREATE TABLE IF NOT EXISTS — no existing tables modified
-- =============================================================================

-- ─── 1. ASSUMPTIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    owner_name TEXT,
    due_date DATE,
    status TEXT CHECK (status IN ('open', 'validated', 'invalidated', 'closed')) DEFAULT 'open',
    impact_if_wrong TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.assumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View assumptions of own projects" ON public.assumptions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.assumptions.project_id));
CREATE POLICY "Insert assumptions into own projects" ON public.assumptions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.assumptions.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Update assumptions of own projects" ON public.assumptions FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.assumptions.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Delete assumptions of own projects" ON public.assumptions FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.assumptions.project_id AND role IN ('admin','pm')));

CREATE TRIGGER handle_updated_at_assumptions
    BEFORE UPDATE ON public.assumptions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

GRANT ALL ON public.assumptions TO authenticated;


-- ─── 2. DEPENDENCIES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    dependent_on TEXT NOT NULL,   -- who/what this depends on
    provider TEXT,                -- team/org providing the dependency
    due_date DATE,
    status TEXT CHECK (status IN ('pending', 'at_risk', 'received', 'blocked')) DEFAULT 'pending',
    owner_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View dependencies of own projects" ON public.dependencies FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.dependencies.project_id));
CREATE POLICY "Insert dependencies into own projects" ON public.dependencies FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.dependencies.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Update dependencies of own projects" ON public.dependencies FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.dependencies.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Delete dependencies of own projects" ON public.dependencies FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.dependencies.project_id AND role IN ('admin','pm')));

CREATE TRIGGER handle_updated_at_dependencies
    BEFORE UPDATE ON public.dependencies FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

GRANT ALL ON public.dependencies TO authenticated;


-- ─── 3. ESCALATIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    raised_by TEXT NOT NULL,
    raised_date DATE NOT NULL,
    escalated_to TEXT,       -- person/team escalated to
    response TEXT,
    response_date DATE,
    priority TEXT CHECK (priority IN ('low','medium','high','critical')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('open','in_progress','resolved','closed')) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View escalations of own projects" ON public.escalations FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.escalations.project_id));
CREATE POLICY "Insert escalations into own projects" ON public.escalations FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.escalations.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Update escalations of own projects" ON public.escalations FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.escalations.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Delete escalations of own projects" ON public.escalations FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.escalations.project_id AND role IN ('admin','pm')));

CREATE TRIGGER handle_updated_at_escalations
    BEFORE UPDATE ON public.escalations FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

GRANT ALL ON public.escalations TO authenticated;


-- ─── 4. KEY PERSONNEL ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.key_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    organisation TEXT CHECK (organisation IN ('client','si','other')) DEFAULT 'client',
    contract_start_date DATE,
    status TEXT CHECK (status IN ('active','replaced','exited')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.key_personnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View key_personnel of own projects" ON public.key_personnel FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.key_personnel.project_id));
CREATE POLICY "Insert key_personnel into own projects" ON public.key_personnel FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.key_personnel.project_id AND role IN ('admin','pm')));
CREATE POLICY "Update key_personnel of own projects" ON public.key_personnel FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.key_personnel.project_id AND role IN ('admin','pm')));
CREATE POLICY "Delete key_personnel of own projects" ON public.key_personnel FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.key_personnel.project_id AND role IN ('admin','pm')));

CREATE TRIGGER handle_updated_at_key_personnel
    BEFORE UPDATE ON public.key_personnel FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

GRANT ALL ON public.key_personnel TO authenticated;


-- ─── 5. KEY PERSONNEL REPLACEMENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.key_personnel_replacements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_person_id UUID NOT NULL REFERENCES public.key_personnel(id) ON DELETE CASCADE,
    date_notified DATE NOT NULL,
    reason TEXT NOT NULL,
    replacement_name TEXT,
    review_period_days INTEGER DEFAULT 30,
    review_deadline DATE,
    outcome TEXT CHECK (outcome IN ('accepted','rejected','pending')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.key_personnel_replacements ENABLE ROW LEVEL SECURITY;

-- Use a join through key_personnel → projects for RLS
CREATE POLICY "View replacements of projects you belong to" ON public.key_personnel_replacements FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.key_personnel kp
        JOIN public.user_roles ur ON ur.project_id = kp.project_id
        WHERE kp.id = public.key_personnel_replacements.key_person_id
          AND ur.user_id = auth.uid()
    ));
CREATE POLICY "Insert replacements" ON public.key_personnel_replacements FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.key_personnel kp
        JOIN public.user_roles ur ON ur.project_id = kp.project_id
        WHERE kp.id = public.key_personnel_replacements.key_person_id
          AND ur.user_id = auth.uid()
          AND ur.role IN ('admin','pm')
    ));
CREATE POLICY "Update replacements" ON public.key_personnel_replacements FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.key_personnel kp
        JOIN public.user_roles ur ON ur.project_id = kp.project_id
        WHERE kp.id = public.key_personnel_replacements.key_person_id
          AND ur.user_id = auth.uid()
          AND ur.role IN ('admin','pm')
    ));

GRANT ALL ON public.key_personnel_replacements TO authenticated;


-- ─── 6. PROGRAM CONTRACT CONFIG ──────────────────────────────────────────────
-- One row per project (program-scoped)
CREATE TABLE IF NOT EXISTS public.program_contract_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
    contract_value NUMERIC(18,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    payment_terms_days INTEGER DEFAULT 30,
    penalty_rate_pct NUMERIC(6,4) DEFAULT 0.5,    -- % per week
    penalty_cap_pct NUMERIC(6,2) DEFAULT 10,       -- % of milestone value
    acceptance_period_days INTEGER DEFAULT 30,
    key_personnel_review_days INTEGER DEFAULT 30,
    subcontractor_review_days INTEGER,
    training_sessions_target INTEGER,
    training_hours_target INTEGER,
    training_max_per_session INTEGER,
    hypercare_weeks INTEGER,
    governing_reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.program_contract_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View contract config of own projects" ON public.program_contract_config FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.program_contract_config.project_id));
CREATE POLICY "Insert contract config" ON public.program_contract_config FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.program_contract_config.project_id AND role IN ('admin','pm')));
CREATE POLICY "Update contract config" ON public.program_contract_config FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.program_contract_config.project_id AND role IN ('admin','pm')));

CREATE TRIGGER handle_updated_at_program_contract_config
    BEFORE UPDATE ON public.program_contract_config FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

GRANT ALL ON public.program_contract_config TO authenticated;


-- ─── 7. CONTRACT DOCUMENT LINKS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    doc_type TEXT NOT NULL,    -- e.g. Contract, SOW, Annexure, Amendment
    phase TEXT,
    version TEXT,
    url TEXT,
    status TEXT CHECK (status IN ('active','superseded','draft')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contract_document_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View doc links of own projects" ON public.contract_document_links FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.contract_document_links.project_id));
CREATE POLICY "Insert doc links" ON public.contract_document_links FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.contract_document_links.project_id AND role IN ('admin','pm')));
CREATE POLICY "Update doc links" ON public.contract_document_links FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.contract_document_links.project_id AND role IN ('admin','pm')));
CREATE POLICY "Delete doc links" ON public.contract_document_links FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.contract_document_links.project_id AND role IN ('admin','pm')));

GRANT ALL ON public.contract_document_links TO authenticated;


-- ─── 8. TRAINING SESSIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    module_stream TEXT NOT NULL,
    trainer TEXT NOT NULL,
    participant_names TEXT[] DEFAULT '{}',
    max_capacity INTEGER DEFAULT 20,
    location TEXT CHECK (location IN ('on-site','remote')) DEFAULT 'on-site',
    status TEXT CHECK (status IN ('scheduled','delivered','cancelled')) DEFAULT 'scheduled',
    attendance_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View training_sessions of own projects" ON public.training_sessions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.training_sessions.project_id));
CREATE POLICY "Insert training_sessions" ON public.training_sessions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.training_sessions.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Update training_sessions" ON public.training_sessions FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.training_sessions.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Delete training_sessions" ON public.training_sessions FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.training_sessions.project_id AND role IN ('admin','pm')));

CREATE TRIGGER handle_updated_at_training_sessions
    BEFORE UPDATE ON public.training_sessions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

GRANT ALL ON public.training_sessions TO authenticated;


-- ─── 9. ADKAR ASSESSMENTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.adkar_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    business_unit TEXT NOT NULL,
    module_stream TEXT NOT NULL,
    assessment_date DATE NOT NULL,
    assessor TEXT NOT NULL,
    awareness_score SMALLINT NOT NULL CHECK (awareness_score BETWEEN 1 AND 5),
    desire_score SMALLINT NOT NULL CHECK (desire_score BETWEEN 1 AND 5),
    knowledge_score SMALLINT NOT NULL CHECK (knowledge_score BETWEEN 1 AND 5),
    ability_score SMALLINT NOT NULL CHECK (ability_score BETWEEN 1 AND 5),
    reinforcement_score SMALLINT NOT NULL CHECK (reinforcement_score BETWEEN 1 AND 5),
    overall_score NUMERIC(3,1) GENERATED ALWAYS AS (
        ROUND((awareness_score + desire_score + knowledge_score + ability_score + reinforcement_score)::NUMERIC / 5, 1)
    ) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.adkar_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View adkar_assessments of own projects" ON public.adkar_assessments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.adkar_assessments.project_id));
CREATE POLICY "Insert adkar_assessments" ON public.adkar_assessments FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.adkar_assessments.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Delete adkar_assessments" ON public.adkar_assessments FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.adkar_assessments.project_id AND role IN ('admin','pm')));

GRANT ALL ON public.adkar_assessments TO authenticated;


-- ─── 10. DEFECTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('P1','P2','P3','P4')) DEFAULT 'P3',
    type TEXT DEFAULT 'Functional',
    raised_by TEXT NOT NULL,
    assigned_to TEXT,
    raised_date DATE NOT NULL DEFAULT CURRENT_DATE,
    resolved_date DATE,
    status TEXT CHECK (status IN ('open','in_progress','resolved','closed','deferred')) DEFAULT 'open',
    external_ticket_url TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View defects of own projects" ON public.defects FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.defects.project_id));
CREATE POLICY "Insert defects" ON public.defects FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.defects.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Update defects" ON public.defects FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.defects.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Delete defects" ON public.defects FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.defects.project_id AND role IN ('admin','pm')));

CREATE TRIGGER handle_updated_at_defects
    BEFORE UPDATE ON public.defects FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

GRANT ALL ON public.defects TO authenticated;


-- ─── 11. TRIAGE SESSIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.triage_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    participants TEXT[] DEFAULT '{}',
    defects_triaged INTEGER DEFAULT 0,
    decisions TEXT NOT NULL,
    actions TEXT,
    next_triage_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.triage_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View triage_sessions of own projects" ON public.triage_sessions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.triage_sessions.project_id));
CREATE POLICY "Insert triage_sessions" ON public.triage_sessions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.triage_sessions.project_id AND role IN ('admin','pm','developer','analyst')));
CREATE POLICY "Delete triage_sessions" ON public.triage_sessions FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND project_id = public.triage_sessions.project_id AND role IN ('admin','pm')));

GRANT ALL ON public.triage_sessions TO authenticated;


-- ─── MILESTONES: add optional columns for Penalty Tracker ────────────────────
-- Only add if not already present — safe to re-run
-- ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS milestone_value NUMERIC(18,2);
-- ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS actual_date DATE;
