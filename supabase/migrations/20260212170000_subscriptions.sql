-- Phase 10: Subscriptions Migration
-- Creates subscriptions table for subscriber management

-- Drop existing table if exists
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Create subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    tier TEXT NOT NULL CHECK (tier IN ('pro', 'business', 'agency', 'free')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'paused', 'trial')),
    mrr DECIMAL(10,2) DEFAULT 0.00,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    usage_stats JSONB DEFAULT '{
        "articles_per_month": 0,
        "projects_count": 0,
        "team_members": 0,
        "storage_gb": 0
    }'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_email ON subscriptions(email);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_joined_at ON subscriptions(joined_at DESC);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
    ON subscriptions
    FOR SELECT
    USING (user_id = auth.uid());

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
    ON subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
    ON subscriptions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO subscriptions (email, full_name, tier, status, mrr, joined_at, usage_stats) VALUES
    ('john@example.com', 'John Doe', 'pro', 'active', 10.00, NOW() - INTERVAL '30 days', '{"articles_per_month": 12, "projects_count": 3}'::jsonb),
    ('sarah@company.com', 'Sarah Smith', 'business', 'active', 39.00, NOW() - INTERVAL '15 days', '{"articles_per_month": 35, "projects_count": 8}'::jsonb),
    ('mike@agency.com', 'Mike Agency', 'agency', 'active', 99.00, NOW() - INTERVAL '45 days', '{"articles_per_month": 95, "projects_count": 20}'::jsonb),
    ('emma@example.com', 'Emma Wilson', 'pro', 'cancelled', 0.00, NOW() - INTERVAL '60 days', '{"articles_per_month": 0, "projects_count": 0}'::jsonb)
ON CONFLICT DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE subscriptions IS 'Manages user subscriptions, tiers, and billing information';
