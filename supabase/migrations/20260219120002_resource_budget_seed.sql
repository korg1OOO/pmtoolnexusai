-- ============================================================
-- Resource & Budget seed data
-- 2026-02-19  (idempotent rewrite)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Create tasks for existing projects so resource_assignments
--    can reference them (task_id FK).
--    wbs value is required (NOT NULL) — using a placeholder path.
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_project1 UUID := 'bcee9dcd-b162-41e0-ae99-55a1b8af85c3';
  v_project2 UUID := 'a2000001-aaaa-4bbb-8ccc-ddddeeee0001';
  v_project3 UUID := 'a2000002-aaaa-4bbb-8ccc-ddddeeee0002';
BEGIN
  -- Only insert if the project actually exists to avoid FK violation
  IF EXISTS (SELECT 1 FROM projects WHERE id = v_project1) THEN
    INSERT INTO tasks (id, project_id, name, status, priority, wbs, created_at, updated_at)
    VALUES
      ('bb200001-bbbb-4ccc-8ddd-eeeeffff0001', v_project1, 'Infrastructure Setup', 'in-progress', 'high', '1.1', NOW(), NOW()),
      ('bb200002-bbbb-4ccc-8ddd-eeeeffff0002', v_project1, 'Data Migration',        'in-progress', 'high', '1.2', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM projects WHERE id = v_project2) THEN
    INSERT INTO tasks (id, project_id, name, status, priority, wbs, created_at, updated_at)
    VALUES
      ('bb200003-bbbb-4ccc-8ddd-eeeeffff0003', v_project2, 'API Design', 'in-progress', 'medium', '1.1', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM projects WHERE id = v_project3) THEN
    INSERT INTO tasks (id, project_id, name, status, priority, wbs, created_at, updated_at)
    VALUES
      ('bb200004-bbbb-4ccc-8ddd-eeeeffff0004', v_project3, 'Mobile UI Build', 'in-progress', 'high', '1.1', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. Seed resource_assignments  (skip if tasks don't exist)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Only seed if all referenced tasks were inserted
  IF EXISTS (SELECT 1 FROM tasks WHERE id = 'bb200001-bbbb-4ccc-8ddd-eeeeffff0001')
     AND EXISTS (SELECT 1 FROM tasks WHERE id = 'bb200002-bbbb-4ccc-8ddd-eeeeffff0002') THEN

    INSERT INTO resource_assignments (
      id, task_id, resource_id, units, work_hours, actual_work_hours,
      remaining_work_hours, start_date, end_date, cost, actual_cost,
      created_at, updated_at
    ) VALUES
      ('cc300001-cccc-4ddd-8eee-ffff00000001',
       'bb200001-bbbb-4ccc-8ddd-eeeeffff0001', 'aa100001-aaaa-4bbb-8ccc-ddddeeee0001',
       85, 340, 170, 170, '2026-01-01', '2026-06-30', 32300, 16150, NOW(), NOW()),

      ('cc300002-cccc-4ddd-8eee-ffff00000002',
       'bb200002-bbbb-4ccc-8ddd-eeeeffff0002', 'aa100001-aaaa-4bbb-8ccc-ddddeeee0001',
       40, 160, 40, 120, '2026-03-01', '2026-09-30', 15200, 3800, NOW(), NOW()),

      ('cc300003-cccc-4ddd-8eee-ffff00000003',
       'bb200001-bbbb-4ccc-8ddd-eeeeffff0001', 'aa100002-aaaa-4bbb-8ccc-ddddeeee0002',
       60, 240, 120, 120, '2026-01-01', '2026-06-30', 26400, 13200, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM tasks WHERE id = 'bb200003-bbbb-4ccc-8ddd-eeeeffff0003') THEN
    INSERT INTO resource_assignments (
      id, task_id, resource_id, units, work_hours, actual_work_hours,
      remaining_work_hours, start_date, end_date, cost, actual_cost,
      created_at, updated_at
    ) VALUES
      ('cc300004-cccc-4ddd-8eee-ffff00000004',
       'bb200003-bbbb-4ccc-8ddd-eeeeffff0003', 'aa100003-aaaa-4bbb-8ccc-ddddeeee0003',
       70, 280, 100, 180, '2026-02-01', '2026-08-31', 29400, 10500, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM tasks WHERE id = 'bb200004-bbbb-4ccc-8ddd-eeeeffff0004') THEN
    INSERT INTO resource_assignments (
      id, task_id, resource_id, units, work_hours, actual_work_hours,
      remaining_work_hours, start_date, end_date, cost, actual_cost,
      created_at, updated_at
    ) VALUES
      ('cc300005-cccc-4ddd-8eee-ffff00000005',
       'bb200004-bbbb-4ccc-8ddd-eeeeffff0004', 'aa100004-aaaa-4bbb-8ccc-ddddeeee0004',
       90, 360, 80, 280, '2026-02-01', '2026-10-31', 43200, 9600, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
