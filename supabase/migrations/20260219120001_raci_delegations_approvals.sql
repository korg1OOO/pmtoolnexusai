-- ============================================================
-- Migration: RACI Assignments, Approvals, Delegations
-- Date: 2026-02-19  (idempotent rewrite)
-- ============================================================

-- ─── RACI ASSIGNMENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raci_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    stakeholder_id  UUID REFERENCES stakeholders(id) ON DELETE CASCADE,
    activity        TEXT NOT NULL,
    raci_role       TEXT NOT NULL CHECK (raci_role IN ('R','A','C','I','R/A')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, stakeholder_id, activity)
);

ALTER TABLE raci_assignments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='raci_assignments' AND policyname='raci_select') THEN
    CREATE POLICY "raci_select" ON raci_assignments FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='raci_assignments' AND policyname='raci_insert') THEN
    CREATE POLICY "raci_insert" ON raci_assignments FOR INSERT WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='raci_assignments' AND policyname='raci_update') THEN
    CREATE POLICY "raci_update" ON raci_assignments FOR UPDATE USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='raci_assignments' AND policyname='raci_delete') THEN
    CREATE POLICY "raci_delete" ON raci_assignments FOR DELETE USING (true); END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_raci_updated_at') THEN
    CREATE TRIGGER set_raci_updated_at BEFORE UPDATE ON raci_assignments
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- ─── APPROVALS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approvals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    description     TEXT,
    type            TEXT NOT NULL DEFAULT 'general'
                        CHECK (type IN ('budget','change_request','resource','timeline','deliverable','general')),
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected','escalated','delegated')),
    priority        TEXT NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high','critical')),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assignee_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date        TIMESTAMPTZ,
    approved_at     TIMESTAMPTZ,
    rejected_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='approvals' AND policyname='approvals_select') THEN
    CREATE POLICY "approvals_select" ON approvals FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='approvals' AND policyname='approvals_insert') THEN
    CREATE POLICY "approvals_insert" ON approvals FOR INSERT WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='approvals' AND policyname='approvals_update') THEN
    CREATE POLICY "approvals_update" ON approvals FOR UPDATE USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='approvals' AND policyname='approvals_delete') THEN
    CREATE POLICY "approvals_delete" ON approvals FOR DELETE USING (true); END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_approvals_updated_at') THEN
    CREATE TRIGGER set_approvals_updated_at BEFORE UPDATE ON approvals
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- ─── DELEGATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delegations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    delegate_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    approval_id         UUID REFERENCES approvals(id) ON DELETE CASCADE,
    delegation_type     TEXT NOT NULL DEFAULT 'temporary'
                            CHECK (delegation_type IN ('temporary','permanent')),
    reason              TEXT,
    status              TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','expired','revoked')),
    expires_at          TIMESTAMPTZ,
    revoked_at          TIMESTAMPTZ,
    revoked_reason      TEXT,
    can_subdelegate     BOOLEAN DEFAULT FALSE,
    parent_delegation_id UUID REFERENCES delegations(id) ON DELETE SET NULL,
    delegation_depth    INTEGER DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CHECK (delegator_id != delegate_id)
);

ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delegations' AND policyname='delegations_select') THEN
    CREATE POLICY "delegations_select" ON delegations FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delegations' AND policyname='delegations_insert') THEN
    CREATE POLICY "delegations_insert" ON delegations FOR INSERT WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delegations' AND policyname='delegations_update') THEN
    CREATE POLICY "delegations_update" ON delegations FOR UPDATE USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delegations' AND policyname='delegations_delete') THEN
    CREATE POLICY "delegations_delete" ON delegations FOR DELETE USING (true); END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_delegations_updated_at') THEN
    CREATE TRIGGER set_delegations_updated_at BEFORE UPDATE ON delegations
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- ─── DELEGATION TEMPLATES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS delegation_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    delegate_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    delegation_type TEXT NOT NULL DEFAULT 'temporary'
                        CHECK (delegation_type IN ('temporary','permanent')),
    reason          TEXT,
    duration_days   INTEGER,
    can_subdelegate BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE delegation_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delegation_templates' AND policyname='del_templates_select') THEN
    CREATE POLICY "del_templates_select" ON delegation_templates FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delegation_templates' AND policyname='del_templates_insert') THEN
    CREATE POLICY "del_templates_insert" ON delegation_templates FOR INSERT WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delegation_templates' AND policyname='del_templates_update') THEN
    CREATE POLICY "del_templates_update" ON delegation_templates FOR UPDATE USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delegation_templates' AND policyname='del_templates_delete') THEN
    CREATE POLICY "del_templates_delete" ON delegation_templates FOR DELETE USING (true); END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_delegation_templates_updated_at') THEN
    CREATE TRIGGER set_delegation_templates_updated_at BEFORE UPDATE ON delegation_templates
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- ─── FUNCTION: Auto-expire delegations ───────────────────────
CREATE OR REPLACE FUNCTION check_expired_delegations()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    UPDATE delegations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at < NOW();
END;
$$;

-- ─── VIEW: Delegation history ──────────────────────────────
-- Drop first to avoid "cannot change column name" error on re-run
DROP VIEW IF EXISTS delegation_history;
CREATE VIEW delegation_history AS
    SELECT
        d.id,
        d.approval_id,
        a.title AS approval_title,
        d.delegator_id,
        dp.full_name AS delegator_name,
        dp.email    AS delegator_email,
        d.delegate_id,
        de.full_name AS delegate_name,
        de.email     AS delegate_email,
        d.delegation_type,
        d.reason,
        d.status,
        d.created_at,
        d.revoked_at,
        d.expires_at,
        d.parent_delegation_id,
        d.delegation_depth,
        d.can_subdelegate
    FROM delegations d
    LEFT JOIN approvals  a  ON a.id = d.approval_id
    LEFT JOIN profiles   dp ON dp.id = d.delegator_id
    LEFT JOIN profiles   de ON de.id = d.delegate_id;

-- ─── SEED: Sample approvals ──────────────────────────────────
DO $$
DECLARE v_project_id UUID;
BEGIN
    SELECT id INTO v_project_id FROM projects LIMIT 1;
    IF v_project_id IS NOT NULL THEN
        INSERT INTO approvals (title, type, status, priority, project_id, due_date)
        VALUES
            ('Q1 Budget Increase – $50K', 'budget', 'pending', 'high', v_project_id, NOW() + INTERVAL '3 days'),
            ('Add 2 Frontend Engineers', 'resource', 'pending', 'medium', v_project_id, NOW() + INTERVAL '7 days'),
            ('Milestone 3 Deadline Extension', 'timeline', 'pending', 'high', v_project_id, NOW() + INTERVAL '5 days'),
            ('Change Request CR-041', 'change_request', 'pending', 'critical', v_project_id, NOW() + INTERVAL '1 day'),
            ('Sprint 12 Deliverable Sign-off', 'deliverable', 'approved', 'medium', v_project_id, NOW() - INTERVAL '2 days')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ─── SEED: Sample RACI rows ───────────────────────────────────
DO $$
DECLARE
    v_project_id   UUID;
    v_stakeholder  RECORD;
    v_activities   TEXT[] := ARRAY[
        'Project Charter Approval',
        'Budget Allocation',
        'Technical Architecture',
        'Business Requirements',
        'Go/No-Go Decision',
        'Change Requests'
    ];
    v_roles TEXT[] := ARRAY['A','R','C','I'];
    v_activity TEXT;
BEGIN
    SELECT id INTO v_project_id FROM projects LIMIT 1;
    IF v_project_id IS NULL THEN RETURN; END IF;

    FOR v_stakeholder IN
        SELECT id FROM stakeholders WHERE project_id = v_project_id LIMIT 4
    LOOP
        FOREACH v_activity IN ARRAY v_activities LOOP
            INSERT INTO raci_assignments (project_id, stakeholder_id, activity, raci_role)
            VALUES (
                v_project_id,
                v_stakeholder.id,
                v_activity,
                v_roles[1 + floor(random()*4)::int % 4]
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
