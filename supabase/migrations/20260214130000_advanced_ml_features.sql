-- A/B Testing and Versioning Tables
-- Migration for Priority 5: Advanced ML Features

-- ============================================
-- A/B TESTING TABLES
-- ============================================

-- Table: ml_ab_tests
-- Stores A/B test configurations
CREATE TABLE IF NOT EXISTS ml_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    pattern_a_id UUID REFERENCES ml_learning_patterns(id),
    pattern_b_id UUID REFERENCES ml_learning_patterns(id),
    pattern_c_id UUID REFERENCES ml_learning_patterns(id),
    pattern_d_id UUID REFERENCES ml_learning_patterns(id),
    traffic_split JSONB DEFAULT '{"a": 50, "b": 50}'::jsonb,
    status TEXT DEFAULT 'running', -- running, paused, completed
    winner_pattern_id UUID REFERENCES ml_learning_patterns(id),
    confidence_level DECIMAL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: ml_ab_test_results
-- Stores individual A/B test results
CREATE TABLE IF NOT EXISTS ml_ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ab_test_id UUID REFERENCES ml_ab_tests(id) ON DELETE CASCADE,
    pattern_id UUID REFERENCES ml_learning_patterns(id),
    prediction_id UUID REFERENCES ml_predictions(id),
    variant TEXT NOT NULL, -- 'a', 'b', 'c', 'd'
    was_successful BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for A/B testing
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ml_ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ml_ab_test_results(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant ON ml_ab_test_results(ab_test_id, variant);

-- ============================================
-- VERSIONING TABLES
-- ============================================

-- Table: ml_pattern_versions
-- Stores pattern version snapshots
CREATE TABLE IF NOT EXISTS ml_pattern_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_id UUID REFERENCES ml_learning_patterns(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_tag TEXT, -- 'v1.0', 'v2.0', etc.
    pattern_snapshot JSONB NOT NULL,
    change_description TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pattern_id, version_number)
);

-- Table: ml_pattern_changelog
-- Stores pattern change history
CREATE TABLE IF NOT EXISTS ml_pattern_changelog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_id UUID REFERENCES ml_learning_patterns(id) ON DELETE CASCADE,
    version_from INTEGER,
    version_to INTEGER,
    change_type TEXT NOT NULL, -- 'created', 'optimized', 'manual_edit', 'rollback'
    changes JSONB,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for versioning
CREATE INDEX IF NOT EXISTS idx_pattern_versions_pattern_id ON ml_pattern_versions(pattern_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_changelog_pattern_id ON ml_pattern_changelog(pattern_id, created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE ml_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_pattern_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_pattern_changelog ENABLE ROW LEVEL SECURITY;

-- A/B Tests policies
CREATE POLICY "Anyone can view A/B tests"
    ON ml_ab_tests FOR SELECT USING (true);

CREATE POLICY "System can insert A/B tests"
    ON ml_ab_tests FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update A/B tests"
    ON ml_ab_tests FOR UPDATE USING (true);

-- A/B Test Results policies
CREATE POLICY "Anyone can view test results"
    ON ml_ab_test_results FOR SELECT USING (true);

CREATE POLICY "System can insert test results"
    ON ml_ab_test_results FOR INSERT WITH CHECK (true);

-- Pattern Versions policies
CREATE POLICY "Anyone can view pattern versions"
    ON ml_pattern_versions FOR SELECT USING (true);

CREATE POLICY "System can insert pattern versions"
    ON ml_pattern_versions FOR INSERT WITH CHECK (true);

-- Pattern Changelog policies
CREATE POLICY "Anyone can view changelog"
    ON ml_pattern_changelog FOR SELECT USING (true);

CREATE POLICY "System can insert changelog"
    ON ml_pattern_changelog FOR INSERT WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get next version number
CREATE OR REPLACE FUNCTION get_next_version_number(p_pattern_id UUID)
RETURNS INTEGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM ml_pattern_versions
    WHERE pattern_id = p_pattern_id;
    
    RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE ml_ab_tests IS 'A/B tests for ML patterns';
COMMENT ON TABLE ml_ab_test_results IS 'Individual results from A/B tests';
COMMENT ON TABLE ml_pattern_versions IS 'Version snapshots of ML patterns';
COMMENT ON TABLE ml_pattern_changelog IS 'Change history for ML patterns';
