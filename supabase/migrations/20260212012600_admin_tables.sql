-- Admin Panel Database Schema
-- Tables for subscriptions, discount codes, and license keys

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Subscription Details
    tier TEXT NOT NULL CHECK (tier IN ('pro', 'business', 'agency')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'paused', 'trialing')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual', 'lifetime')),
    
    -- Pricing
    mrr NUMERIC(10,2) NOT NULL DEFAULT 0, -- Monthly Recurring Revenue
    currency TEXT NOT NULL DEFAULT 'USD',
    
    -- Stripe Integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    
    -- Billing Periods
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Usage Tracking
    usage_limit_articles INT,
    usage_current_articles INT DEFAULT 0,
    usage_reset_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index to ensure one active subscription per user
CREATE UNIQUE INDEX idx_subscriptions_unique_active 
    ON subscriptions(user_id) 
    WHERE status = 'active';

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- =============================================
-- DISCOUNT CODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Code Details
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Discount Type & Value
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    
    -- Constraints
    min_purchase_amount NUMERIC(10,2),
    max_discount_amount NUMERIC(10,2),
    
    -- Applicability
    applicable_tiers TEXT[] DEFAULT ARRAY['pro', 'business', 'agency'],
    applicable_billing_cycles TEXT[] DEFAULT ARRAY['monthly', 'annual', 'lifetime'],
    
    -- Usage Limits
    max_uses INT, -- NULL = unlimited
    max_uses_per_user INT DEFAULT 1,
    used_count INT DEFAULT 0,
    
    -- Time Constraints
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Creator
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Validation
    CONSTRAINT check_discount_value CHECK (
        (discount_type = 'percentage' AND discount_value <= 100) OR
        (discount_type = 'fixed_amount')
    )
);

-- Indexes for discount codes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_valid_until ON discount_codes(valid_until);

-- =============================================
-- DISCOUNT CODE USAGE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS discount_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- Usage Details
    discount_amount NUMERIC(10,2) NOT NULL,
    original_amount NUMERIC(10,2) NOT NULL,
    final_amount NUMERIC(10,2) NOT NULL,
    
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate usage
    CONSTRAINT unique_user_discount UNIQUE (discount_code_id, user_id, subscription_id)
);

-- Indexes for discount usage
CREATE INDEX IF NOT EXISTS idx_discount_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_user ON discount_code_usage(user_id);

-- =============================================
-- LICENSE KEYS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS license_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- License Key
    key TEXT NOT NULL UNIQUE,
    key_prefix TEXT, -- First 8 characters for display
    
    -- License Type
    license_type TEXT NOT NULL CHECK (license_type IN ('trial', 'pro', 'business', 'agency', 'enterprise', 'lifetime')),
    
    -- Assignment
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_email TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_redeemed BOOLEAN DEFAULT false,
    
    -- Activation
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Usage Limits
    max_activations INT DEFAULT 1,
    activation_count INT DEFAULT 0,
    
    -- Device/Machine Tracking
    device_fingerprints JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Creator & Source
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    source TEXT, -- 'manual', 'bulk_generation', 'promotion', 'partnership'
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Validation
    CONSTRAINT check_activation_count CHECK (activation_count <= max_activations)
);

-- Indexes for license keys
CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(key);
CREATE INDEX IF NOT EXISTS idx_license_keys_user ON license_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_type ON license_keys(license_type);
CREATE INDEX IF NOT EXISTS idx_license_keys_active ON license_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_license_keys_redeemed ON license_keys(is_redeemed);
CREATE INDEX IF NOT EXISTS idx_license_keys_expires ON license_keys(expires_at);

-- =============================================
-- LICENSE KEY ACTIVATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS license_key_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key_id UUID NOT NULL REFERENCES license_keys(id) ON DELETE CASCADE,
    
    -- Activation Details
    device_fingerprint TEXT,
    device_name TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMPTZ,
    deactivation_reason TEXT,
    
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for activations
CREATE INDEX IF NOT EXISTS idx_license_activations_key ON license_key_activations(license_key_id);
CREATE INDEX IF NOT EXISTS idx_license_activations_fingerprint ON license_key_activations(device_fingerprint);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp for subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- Auto-update updated_at timestamp for discount_codes
CREATE OR REPLACE FUNCTION update_discount_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_discount_codes_updated_at
    BEFORE UPDATE ON discount_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_discount_codes_updated_at();

-- Auto-update updated_at timestamp for license_keys
CREATE OR REPLACE FUNCTION update_license_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_license_keys_updated_at
    BEFORE UPDATE ON license_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_license_keys_updated_at();

-- Auto-increment discount code usage counter
CREATE OR REPLACE FUNCTION increment_discount_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE discount_codes
    SET used_count = used_count + 1
    WHERE id = NEW.discount_code_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_discount_usage
    AFTER INSERT ON discount_code_usage
    FOR EACH ROW
    EXECUTE FUNCTION increment_discount_usage_count();

-- Auto-increment license key activation counter
CREATE OR REPLACE FUNCTION increment_license_activation_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE license_keys
    SET activation_count = activation_count + 1,
        is_redeemed = true,
        activated_at = COALESCE(activated_at, NOW())
    WHERE id = NEW.license_key_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_license_activation
    AFTER INSERT ON license_key_activations
    FOR EACH ROW
    EXECUTE FUNCTION increment_license_activation_count();

-- =============================================
-- RLS POLICIES (Disabled for admin tables)
-- =============================================

-- Disable RLS for admin management
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE license_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE license_key_activations DISABLE ROW LEVEL SECURITY;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE subscriptions IS 'Stores user subscription information for Pro/Business/Agency tiers';
COMMENT ON TABLE discount_codes IS 'Promotional discount codes for subscription purchases';
COMMENT ON TABLE discount_code_usage IS 'Tracks redemptions of discount codes';
COMMENT ON TABLE license_keys IS 'License keys for software activation and access control';
COMMENT ON TABLE license_key_activations IS 'Tracks individual activations of license keys';
