-- Advanced Features Schema Extensions
-- Adds support for email preferences, referrals, and enhanced tracking

-- =============================================
-- EMAIL PREFERENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Email Types
    subscription_emails BOOLEAN DEFAULT true,
    payment_emails BOOLEAN DEFAULT true,
    license_emails BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_prefs_user ON email_preferences(user_id);

-- =============================================
-- REFERRAL CODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referrer Info
    referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    
    -- Rewards
    referrer_discount_id UUID REFERENCES discount_codes(id),
    referee_discount_id UUID REFERENCES discount_codes(id),
    
    -- Tracking
    uses_count INT DEFAULT 0,
    successful_conversions INT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_user ON referral_codes(referrer_user_id);

-- =============================================
-- REFERRAL CONVERSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS referral_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
    
    -- Referee Info
    referee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Conversion Data
    subscription_id UUID REFERENCES subscriptions(id),
    conversion_value NUMERIC(10,2),
    
    converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_conv_code ON referral_conversions(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_referral_conv_user ON referral_conversions(referee_user_id);

-- =============================================
-- EXTEND DISCOUNT CODES WITH ADVANCED FEATURES
-- ==================================== =========
ALTER TABLE discount_codes 
    ADD COLUMN IF NOT EXISTS tier_restrictions TEXT[] DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS first_time_user_only BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_referral_code BOOLEAN DEFAULT false;

-- =============================================
-- EXTEND LICENSE KEYS WITH ADVANCED FEATURES
-- =============================================
ALTER TABLE license_keys
    ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS offline_validation_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS offline_token TEXT;

-- Add machine_id to activations table
ALTER TABLE license_key_activations
    ADD COLUMN IF NOT EXISTS machine_id TEXT;

CREATE INDEX IF NOT EXISTS idx_license_activation_machine ON license_key_activations(machine_id);

-- =============================================
-- ANALYTICS VIEW: MRR TRENDS
-- =============================================
CREATE OR REPLACE VIEW analytics_mrr_daily AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_subscriptions,
    SUM(mrr) as total_mrr,
    tier,
    billing_cycle
FROM subscriptions
WHERE status = 'active'
GROUP BY DATE(created_at), tier, billing_cycle
ORDER BY date DESC;

-- =============================================
-- ANALYTICS VIEW: CHURN ANALYSIS
-- =============================================
CREATE OR REPLACE VIEW analytics_churn AS
SELECT 
    DATE_TRUNC('month', cancelled_at) as month,
    COUNT(*) as churned_count,
    tier,
    AVG(EXTRACT(DAY FROM (cancelled_at - created_at))) as avg_lifetime_days
FROM subscriptions
WHERE status = 'cancelled' AND cancelled_at IS NOT NULL
GROUP BY DATE_TRUNC('month', cancelled_at), tier
ORDER BY month DESC;

-- =============================================
-- ANALYTICS VIEW: DISCOUNT PERFORMANCE
-- =============================================
CREATE OR REPLACE VIEW analytics_discount_performance AS
SELECT 
    dc.code,
    dc.discount_type,
    dc.discount_value,
    dc.used_count,
    dc.max_uses,
    COALESCE(SUM(dcu.discount_amount), 0) as total_discount_given,
    COALESCE(SUM(dcu.final_amount), 0) as total_revenue,
    COUNT(dcu.id) as redemptions
FROM discount_codes dc
LEFT JOIN discount_code_usage dcu ON dc.id = dcu.discount_code_id
GROUP BY dc.id, dc.code, dc.discount_type, dc.discount_value, dc.used_count, dc.max_uses
ORDER BY redemptions DESC;

-- =============================================
-- ANALYTICS VIEW: LICENSE KEY USAGE
-- =============================================
CREATE OR REPLACE VIEW analytics_license_usage AS
SELECT 
    license_type,
    COUNT(*) as total_keys,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_keys,
    SUM(CASE WHEN is_redeemed THEN 1 ELSE 0 END) as redeemed_keys,
    SUM(activation_count) as total_activations,
    AVG(activation_count::FLOAT) as avg_activations_per_key
FROM license_keys
GROUP BY license_type
ORDER BY total_keys DESC;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-increment referral usage
CREATE OR REPLACE FUNCTION increment_referral_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE referral_codes
    SET uses_count = uses_count + 1
    WHERE id = NEW.referral_code_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_referral_usage
    AFTER INSERT ON referral_conversions
    FOR EACH ROW
    EXECUTE FUNCTION increment_referral_usage();

-- Auto-update email preferences timestamp
CREATE OR REPLACE FUNCTION update_email_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_prefs_updated_at
    BEFORE UPDATE ON email_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_email_prefs_updated_at();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE email_preferences IS 'User email notification preferences';
COMMENT ON TABLE referral_codes IS 'Referral codes for viral growth tracking';
COMMENT ON TABLE referral_conversions IS 'Tracks successful referral conversions';
COMMENT ON VIEW analytics_mrr_daily IS 'Daily MRR trends by tier and billing cycle';
COMMENT ON VIEW analytics_churn IS 'Monthly churn analysis with lifetime metrics';
COMMENT ON VIEW analytics_discount_performance IS 'Discount code performance metrics';
COMMENT ON VIEW analytics_license_usage IS 'License key usage statistics by type';
