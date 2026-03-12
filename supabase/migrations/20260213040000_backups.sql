-- Phase 17: Database Backups
-- Create backup job tracking and scheduling

-- Backup Jobs Table
CREATE TABLE IF NOT EXISTS backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  file_size BIGINT,
  storage_location TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup Schedules Table
CREATE TABLE IF NOT EXISTS backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental')),
  retention_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup History View
CREATE OR REPLACE VIEW backup_history AS
SELECT 
  bj.id,
  bj.backup_type,
  bj.status,
  bj.file_size,
  bj.storage_location,
  bj.started_at,
  bj.completed_at,
  CASE 
    WHEN bj.completed_at IS NOT NULL AND bj.started_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (bj.completed_at - bj.started_at))::INT
    ELSE NULL
  END as duration_seconds,
  u.email as created_by_email,
  bj.created_at
FROM backup_jobs bj
LEFT JOIN auth.users u ON bj.created_by = u.id
ORDER BY bj.created_at DESC;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_created ON backup_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_active ON backup_schedules(is_active);

-- Comments
COMMENT ON TABLE backup_jobs IS 'Database backup job tracking';
COMMENT ON TABLE backup_schedules IS 'Automated backup scheduling configuration';
COMMENT ON VIEW backup_history IS 'Backup job history with duration and creator info';
