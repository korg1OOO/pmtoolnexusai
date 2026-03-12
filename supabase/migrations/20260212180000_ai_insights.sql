-- Phase 11: AI Insights Migration
-- Creates ai_insights table for AI-powered predictions and recommendations

-- Drop existing table if exists
DROP TABLE IF EXISTS ai_insights CASCADE;

-- Create ai_insights table
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('prediction', 'recommendation', 'warning', 'pattern')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    trend TEXT CHECK (trend IN ('up', 'down', 'neutral')),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_insights_project_id ON ai_insights(project_id);
CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_category ON ai_insights(category);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX idx_ai_insights_dismissed ON ai_insights(is_dismissed);

-- Enable RLS
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view insights for their projects
CREATE POLICY "Users can view insights for their projects"
    ON ai_insights
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = ai_insights.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- Users can dismiss insights for their projects
CREATE POLICY "Users can dismiss their insights"
    ON ai_insights
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = ai_insights.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- System can create insights
CREATE POLICY "System can create insights"
    ON ai_insights
    FOR INSERT
    WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_ai_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample insights for testing
INSERT INTO ai_insights (project_id, category, title, description, confidence, trend) 
SELECT 
    p.id,
    'prediction',
    'Sprint Completion Forecast',
    'Based on current velocity, Sprint 12 is likely to complete 2 days ahead of schedule.',
    0.85,
    'up'
FROM projects p
LIMIT 1;

INSERT INTO ai_insights (project_id, category, title, description, confidence) 
SELECT 
    p.id,
    'recommendation',
    'Resource Reallocation',
    'Consider reallocating resources from Phase 3 to Phase 4 to mitigate testing risks.',
    0.78
FROM projects p
LIMIT 1;

INSERT INTO ai_insights (project_id, category, title, description, confidence, trend) 
SELECT 
    p.id,
    'warning',
    'Integration Bottleneck',
    'Integration testing bottleneck predicted in Week 3 - recommend starting early.',
    0.82,
    'down'
FROM projects p
LIMIT 1;

INSERT INTO ai_insights (project_id, category, title, description, confidence) 
SELECT 
    p.id,
    'pattern',
    'Historical Trend',
    'Similar projects have experienced 15-20% scope creep at this stage. Monitor change requests closely.',
    0.75
FROM projects p
LIMIT 1;

-- Add helpful comment
COMMENT ON TABLE ai_insights IS 'AI-powered predictions, recommendations, warnings, and pattern insights';
