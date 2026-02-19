-- ==========================================================
-- Migration: plan_configs + pricing_cache + subscriptions cols
-- ==========================================================

-- 1. plan_configs: single source of truth for tier pricing & limits
CREATE TABLE IF NOT EXISTS plan_configs (
    tier                TEXT PRIMARY KEY,           -- 'free'|'pro'|'business'|'agency'
    display_name        TEXT        NOT NULL,
    description         TEXT,
    price_monthly       NUMERIC     NOT NULL DEFAULT 0,
    price_annual        NUMERIC     NOT NULL DEFAULT 0,
    max_projects        INT         NOT NULL DEFAULT 3,   -- -1 = unlimited
    max_members         INT         NOT NULL DEFAULT 1,   -- -1 = unlimited
    max_storage_mb      INT         NOT NULL DEFAULT 100, -- -1 = unlimited
    max_ai_credits      INT         NOT NULL DEFAULT 0,   -- -1 = unlimited
    max_file_size_mb    INT         NOT NULL DEFAULT 10,
    is_popular          BOOLEAN     NOT NULL DEFAULT false,
    is_active           BOOLEAN     NOT NULL DEFAULT true,
    stripe_price_monthly_id TEXT,
    stripe_price_annual_id  TEXT,
    sort_order          INT         NOT NULL DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by          UUID REFERENCES auth.users(id)
);

-- Seed default plans (idempotent)
INSERT INTO plan_configs (tier, display_name, description, price_monthly, price_annual,
    max_projects, max_members, max_storage_mb, max_ai_credits, max_file_size_mb, is_popular, sort_order)
VALUES
    ('free',     'Free',     'Get started with the basics',                 0,   0,    3,  1,   100,    0,   10,  false, 0),
    ('pro',      'Pro',      'Perfect for individuals and small teams',     10,  100, -1, 10, 10000,  500,  100,  false, 1),
    ('business', 'Business', 'Advanced features for growing teams',         39,  390, -1, 50, 100000, 2000, 500,  true,  2),
    ('agency',   'Agency',   'Enterprise-grade for agencies and studios',   99,  990, -1, -1, 500000, -1,  1000, false, 3)
ON CONFLICT (tier) DO UPDATE SET
    display_name     = EXCLUDED.display_name,
    description      = EXCLUDED.description,
    price_monthly    = EXCLUDED.price_monthly,
    price_annual     = EXCLUDED.price_annual,
    max_projects     = EXCLUDED.max_projects,
    max_members      = EXCLUDED.max_members,
    max_storage_mb   = EXCLUDED.max_storage_mb,
    max_ai_credits   = EXCLUDED.max_ai_credits,
    max_file_size_mb = EXCLUDED.max_file_size_mb,
    is_popular       = EXCLUDED.is_popular,
    sort_order       = EXCLUDED.sort_order,
    updated_at       = now();

-- 2. pricing_cache: single-row cache for public pricing page
CREATE TABLE IF NOT EXISTS pricing_cache (
    id          TEXT PRIMARY KEY DEFAULT 'public',
    data        JSONB NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow anonymous read on pricing_cache (for public pricing page)
ALTER TABLE pricing_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "pricing_cache_public_read"
    ON pricing_cache FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "pricing_cache_service_write"
    ON pricing_cache FOR ALL USING (auth.role() = 'service_role');

-- Allow admin read on plan_configs
ALTER TABLE plan_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "plan_configs_public_read"
    ON plan_configs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "plan_configs_admin_write"
    ON plan_configs FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 3. Add Stripe columns to subscriptions if they don't exist
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
    ADD COLUMN IF NOT EXISTS renewal_date           TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS billing_cycle          TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    ADD COLUMN IF NOT EXISTS workspace_id           UUID REFERENCES projects(id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
