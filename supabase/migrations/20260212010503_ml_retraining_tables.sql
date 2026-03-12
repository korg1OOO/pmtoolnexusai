-- Migration: ML Automated Retraining Infrastructure
-- Description: Creates tables for retraining jobs, accuracy logs, and alerts
-- Date: 2026-02-12

-- ============================================================================
-- Table 1: ml_retraining_jobs
-- Purpose: Track model retraining job execution and results
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_retraining_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type TEXT NOT NULL CHECK (model_type IN ('risk', 'cost', 'schedule')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    training_samples_count INT,
    new_model_id UUID REFERENCES ml_model_metadata(id),
    accuracy_before NUMERIC(5,4),
    accuracy_after NUMERIC(5,4),
    improvement_percent NUMERIC(6,2),
    error_message TEXT,
    training_config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID
);

-- Indexes for ml_retraining_jobs
CREATE INDEX IF NOT EXISTS idx_retraining_jobs_model_type ON ml_retraining_jobs(model_type);
CREATE INDEX IF NOT EXISTS idx_retraining_jobs_status ON ml_retraining_jobs(status);
CREATE INDEX IF NOT EXISTS idx_retraining_jobs_created_at ON ml_retraining_jobs(created_at DESC);

-- Comments for ml_retraining_jobs
COMMENT ON TABLE ml_retraining_jobs IS 'Tracks ML model retraining job execution and performance metrics';
COMMENT ON COLUMN ml_retraining_jobs.model_type IS 'Type of model being retrained (risk, cost, schedule)';
COMMENT ON COLUMN ml_retraining_jobs.status IS 'Current status of the retraining job';
COMMENT ON COLUMN ml_retraining_jobs.training_samples_count IS 'Number of samples used for training';
COMMENT ON COLUMN ml_retraining_jobs.improvement_percent IS 'Percentage improvement over previous model version';

-- ============================================================================
-- Table 2: ml_accuracy_logs
-- Purpose: Log actual vs predicted outcomes for accuracy tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_accuracy_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID REFERENCES ml_predictions(id) ON DELETE CASCADE,
    model_id UUID REFERENCES ml_model_metadata(id),
    model_type TEXT NOT NULL CHECK (model_type IN ('risk', 'cost', 'schedule')),
    predicted_value JSONB NOT NULL,
    actual_value JSONB NOT NULL,
    accuracy_score NUMERIC(5,4),
    deviation_percent NUMERIC(6,2),
    is_within_threshold BOOLEAN,
    notes TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    logged_by UUID
);

-- Indexes for ml_accuracy_logs
CREATE INDEX IF NOT EXISTS idx_accuracy_logs_prediction_id ON ml_accuracy_logs(prediction_id);
CREATE INDEX IF NOT EXISTS idx_accuracy_logs_model_id ON ml_accuracy_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_accuracy_logs_model_type ON ml_accuracy_logs(model_type);
CREATE INDEX IF NOT EXISTS idx_accuracy_logs_logged_at ON ml_accuracy_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_accuracy_logs_within_threshold ON ml_accuracy_logs(is_within_threshold);

-- Comments for ml_accuracy_logs
COMMENT ON TABLE ml_accuracy_logs IS 'Logs actual outcomes vs ML predictions for accuracy tracking';
COMMENT ON COLUMN ml_accuracy_logs.accuracy_score IS 'Calculated accuracy score (0-1 scale)';
COMMENT ON COLUMN ml_accuracy_logs.deviation_percent IS 'Percentage deviation from predicted value';
COMMENT ON COLUMN ml_accuracy_logs.is_within_threshold IS 'Whether prediction was within acceptable threshold';

-- ============================================================================
-- Table 3: ml_alerts
-- Purpose: Store ML system alerts for accuracy drops, drift, and retraining needs
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type TEXT NOT NULL CHECK (model_type IN ('risk', 'cost', 'schedule')),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('accuracy_drop', 'drift_detected', 'retrain_needed', 'data_quality', 'retraining_complete', 'model_activated')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ml_alerts
CREATE INDEX IF NOT EXISTS idx_alerts_model_type ON ml_alerts(model_type);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON ml_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON ml_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON ml_alerts(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON ml_alerts(created_at DESC);

-- Comments for ml_alerts
COMMENT ON TABLE ml_alerts IS 'System alerts for ML model performance, drift, and retraining status';
COMMENT ON COLUMN ml_alerts.alert_type IS 'Type of alert (accuracy_drop, drift_detected, retrain_needed, etc.)';
COMMENT ON COLUMN ml_alerts.severity IS 'Alert severity level (critical, warning, info)';
COMMENT ON COLUMN ml_alerts.metadata IS 'Additional context as JSON (metrics, thresholds, etc.)';

-- ============================================================================
-- Row Level Security (RLS) - Disabled for consistency with existing ML tables
-- ============================================================================

ALTER TABLE ml_retraining_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ml_accuracy_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ml_alerts DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to automatically create alert when model accuracy drops
CREATE OR REPLACE FUNCTION create_accuracy_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.accuracy_score < 0.70 THEN
        INSERT INTO ml_alerts (model_type, alert_type, severity, title, message, metadata)
        VALUES (
            NEW.model_type,
            'accuracy_drop',
            'critical',
            'Critical Accuracy Drop Detected',
            format('Model accuracy dropped to %s%% (threshold: 70%%)', ROUND(NEW.accuracy_score * 100, 1)),
            jsonb_build_object(
                'model_id', NEW.model_id,
                'accuracy_score', NEW.accuracy_score,
                'prediction_id', NEW.prediction_id
            )
        );
    ELSIF NEW.accuracy_score < 0.80 THEN
        INSERT INTO ml_alerts (model_type, alert_type, severity, title, message, metadata)
        VALUES (
            NEW.model_type,
            'accuracy_drop',
            'warning',
            'Model Accuracy Warning',
            format('Model accuracy at %s%% (threshold: 80%%)', ROUND(NEW.accuracy_score * 100, 1)),
            jsonb_build_object(
                'model_id', NEW.model_id,
                'accuracy_score', NEW.accuracy_score,
                'prediction_id', NEW.prediction_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create alerts on accuracy logs
CREATE TRIGGER trigger_accuracy_alert
AFTER INSERT ON ml_accuracy_logs
FOR EACH ROW
EXECUTE FUNCTION create_accuracy_alert();

-- Function to create alert when retraining job completes
CREATE OR REPLACE FUNCTION create_retraining_completion_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO ml_alerts (model_type, alert_type, severity, title, message, metadata)
        VALUES (
            NEW.model_type,
            'retraining_complete',
            'info',
            'Model Retraining Complete',
            format('New %s model trained with %s improvement. Model ID: %s', 
                   NEW.model_type, 
                   ROUND(NEW.improvement_percent, 1) || '%',
                   NEW.new_model_id),
            jsonb_build_object(
                'job_id', NEW.id,
                'new_model_id', NEW.new_model_id,
                'accuracy_before', NEW.accuracy_before,
                'accuracy_after', NEW.accuracy_after,
                'improvement_percent', NEW.improvement_percent
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for retraining completion alerts
CREATE TRIGGER trigger_retraining_completion_alert
AFTER UPDATE ON ml_retraining_jobs
FOR EACH ROW
EXECUTE FUNCTION create_retraining_completion_alert();
