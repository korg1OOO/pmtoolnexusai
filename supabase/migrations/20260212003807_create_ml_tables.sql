-- Advanced ML Analytics Module - Database Schema
-- Creates tables for ML predictions, model metadata, and training data

-- ============================================
-- ML Predictions Table
-- ============================================
-- Stores risk, cost, and schedule predictions with confidence scores
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('risk', 'cost', 'schedule')),
    prediction_data JSONB NOT NULL,
    confidence_score NUMERIC(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_by UUID,
    CONSTRAINT unique_active_prediction UNIQUE (project_id, prediction_type, created_at)
);

-- Indexes for fast lookups
CREATE INDEX idx_ml_predictions_project_type ON ml_predictions(project_id, prediction_type);
CREATE INDEX idx_ml_predictions_created_at ON ml_predictions(created_at DESC);
CREATE INDEX idx_ml_predictions_expires_at ON ml_predictions(expires_at);

-- ============================================
-- ML Model Metadata Table
-- ============================================
-- Tracks model versions, accuracy metrics, and training history
CREATE TABLE IF NOT EXISTS ml_model_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type TEXT NOT NULL CHECK (model_type IN ('risk', 'cost', 'schedule')),
    model_version TEXT NOT NULL,
    algorithm TEXT NOT NULL, -- e.g., 'random_forest', 'gradient_boosting', 'lstm'
    accuracy_metrics JSONB, -- e.g., {"precision": 0.85, "recall": 0.82, "f1": 0.83}
    training_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    training_data_size INTEGER,
    hyperparameters JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    CONSTRAINT unique_model_version UNIQUE (model_type, model_version)
);

CREATE INDEX idx_ml_model_metadata_type_active ON ml_model_metadata(model_type, is_active);
CREATE INDEX idx_ml_model_metadata_training_date ON ml_model_metadata(training_date DESC);

-- ============================================
-- ML Training Data Table
-- ============================================
-- Historical snapshots for model retraining
CREATE TABLE IF NOT EXISTS ml_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Financial metrics
    budget NUMERIC(15,2),
    actual_spent NUMERIC(15,2),
    cost_variance NUMERIC(15,2),
    
    -- Schedule metrics
    planned_duration_days INTEGER,
    actual_duration_days INTEGER,
    schedule_variance_days INTEGER,
    
    -- Risk metrics
    risk_count INTEGER DEFAULT 0,
    high_risk_count INTEGER DEFAULT 0,
    
    -- Task metrics
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    delayed_tasks INTEGER DEFAULT 0,
    
    -- Resource metrics
    resource_count INTEGER DEFAULT 0,
    resource_utilization NUMERIC(5,2), -- percentage
    
    -- Project metadata
    project_status TEXT,
    project_health TEXT,
    methodology TEXT,
    
    -- Additional context
    external_factors JSONB, -- e.g., market conditions, team changes
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ml_training_data_project ON ml_training_data(project_id);
CREATE INDEX idx_ml_training_data_snapshot_date ON ml_training_data(snapshot_date DESC);
CREATE INDEX idx_ml_training_data_project_status ON ml_training_data(project_status);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- Disable RLS for now to match existing pattern (most tables have RLS disabled)
ALTER TABLE ml_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_data DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE ml_predictions IS 'Stores ML-generated predictions for risk, cost, and schedule with confidence scores and expiration';
COMMENT ON TABLE ml_model_metadata IS 'Tracks ML model versions, accuracy metrics, and training history';
COMMENT ON TABLE ml_training_data IS 'Historical project data snapshots used for ML model training and retraining';

COMMENT ON COLUMN ml_predictions.prediction_type IS 'Type of prediction: risk, cost, or schedule';
COMMENT ON COLUMN ml_predictions.prediction_data IS 'JSON containing the full prediction output';
COMMENT ON COLUMN ml_predictions.confidence_score IS 'Model confidence score between 0 and 1';
COMMENT ON COLUMN ml_predictions.expires_at IS 'Prediction expiration time for cache invalidation (default 24 hours)';

COMMENT ON COLUMN ml_model_metadata.algorithm IS 'ML algorithm used: random_forest, gradient_boosting, lstm, etc.';
COMMENT ON COLUMN ml_model_metadata.accuracy_metrics IS 'JSON with precision, recall, f1, mae, rmse, etc.';
COMMENT ON COLUMN ml_model_metadata.is_active IS 'Whether this model version is currently in use';

COMMENT ON COLUMN ml_training_data.cost_variance IS 'Actual spent minus budget';
COMMENT ON COLUMN ml_training_data.schedule_variance_days IS 'Actual duration minus planned duration';
COMMENT ON COLUMN ml_training_data.external_factors IS 'JSON with market conditions, team changes, etc. that may affect predictions';
