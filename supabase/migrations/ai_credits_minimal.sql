-- AI CREDITS SYSTEM - MINIMAL MIGRATION
-- Run this in Supabase SQL Editor
-- Execute ALL statements at once

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: AI Credits Balance
CREATE TABLE IF NOT EXISTS ai_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    total_credits DECIMAL(12, 2) NOT NULL DEFAULT 0,
    used_credits DECIMAL(12, 2) NOT NULL DEFAULT 0,
    available_credits DECIMAL(12, 2) GENERATED ALWAYS AS (total_credits - used_credits) STORED,
    low_balance_threshold DECIMAL(12, 2) DEFAULT 100,
    auto_recharge_enabled BOOLEAN DEFAULT false,
    auto_recharge_amount DECIMAL(12, 2) DEFAULT 500,
    auto_recharge_threshold DECIMAL(12, 2) DEFAULT 50,
    last_recharged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: AI Usage Logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL,
    credits_used DECIMAL(12, 2) NOT NULL,
    model_used TEXT,
    tokens_used INTEGER,
    request_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: AI Credit Purchases
CREATE TABLE IF NOT EXISTS ai_credit_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_purchased DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_id TEXT UNIQUE,
    payment_method TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: AI Credit Pricing
CREATE TABLE IF NOT EXISTS ai_credit_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_name TEXT NOT NULL UNIQUE,
    credits DECIMAL(12, 2) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    is_popular BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_credits_user ON ai_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_purchases_user ON ai_credit_purchases(user_id);

-- Function: Deduct Credits
CREATE OR REPLACE FUNCTION deduct_ai_credits(
    p_user_id UUID,
    p_credits DECIMAL,
    p_feature_type TEXT,
    p_model_used TEXT DEFAULT NULL,
    p_tokens_used INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_available DECIMAL;
BEGIN
    SELECT available_credits INTO v_available FROM ai_credits WHERE user_id = p_user_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'no_credits_record');
    END IF;
    
    IF v_available < p_credits THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_credits', 'available', v_available);
    END IF;
    
    UPDATE ai_credits SET used_credits = used_credits + p_credits WHERE user_id = p_user_id;
    
    INSERT INTO ai_usage_logs (user_id, feature_type, credits_used, model_used, tokens_used)
    VALUES (p_user_id, p_feature_type, p_credits, p_model_used, p_tokens_used);
    
    RETURN jsonb_build_object('success', true, 'new_balance', v_available - p_credits);
END;
$$;

-- Function: Add Credits
CREATE OR REPLACE FUNCTION add_ai_credits(p_user_id UUID, p_credits DECIMAL)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO ai_credits (user_id, total_credits, last_recharged_at)
    VALUES (p_user_id, p_credits, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        total_credits = ai_credits.total_credits + p_credits,
        last_recharged_at = NOW();
    
    RETURN jsonb_build_object('success', true, 'credits_added', p_credits);
END;
$$;

-- Function: Initialize Credits for New Users
CREATE OR REPLACE FUNCTION initialize_ai_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO ai_credits (user_id, total_credits) VALUES (NEW.id, 10)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS trigger_initialize_ai_credits ON auth.users;
CREATE TRIGGER trigger_initialize_ai_credits
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION initialize_ai_credits();

-- Enable RLS
ALTER TABLE ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own credits" ON ai_credits;
CREATE POLICY "Users can view own credits" ON ai_credits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own usage" ON ai_usage_logs;
CREATE POLICY "Users can view own usage" ON ai_usage_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert usage" ON ai_usage_logs;
CREATE POLICY "Service can insert usage" ON ai_usage_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own purchases" ON ai_credit_purchases;
CREATE POLICY "Users can view own purchases" ON ai_credit_purchases FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert purchases" ON ai_credit_purchases;
CREATE POLICY "Service can insert purchases" ON ai_credit_purchases FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view pricing" ON ai_credit_pricing;
CREATE POLICY "Anyone can view pricing" ON ai_credit_pricing FOR SELECT USING (true);

-- Seed Pricing Data
INSERT INTO ai_credit_pricing (tier_name, credits, price, discount_percentage, is_popular, display_order)
VALUES
    ('Starter', 100, 9.99, 0, false, 1),
    ('Professional', 500, 39.99, 20, true, 2),
    ('Business', 1500, 99.99, 33, false, 3),
    ('Enterprise', 5000, 299.99, 40, false, 4)
ON CONFLICT (tier_name) DO NOTHING;
