-- Advanced Subscription Features Migration
-- Usage tracking, dunning, analytics, and proration support

-- Usage records table for metered billing
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    metric_key TEXT NOT NULL, -- e.g., 'api_calls', 'storage_gb', 'users'
    quantity INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dunning attempts table for failed payment recovery
CREATE TABLE IF NOT EXISTS dunning_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT,
    attempt_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'recovered')),
    email_sent_at TIMESTAMPTZ,
    grace_period_ends TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription analytics view
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT
    COUNT(DISTINCT s.id) as total_subscriptions,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_subscriptions,
    COUNT(DISTINCT CASE WHEN s.status = 'cancelled' THEN s.id END) as cancelled_subscriptions,
    SUM(CASE WHEN s.status = 'active' THEN s.mrr ELSE 0 END) as total_mrr,
    SUM(CASE WHEN s.status = 'active' THEN s.mrr * 12 ELSE 0 END) as total_arr,
    AVG(CASE WHEN s.status = 'active' THEN s.mrr END) as avg_mrr,
    COUNT(DISTINCT CASE WHEN s.created_at >= (NOW() - INTERVAL '30 days') AND s.status = 'active' THEN s.id END) as new_subscriptions_30d,
    COUNT(DISTINCT CASE WHEN s.cancelled_at >= (NOW() - INTERVAL '30 days') THEN s.id END) as churned_30d
FROM subscriptions s;

-- Tier-specific analytics view
CREATE OR REPLACE VIEW tier_analytics AS
SELECT
    s.tier,
    COUNT(DISTINCT s.id) as total_count,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_count,
    SUM(CASE WHEN s.status = 'active' THEN s.mrr ELSE 0 END) as tier_mrr,
    AVG(CASE WHEN s.status = 'active' THEN s.mrr END) as avg_mrr,
    ROUND(
        COUNT(DISTINCT CASE WHEN s.cancelled_at >= (NOW() - INTERVAL '30 days') THEN s.id END)::NUMERIC /
        NULLIF(COUNT(DISTINCT CASE WHEN s.status = 'active' OR s.cancelled_at >= (NOW() - INTERVAL '30 days') THEN s.id END), 0) * 100,
        2
    ) as churn_rate_30d
FROM subscriptions s
GROUP BY s.tier;

-- Proration credits table
CREATE TABLE IF NOT EXISTS proration_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- in cents (can be negative)
    reason TEXT NOT NULL, -- 'upgrade', 'downgrade', 'cycle_change'
    from_tier TEXT,
    to_tier TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    stripe_credit_note_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_records_subscription ON usage_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_metric ON usage_records(metric_key);
CREATE INDEX IF NOT EXISTS idx_usage_records_timestamp ON usage_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_dunning_attempts_subscription ON dunning_attempts(subscription_id);
CREATE INDEX IF NOT EXISTS idx_dunning_attempts_status ON dunning_attempts(status);
CREATE INDEX IF NOT EXISTS idx_proration_credits_subscription ON proration_credits(subscription_id);

-- Enable RLS
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE dunning_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proration_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage"
    ON usage_records FOR SELECT
    USING (subscription_id IN (SELECT id FROM subscriptions WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all usage"
    ON usage_records FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can view dunning attempts"
    ON dunning_attempts FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users can view their own proration credits"
    ON proration_credits FOR SELECT
    USING (subscription_id IN (SELECT id FROM subscriptions WHERE user_id = auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_dunning_attempts_updated_at
    BEFORE UPDATE ON dunning_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE usage_records IS 'Tracks usage metrics for metered billing';
COMMENT ON TABLE dunning_attempts IS 'Tracks failed payment recovery attempts';
COMMENT ON VIEW subscription_analytics IS 'Aggregate metrics for subscription performance';
COMMENT ON VIEW tier_analytics IS 'Per-tier subscription metrics and churn rates';
COMMENT ON TABLE proration_credits IS 'Tracks proration credits for tier changes';
