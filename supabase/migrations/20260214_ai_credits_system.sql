-- =====================================================
-- AI CREDITS SYSTEM - DATABASE MIGRATION
-- Phase 1: Foundation
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE 1: AI Credits Balance
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Balance
    total_credits DECIMAL(12, 2) NOT NULL DEFAULT 0,
    used_credits DECIMAL(12, 2) NOT NULL DEFAULT 0,
    available_credits DECIMAL(12, 2) GENERATED ALWAYS AS (total_credits - used_credits) STORED,
    
    -- Limits & Alerts
    low_balance_threshold DECIMAL(12, 2) DEFAULT 100,
    auto_recharge_enabled BOOLEAN DEFAULT false,
    auto_recharge_amount DECIMAL(12, 2) DEFAULT 500,
    auto_recharge_threshold DECIMAL(12, 2) DEFAULT 50,
    
    -- Metadata
    last_recharged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_user UNIQUE(tenant_id, user_id),
    CONSTRAINT positive_total_credits CHECK (total_credits >= 0),
    CONSTRAINT positive_used_credits CHECK (used_credits >= 0)
);

-- Indexes for ai_credits
CREATE INDEX IF NOT EXISTS idx_ai_credits_tenant ON ai_credits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_credits_user ON ai_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_credits_balance ON ai_credits(available_credits);
CREATE INDEX IF NOT EXISTS idx_ai_credits_auto_recharge ON ai_credits(auto_recharge_enabled) WHERE auto_recharge_enabled = true;

-- =====================================================
-- TABLE 2: AI Usage Logs
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Request Details
    feature_type VARCHAR(50) NOT NULL,
    request_id UUID,
    model_name VARCHAR(100),
    
    -- Token Usage
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
    
    -- Credit Deduction
    credits_used DECIMAL(10, 4) NOT NULL,
    credits_before DECIMAL(12, 2) NOT NULL,
    credits_after DECIMAL(12, 2) NOT NULL,
    
    -- Metadata
    request_duration_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_tokens CHECK (prompt_tokens >= 0 AND completion_tokens >= 0),
    CONSTRAINT positive_credits_used CHECK (credits_used >= 0)
);

-- Indexes for ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant ON ai_usage_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_logs(feature_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_success ON ai_usage_logs(success);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant_created ON ai_usage_logs(tenant_id, created_at DESC);

-- =====================================================
-- TABLE 3: Credit Purchase History
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_credit_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Purchase Details
    credits_purchased DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment
    payment_method VARCHAR(50),
    payment_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending',
    
    -- Metadata
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    applied_at TIMESTAMPTZ,
    
    CONSTRAINT positive_credits_purchased CHECK (credits_purchased > 0),
    CONSTRAINT positive_amount_paid CHECK (amount_paid > 0),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Indexes for ai_credit_purchases
CREATE INDEX IF NOT EXISTS idx_credit_purchases_tenant ON ai_credit_purchases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON ai_credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON ai_credit_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_payment_id ON ai_credit_purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_purchased ON ai_credit_purchases(purchased_at DESC);

-- =====================================================
-- TABLE 4: Credit Pricing Tiers
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_credit_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Tier Details
    tier_name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Discount
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_credits CHECK (credits > 0),
    CONSTRAINT positive_price CHECK (price > 0),
    CONSTRAINT valid_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

-- Index for ai_credit_pricing
CREATE INDEX IF NOT EXISTS idx_credit_pricing_active ON ai_credit_pricing(is_active, display_order);

-- Insert default pricing tiers
INSERT INTO ai_credit_pricing (tier_name, credits, price, discount_percentage, display_order, is_featured, description) VALUES
    ('Starter', 100, 10.00, 0, 1, false, 'Perfect for trying out AI features'),
    ('Professional', 500, 45.00, 10, 2, true, 'Most popular for regular users'),
    ('Business', 1000, 80.00, 20, 3, false, 'Great for teams and power users'),
    ('Enterprise', 5000, 350.00, 30, 4, false, 'Best value for organizations')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCTION: Atomic Credit Deduction
-- =====================================================

CREATE OR REPLACE FUNCTION deduct_ai_credits(
    p_tenant_id UUID,
    p_user_id UUID,
    p_feature_type VARCHAR,
    p_request_id UUID,
    p_model_name VARCHAR,
    p_prompt_tokens INTEGER,
    p_completion_tokens INTEGER,
    p_credits_used DECIMAL
) RETURNS TABLE (
    usage_id UUID,
    credits_before DECIMAL,
    credits_after DECIMAL
) AS $$
DECLARE
    v_credits_before DECIMAL;
    v_credits_after DECIMAL;
    v_usage_id UUID;
BEGIN
    -- Lock the row for update to prevent race conditions
    SELECT available_credits INTO v_credits_before
    FROM ai_credits
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id
    FOR UPDATE;
    
    -- Check if record exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'AI credits account not found for tenant % and user %', p_tenant_id, p_user_id;
    END IF;
    
    -- Check sufficient balance
    IF v_credits_before < p_credits_used THEN
        RAISE EXCEPTION 'Insufficient credits: % available, % required', 
            v_credits_before, p_credits_used;
    END IF;
    
    -- Deduct credits
    UPDATE ai_credits
    SET used_credits = used_credits + p_credits_used,
        updated_at = NOW()
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id;
    
    -- Get new balance
    SELECT available_credits INTO v_credits_after
    FROM ai_credits
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id;
    
    -- Log usage
    INSERT INTO ai_usage_logs (
        tenant_id, user_id, feature_type, request_id, model_name,
        prompt_tokens, completion_tokens, credits_used,
        credits_before, credits_after, success
    ) VALUES (
        p_tenant_id, p_user_id, p_feature_type, p_request_id, p_model_name,
        p_prompt_tokens, p_completion_tokens, p_credits_used,
        v_credits_before, v_credits_after, true
    ) RETURNING id INTO v_usage_id;
    
    RETURN QUERY SELECT v_usage_id, v_credits_before, v_credits_after;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Add Credits
-- =====================================================

CREATE OR REPLACE FUNCTION add_ai_credits(
    p_tenant_id UUID,
    p_user_id UUID,
    p_credits DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_new_balance DECIMAL;
BEGIN
    -- Add credits
    UPDATE ai_credits
    SET total_credits = total_credits + p_credits,
        last_recharged_at = NOW(),
        updated_at = NOW()
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id;
    
    -- Get new balance
    SELECT available_credits INTO v_new_balance
    FROM ai_credits
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id;
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Initialize Credits for New User
-- =====================================================

CREATE OR REPLACE FUNCTION initialize_ai_credits(
    p_tenant_id UUID,
    p_user_id UUID,
    p_initial_credits DECIMAL DEFAULT 10
) RETURNS UUID AS $$
DECLARE
    v_credit_id UUID;
BEGIN
    INSERT INTO ai_credits (
        tenant_id, user_id, total_credits, used_credits
    ) VALUES (
        p_tenant_id, p_user_id, p_initial_credits, 0
    )
    ON CONFLICT (tenant_id, user_id) DO NOTHING
    RETURNING id INTO v_credit_id;
    
    RETURN v_credit_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_pricing ENABLE ROW LEVEL SECURITY;

-- ai_credits policies
CREATE POLICY ai_credits_select ON ai_credits
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenants
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY ai_credits_update ON ai_credits
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenants
            WHERE user_id = auth.uid()
        )
    );

-- ai_usage_logs policies
CREATE POLICY ai_usage_logs_select ON ai_usage_logs
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenants
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY ai_usage_logs_insert ON ai_usage_logs
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM user_tenants
            WHERE user_id = auth.uid()
        )
    );

-- ai_credit_purchases policies
CREATE POLICY ai_credit_purchases_select ON ai_credit_purchases
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenants
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY ai_credit_purchases_insert ON ai_credit_purchases
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM user_tenants
            WHERE user_id = auth.uid()
        )
    );

-- ai_credit_pricing policies (public read)
CREATE POLICY ai_credit_pricing_select ON ai_credit_pricing
    FOR SELECT USING (is_active = true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_ai_credits_updated_at
    BEFORE UPDATE ON ai_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_credit_pricing_updated_at
    BEFORE UPDATE ON ai_credit_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE ai_credits IS 'Stores AI credit balances for tenants and users';
COMMENT ON TABLE ai_usage_logs IS 'Logs all AI API usage with token counts and credit deductions';
COMMENT ON TABLE ai_credit_purchases IS 'Tracks credit purchase history and payment status';
COMMENT ON TABLE ai_credit_pricing IS 'Defines pricing tiers for credit purchases';

COMMENT ON FUNCTION deduct_ai_credits IS 'Atomically deducts credits and logs usage';
COMMENT ON FUNCTION add_ai_credits IS 'Adds credits to user balance';
COMMENT ON FUNCTION initialize_ai_credits IS 'Initializes credit account for new users';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables created
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name IN ('ai_credits', 'ai_usage_logs', 'ai_credit_purchases', 'ai_credit_pricing')) = 4,
           'Not all tables were created';
    
    RAISE NOTICE 'AI Credits migration completed successfully!';
END $$;
