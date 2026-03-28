-- ============================================
-- ML Learning Loop - Minimal Foundation
-- ============================================

-- ML Predictions Table
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID,
    user_id UUID,
    prediction_type TEXT NOT NULL,
    input_data JSONB NOT NULL,
    prediction JSONB NOT NULL,
    confidence DECIMAL(5,4),
    user_accepted BOOLEAN,
    user_modified BOOLEAN,
    actual_outcome JSONB,
    user_rating INTEGER,
    feedback_notes TEXT,
    was_correct BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Patterns Table
CREATE TABLE IF NOT EXISTS ml_learning_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type TEXT NOT NULL,
    prediction_type TEXT NOT NULL,
    context JSONB NOT NULL,
    adjustment JSONB NOT NULL,
    success_rate DECIMAL(5,4),
    sample_size INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS ml_user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID,
    preference_type TEXT NOT NULL,
    learned_preferences JSONB NOT NULL,
    confidence DECIMAL(5,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple indexes
CREATE INDEX IF NOT EXISTS idx_ml_pred_type ON ml_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ml_pattern_type ON ml_learning_patterns(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ml_pref_user ON ml_user_preferences(user_id);

-- Enable RLS
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_user_preferences ENABLE ROW LEVEL SECURITY;

-- Simple policies
CREATE POLICY "ml_pred_policy" ON ml_predictions FOR ALL TO authenticated USING (true);
CREATE POLICY "ml_pattern_policy" ON ml_learning_patterns FOR ALL TO authenticated USING (true);
CREATE POLICY "ml_pref_policy" ON ml_user_preferences FOR ALL TO authenticated USING (true);

-- Verification
SELECT 'ML Tables Created!' as status, COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN ('ml_predictions', 'ml_learning_patterns', 'ml_user_preferences');
