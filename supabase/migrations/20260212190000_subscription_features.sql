-- Subscription Features & Tier Enforcement Migration
-- Extends subscription system with feature flags and tier enforcement

-- Create subscription_features table
CREATE TABLE IF NOT EXISTS subscription_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'business', 'agency')),
    feature_key TEXT NOT NULL,
    feature_name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tier, feature_key)
);

-- Add tier to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'subscription_tier') THEN
        ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free' 
            CHECK (subscription_tier IN ('free', 'pro', 'business', 'agency'));
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_features_tier ON subscription_features(tier);
CREATE INDEX IF NOT EXISTS idx_subscription_features_key ON subscription_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(subscription_tier);

-- Enable RLS
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

-- RLS: Everyone can view features
CREATE POLICY "Everyone can view subscription features"
    ON subscription_features
    FOR SELECT
    USING (true);

-- RLS: Only admins can manage features
CREATE POLICY "Admins can manage subscription features"
    ON subscription_features
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_subscription_features_updated_at
    BEFORE UPDATE ON subscription_features
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert feature definitions for each tier
INSERT INTO subscription_features (tier, feature_key, feature_name, description) VALUES
    -- Free tier
    ('free', 'basic_projects', 'Basic Projects', 'Create up to 3 projects'),
    ('free', 'basic_tasks', 'Task Management', 'Basic task tracking'),
    ('free', 'basic_chat', 'Team Chat', 'Basic team communication'),
    
    -- Pro tier (includes all free features)
    ('pro', 'unlimited_projects', 'Unlimited Projects', 'Create unlimited projects'),
    ('pro', 'basic_ai', 'AI Assistant', 'Basic AI-powered insights'),
    ('pro', 'sync', 'Cloud Sync', 'Real-time cloud synchronization'),
    ('pro', 'advanced_tasks', 'Advanced Tasks', 'Dependencies, subtasks, custom fields'),
    ('pro', 'file_uploads', 'File Uploads', 'Upload files up to 100MB'),
    ('pro', 'export_data', 'Data Export', 'Export to PDF, Excel, CSV'),
    
    -- Business tier (includes all pro features)
    ('business', 'team_members', 'Team Members', 'Up to 50 team members'),
    ('business', 'advanced_ai', 'Advanced AI', 'Predictions, recommendations, patterns'),
    ('business', 'custom_workflows', 'Custom Workflows', 'Build custom automation workflows'),
    ('business', 'advanced_analytics', 'Advanced Analytics', 'Detailed reports and dashboards'),
    ('business', 'integrations', 'Integrations', 'Connect with third-party tools'),
    ('business', 'priority_support', 'Priority Support', '24/7 priority customer support'),
    ('business', 'sso', 'SSO Authentication', 'Single sign-on support'),
    
    -- Agency tier (includes all business features)
    ('agency', 'unlimited_teams', 'Unlimited Teams', 'No limit on team size'),
    ('agency', 'white_label', 'White Label', 'Custom branding and domain'),
    ('agency', 'api_access', 'API Access', 'Full REST API access'),
    ('agency', 'advanced_security', 'Advanced Security', 'SOC2, HIPAA compliance'),
    ('agency', 'dedicated_support', 'Dedicated Support', 'Dedicated account manager'),
    ('agency', 'custom_integrations', 'Custom Integrations', 'Build custom integrations'),
    ('agency', 'audit_logs', 'Audit Logs', 'Complete audit trail')
ON CONFLICT (tier, feature_key) DO NOTHING;

-- Create view for user features (combines tier hierarchy)
CREATE OR REPLACE VIEW user_features AS
SELECT 
    p.id as user_id,
    p.subscription_tier,
    sf.feature_key,
    sf.feature_name,
    sf.description,
    sf.is_enabled
FROM profiles p
CROSS JOIN subscription_features sf
WHERE 
    (p.subscription_tier = 'free' AND sf.tier = 'free')
    OR (p.subscription_tier = 'pro' AND sf.tier IN ('free', 'pro'))
    OR (p.subscription_tier = 'business' AND sf.tier IN ('free', 'pro', 'business'))
    OR (p.subscription_tier = 'agency' AND sf.tier IN ('free', 'pro', 'business', 'agency'))
    AND sf.is_enabled = true;

-- Function to check if user has feature access
CREATE OR REPLACE FUNCTION user_has_feature(user_id UUID, feature TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_features
        WHERE user_features.user_id = $1
        AND user_features.feature_key = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON TABLE subscription_features IS 'Defines features available for each subscription tier';
COMMENT ON VIEW user_features IS 'Hierarchical view of features available to each user based on their tier';
COMMENT ON FUNCTION user_has_feature IS 'Check if a user has access to a specific feature';
