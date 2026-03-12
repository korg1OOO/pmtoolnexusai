/**
 * Phase 19 Database Migration: Health Monitoring
 * Creates tables for system metrics, service status, and performance monitoring
 */

-- =============================================
-- SYSTEM METRICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded ON system_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type_recorded ON system_metrics(metric_type, recorded_at DESC);

-- =============================================
-- SERVICE STATUS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS service_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT DEFAULT 'healthy',
  response_time NUMERIC,
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index on service_name (latest status per service)
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_status_name ON service_status(service_name);
CREATE INDEX IF NOT EXISTS idx_service_status_status ON service_status(status);
CREATE INDEX IF NOT EXISTS idx_service_status_updated ON service_status(updated_at DESC);

-- =============================================
-- PERFORMANCE THRESHOLDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS performance_thresholds (
  metric_type TEXT PRIMARY KEY,
  warning_threshold NUMERIC NOT NULL,
  critical_threshold NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default thresholds
INSERT INTO performance_thresholds (metric_type, warning_threshold, critical_threshold, unit, description) VALUES
('api_response_time', 1000, 3000, 'ms', 'API endpoint response time'),
('database_query_time', 500, 2000, 'ms', 'Database query execution time'),
('error_rate', 1, 5, 'percentage', 'Error rate percentage'),
('cpu_usage', 70, 90, 'percentage', 'CPU utilization'),
('memory_usage', 75, 90, 'percentage', 'Memory utilization'),
('disk_usage', 80, 95, 'percentage', 'Disk space utilization'),
('cache_hit_rate', 0.7, 0.5, 'ratio', 'Cache hit rate (inverted - lower is warning)'),
('active_connections', 80, 95, 'percentage', 'Active database connections')
ON CONFLICT (metric_type) DO NOTHING;

-- =============================================
-- VIEWS
-- =============================================

-- System health summary view
CREATE OR REPLACE VIEW system_health_summary AS
SELECT 
  service_name,
  status,
  response_time,
  last_check_at,
  CASE 
    WHEN last_check_at > NOW() - INTERVAL '5 minutes' THEN 'current'
    WHEN last_check_at > NOW() - INTERVAL '15 minutes' THEN 'stale'
    ELSE 'outdated'
  END as freshness,
  error_message
FROM service_status
ORDER BY 
  CASE status 
    WHEN 'down' THEN 1
    WHEN 'degraded' THEN 2
    WHEN 'healthy' THEN 3
  END,
  service_name;

-- Recent metrics by type (last 24 hours)
CREATE OR REPLACE VIEW recent_metrics_summary AS
SELECT 
  metric_type,
  COUNT(*) as sample_count,
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) as median_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as p95_value,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) as p99_value,
  MAX(recorded_at) as last_recorded
FROM system_metrics
WHERE recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY metric_type
ORDER BY metric_type;

-- Metrics with threshold violations
CREATE OR REPLACE VIEW metric_threshold_violations AS
SELECT 
  sm.id,
  sm.metric_type,
  sm.value,
  sm.unit,
  sm.recorded_at,
  pt.warning_threshold,
  pt.critical_threshold,
  CASE 
    WHEN sm.value >= pt.critical_threshold THEN 'critical'
    WHEN sm.value >= pt.warning_threshold THEN 'warning'
    ELSE 'normal'
  END as severity,
  sm.metadata
FROM system_metrics sm
JOIN performance_thresholds pt ON sm.metric_type = pt.metric_type
WHERE sm.recorded_at > NOW() - INTERVAL '1 hour'
  AND (sm.value >= pt.warning_threshold OR sm.value >= pt.critical_threshold)
ORDER BY sm.recorded_at DESC;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to record a system metric
CREATE OR REPLACE FUNCTION record_system_metric(
  p_metric_type TEXT,
  p_value NUMERIC,
  p_unit TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO system_metrics (
    metric_type,
    value,
    unit,
    metadata
  ) VALUES (
    p_metric_type,
    p_value,
    p_unit,
    p_metadata
  ) RETURNING id INTO v_metric_id;
  
  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update service status
CREATE OR REPLACE FUNCTION update_service_status(
  p_service_name TEXT,
  p_status TEXT,
  p_response_time NUMERIC DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_status_id UUID;
BEGIN
  INSERT INTO service_status (
    service_name,
    status,
    response_time,
    last_check_at,
    error_message,
    metadata
  ) VALUES (
    p_service_name,
    p_status,
    p_response_time,
    NOW(),
    p_error_message,
    p_metadata
  )
  ON CONFLICT (service_name) 
  DO UPDATE SET
    status = EXCLUDED.status,
    response_time = EXCLUDED.response_time,
    last_check_at = EXCLUDED.last_check_at,
    error_message = EXCLUDED.error_message,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO v_status_id;
  
  RETURN v_status_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if metric violates thresholds
CREATE OR REPLACE FUNCTION check_metric_threshold(
  p_metric_type TEXT,
  p_value NUMERIC
) RETURNS TEXT AS $$
DECLARE
  v_warning NUMERIC;
  v_critical NUMERIC;
BEGIN
  SELECT warning_threshold, critical_threshold
  INTO v_warning, v_critical
  FROM performance_thresholds
  WHERE metric_type = p_metric_type;
  
  IF NOT FOUND THEN
    RETURN 'unknown';
  END IF;
  
  IF p_value >= v_critical THEN
    RETURN 'critical';
  ELSIF p_value >= v_warning THEN
    RETURN 'warning';
  ELSE
    RETURN 'normal';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at on service_status
CREATE OR REPLACE FUNCTION update_service_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_status_updated_at
  BEFORE UPDATE ON service_status
  FOR EACH ROW
  EXECUTE FUNCTION update_service_status_timestamp();

-- Auto-update updated_at on performance_thresholds
CREATE OR REPLACE FUNCTION update_threshold_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER performance_thresholds_updated_at
  BEFORE UPDATE ON performance_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION update_threshold_timestamp();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_thresholds ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all metrics
CREATE POLICY system_metrics_select ON system_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
    )
  );

-- Allow admins to insert metrics
CREATE POLICY system_metrics_insert ON system_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
    )
  );

-- Allow admins to view service status
CREATE POLICY service_status_select ON service_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
    )
  );

-- Allow admins to update service status
CREATE POLICY service_status_all ON service_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
    )
  );

-- Allow admins to view thresholds
CREATE POLICY performance_thresholds_select ON performance_thresholds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
    )
  );

-- Only super admins can modify thresholds
CREATE POLICY performance_thresholds_modify ON performance_thresholds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
        AND ar.name = 'super_admin'
    )
  );

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE system_metrics IS 'Time-series data for system performance metrics';
COMMENT ON TABLE service_status IS 'Current health status of all services';
COMMENT ON TABLE performance_thresholds IS 'Warning and critical thresholds for metrics';
COMMENT ON FUNCTION record_system_metric IS 'Record a new system metric data point';
COMMENT ON FUNCTION update_service_status IS 'Update or insert service health status';
COMMENT ON FUNCTION check_metric_threshold IS 'Check if metric value violates thresholds';
