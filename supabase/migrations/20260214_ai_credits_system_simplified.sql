-- =====================================================
-- AI CREDITS SYSTEM - SIMPLIFIED MIGRATION
-- Removes tenant_id dependency for initial deployment
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE 1: AI Credits Balance (Simplified)
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
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
    
    CONSTRAINT unique_user UNIQUE(user_id),
    CONSTRAINT positive_total_credits CHECK (total_credits >= 0),
    CONSTRAINT positive_used_credits CHECK (used_credits >= 0)
);

-- Indexes for ai_credits
CREATE INDEX IF NOT EXISTS idx_ai_credits_user ON ai_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_credits_balance ON ai_credits(available_credits);
CREATE INDEX IF NOT EXISTS idx_ai_credits_auto_recharge ON ai_credits(auto_recharge_enabled) WHERE auto_recharge_enabled = true;

-- =====================================================
-- TABLE 2: AI Usage Logs
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Usage Details
    feature_type TEXT NOT NULL,
    credits_used DECIMAL(12, 2) NOT NULL,
    
    -- Request Details
    model_used TEXT,
    tokens_used INTEGER,
    request_metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_credits_used CHECK (credits_used >= 0)
);

-- Indexes for ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_logs(feature_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_logs(created_at DESC);

-- =====================================================
-- TABLE 3: AI Credit Purchases
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_credit_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Purchase Details
    credits_purchased DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    
    -- Payment Details
    payment_id TEXT UNIQUE,
    payment_method TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    
    -- Metadata
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_credits_purchased CHECK (credits_purchased > 0),
    CONSTRAINT positive_amount_paid CHECK (amount_paid > 0)
);

-- Indexes for ai_credit_purchases
CREATE INDEX IF NOT EXISTS idx_ai_purchases_user ON ai_credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_purchases_status ON ai_credit_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_ai_purchases_date ON ai_credit_purchases(purchased_at DESC);

-- =====================================================
-- TABLE 4: AI Credit Pricing
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_credit_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_name TEXT NOT NULL UNIQUE,
    credits DECIMAL(12, 2) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    is_popular BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_credits CHECK (credits > 0),
    CONSTRAINT positive_price CHECK (price > 0)
);

-- Index for ai_credit_pricing
CREATE INDEX IF NOT EXISTS idx_ai_pricing_order ON ai_credit_pricing(display_order);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function 1: Deduct Credits
CREATE OR REPLACE FUNCTION deduct_ai_credits(
    p_user_id UUID,
    p_credits DECIMAL(12, 2),
    p_feature_type TEXT,
    p_model_used TEXT DEFAULT NULL,
    p_tokens_used INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_available_credits DECIMAL(12, 2);
    v_new_used_credits DECIMAL(12, 2);
BEGIN
    -- Get current available credits
    SELECT available_credits INTO v_available_credits
    FROM ai_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Check if user has credits record
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'no_credits_record',
            'message', 'User has no credits record'
        );
    END IF;
    
    -- Check if sufficient credits
    IF v_available_credits < p_credits THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'insufficient_credits',
            'message', 'Insufficient credits',
            'available', v_available_credits,
            'required', p_credits
        );
    END IF;
    
    -- Deduct credits
    UPDATE ai_credits
    SET used_credits = used_credits + p_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING used_credits INTO v_new_used_credits;
    
    -- Log usage
    INSERT INTO ai_usage_logs (
        user_id,
        feature_type,
        credits_used,
        model_used,
        tokens_used,
        request_metadata
    ) VALUES (
        p_user_id,
        p_feature_type,
        p_credits,
        p_model_used,
        p_tokens_used,
        p_metadata
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'credits_deducted', p_credits,
        'new_balance', v_available_credits - p_credits
    );
END;
$$;

-- Function 2: Add Credits
CREATE OR REPLACE FUNCTION add_ai_credits(
    p_user_id UUID,
    p_credits DECIMAL(12, 2)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_total DECIMAL(12, 2);
BEGIN
    -- Add credits
    UPDATE ai_credits
    SET total_credits = total_credits + p_credits,
        last_recharged_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING total_credits INTO v_new_total;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO ai_credits (user_id, total_credits, last_recharged_at)
        VALUES (p_user_id, p_credits, NOW())
        RETURNING total_credits INTO v_new_total;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'credits_added', p_credits,
        'new_total', v_new_total
    );
END;
$$;

-- Function 3: Initialize Credits for New User
CREATE OR REPLACE FUNCTION initialize_ai_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO ai_credits (user_id, total_credits)
    VALUES (NEW.id, 10)  -- 10 free credits for new users
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Trigger: Initialize credits on user signup
DROP TRIGGER IF EXISTS trigger_initialize_ai_credits ON auth.users;
CREATE TRIGGER trigger_initialize_ai_credits
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_ai_credits();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_credits
CREATE POLICY "Users can view own credits"
    ON ai_credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
    ON ai_credits FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for ai_usage_logs
CREATE POLICY "Users can view own usage logs"
    ON ai_usage_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage logs"
    ON ai_usage_logs FOR INSERT
    WITH CHECK (true);

-- RLS Policies for ai_credit_purchases
CREATE POLICY "Users can view own purchases"
    ON ai_credit_purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert purchases"
    ON ai_credit_purchases FOR INSERT
    WITH CHECK (true);

-- RLS Policies for ai_credit_pricing
CREATE POLICY "Anyone can view pricing"
    ON ai_credit_pricing FOR SELECT
    USING (true);

-- =====================================================
-- SEED DATA: Default Pricing Tiers
-- =====================================================

INSERT INTO ai_credit_pricing (tier_name, credits, price, discount_percentage, is_popular, display_order)
VALUES
    ('Starter', 100, 9.99, 0, false, 1),
    ('Professional', 500, 39.99, 20, true, 2),
    ('Business', 1500, 99.99, 33, false, 3),
    ('Enterprise', 5000, 299.99, 40, false, 4)
ON CONFLICT (tier_name) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
