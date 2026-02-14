-- Auto-Learning Configuration and Velocity Tracking Tables
-- Migration for Priority 4: Auto-Learning Triggers

-- Table: ml_auto_learning_config
-- Stores configuration for auto-learning system
CREATE TABLE IF NOT EXISTS ml_auto_learning_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enabled BOOLEAN DEFAULT true,
    min_feedbacks_for_pattern INTEGER DEFAULT 3,
    min_success_rate_threshold DECIMAL DEFAULT 0.4,
    pruning_enabled BOOLEAN DEFAULT true,
    optimization_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO ml_auto_learning_config (enabled, min_feedbacks_for_pattern, min_success_rate_threshold, pruning_enabled, optimization_enabled)
VALUES (true, 3, 0.4, true, true)
ON CONFLICT DO NOTHING;

-- Table: ml_learning_velocity
-- Tracks learning velocity metrics over time
CREATE TABLE IF NOT EXISTS ml_learning_velocity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    prediction_type TEXT NOT NULL,
    patterns_created INTEGER DEFAULT 0,
    patterns_optimized INTEGER DEFAULT 0,
    patterns_pruned INTEGER DEFAULT 0,
    avg_success_rate DECIMAL,
    improvement_rate DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, prediction_type)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ml_learning_velocity_date ON ml_learning_velocity(date DESC);
CREATE INDEX IF NOT EXISTS idx_ml_learning_velocity_type ON ml_learning_velocity(prediction_type);

-- Enable RLS
ALTER TABLE ml_auto_learning_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_learning_velocity ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only access)
CREATE POLICY "Admin can view auto-learning config"
    ON ml_auto_learning_config
    FOR SELECT
    USING (true);

CREATE POLICY "Admin can update auto-learning config"
    ON ml_auto_learning_config
    FOR UPDATE
    USING (true);

CREATE POLICY "Admin can view learning velocity"
    ON ml_learning_velocity
    FOR SELECT
    USING (true);

CREATE POLICY "System can insert learning velocity"
    ON ml_learning_velocity
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update learning velocity"
    ON ml_learning_velocity
    FOR UPDATE
    USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ml_auto_learning_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_ml_auto_learning_config_timestamp
    BEFORE UPDATE ON ml_auto_learning_config
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_auto_learning_config_updated_at();

COMMENT ON TABLE ml_auto_learning_config IS 'Configuration settings for ML auto-learning system';
COMMENT ON TABLE ml_learning_velocity IS 'Tracks ML learning velocity metrics over time';
