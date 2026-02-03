-- Seed Traceability Data
DO $$
DECLARE
    project_id uuid := 'proj-test-1';
BEGIN
    -- Seed Project
    INSERT INTO public.projects (id, name, code, description, status)
    VALUES (project_id, 'Traceability Matrix Test', 'TMT-001', 'Project for testing traceability matrix wiring', 'active')
    ON CONFLICT (id) DO NOTHING;

    -- Seed Sprints
    INSERT INTO public.sprints (id, name, status, project_id)
    VALUES ('spr-1', 'Sprint 1 - Foundation', 'completed', project_id)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Tasks
    INSERT INTO public.tasks (id, name, status, project_id, wbs)
    VALUES 
      ('task-1', 'Setup Database Schema', 'completed', project_id, '1.1'),
      ('task-2', 'Develop API Endpoints', 'in-progress', project_id, '1.2')
    ON CONFLICT (id) DO NOTHING;

    -- Seed Issues
    INSERT INTO public.issues (id, title, status, project_id)
    VALUES ('iss-1', 'Database connection timeout', 'resolved', project_id)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Risks
    INSERT INTO public.risks (id, title, status, project_id)
    VALUES ('rsk-1', 'Scalability concerns under heavy load', 'mitigated', project_id)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Decisions
    INSERT INTO public.decisions (id, title, status, project_id)
    VALUES ('dec-1', 'Use PostgreSQL for metadata storage', 'approved', project_id)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Actions
    INSERT INTO public.actions (id, title, status, project_id)
    VALUES ('act-1', 'Optimize database indexes', 'completed', project_id)
    ON CONFLICT (id) DO NOTHING;

    -- Seed Meetings
    INSERT INTO public.meetings (id, title, status, project_id, date, start_time)
    VALUES ('mtg-1', 'Kickoff Meeting', 'completed', project_id, CURRENT_DATE, '09:00:00')
    ON CONFLICT (id) DO NOTHING;

    -- Seed Traceability Matrix
    -- Links:
    -- Sprint 1 -> Task 1, Task 2
    -- Task 1 -> Decision 1
    -- Task 2 -> Action 1
    -- Issue 1 -> Task 1
    -- Risk 1 -> Decision 1
    -- Meeting 1 -> Decision 1, Action 1

    INSERT INTO public.traceability_matrix (project_id, source_id, source_type, target_id, target_type, relationship_type)
    VALUES 
      (project_id, 'spr-1', 'sprint', 'task-1', 'task', 'covers'),
      (project_id, 'spr-1', 'sprint', 'task-2', 'task', 'covers'),
      (project_id, 'task-1', 'task', 'dec-1', 'decision', 'implements'),
      (project_id, 'task-2', 'task', 'act-1', 'action', 'requires'),
      (project_id, 'iss-1', 'issue', 'task-1', 'task', 'affects'),
      (project_id, 'rsk-1', 'risk', 'dec-1', 'decision', 'related'),
      (project_id, 'mtg-1', 'meeting', 'dec-1', 'decision', 'recorded'),
      (project_id, 'mtg-1', 'meeting', 'act-1', 'action', 'recorded')
    ON CONFLICT DO NOTHING;
END $$;
