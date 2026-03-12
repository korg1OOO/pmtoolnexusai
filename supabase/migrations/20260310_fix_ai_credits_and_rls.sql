-- ================================================================
-- AI Credits Migration — Run this in Supabase SQL Editor
-- Fixes: 406 (Not Acceptable) on ai_credits table
--        409 (Conflict) on initialize_ai_credits RPC
-- ================================================================

-- 1. AI CREDITS TABLE
CREATE TABLE IF NOT EXISTS public.ai_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_credits NUMERIC DEFAULT 10 NOT NULL,
    used_credits NUMERIC DEFAULT 0 NOT NULL,
    low_balance_threshold NUMERIC DEFAULT 5 NOT NULL,
    auto_recharge_enabled BOOLEAN DEFAULT false NOT NULL,
    auto_recharge_amount NUMERIC DEFAULT 100 NOT NULL,
    auto_recharge_threshold NUMERIC DEFAULT 10 NOT NULL,
    last_recharged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(tenant_id, user_id)
);

-- Add computed column for available_credits
-- Note: If your Postgres version doesn't support GENERATED ALWAYS AS STORED,
-- we use a view or just compute in the app
ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
    ON public.ai_credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
    ON public.ai_credits FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on ai_credits"
    ON public.ai_credits FOR ALL
    USING (auth.role() = 'service_role');

-- 2. AI CREDIT PRICING TABLE
CREATE TABLE IF NOT EXISTS public.ai_credit_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_name TEXT NOT NULL,
    credits NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    discount_percentage NUMERIC DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    display_order INT DEFAULT 0 NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_credit_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing"
    ON public.ai_credit_pricing FOR SELECT
    USING (true);

-- 3. AI CREDIT PURCHASES TABLE
CREATE TABLE IF NOT EXISTS public.ai_credit_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_purchased NUMERIC NOT NULL,
    amount_paid NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    payment_method TEXT DEFAULT 'stripe',
    payment_id TEXT,
    payment_status TEXT DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    purchased_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    applied_at TIMESTAMPTZ
);

ALTER TABLE public.ai_credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
    ON public.ai_credit_purchases FOR SELECT
    USING (auth.uid() = user_id);

-- 4. AI CREDIT ADJUSTMENTS TABLE (for admin adjustments)
CREATE TABLE IF NOT EXISTS public.ai_credit_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    reason TEXT,
    adjusted_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_credit_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages adjustments"
    ON public.ai_credit_adjustments FOR ALL
    USING (auth.role() = 'service_role');

-- 5. INITIALIZE AI CREDITS RPC
CREATE OR REPLACE FUNCTION public.initialize_ai_credits(
    p_tenant_id UUID,
    p_user_id UUID,
    p_initial_credits NUMERIC DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.ai_credits (tenant_id, user_id, total_credits, used_credits)
    VALUES (p_tenant_id, p_user_id, p_initial_credits, 0)
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
END;
$$;

-- 6. ADD AI CREDITS RPC
CREATE OR REPLACE FUNCTION public.add_ai_credits(
    p_tenant_id UUID,
    p_user_id UUID,
    p_credits NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_total NUMERIC;
BEGIN
    UPDATE public.ai_credits
    SET total_credits = total_credits + p_credits,
        updated_at = now()
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id
    RETURNING total_credits INTO new_total;

    IF NOT FOUND THEN
        INSERT INTO public.ai_credits (tenant_id, user_id, total_credits, used_credits)
        VALUES (p_tenant_id, p_user_id, p_credits, 0)
        RETURNING total_credits INTO new_total;
    END IF;

    RETURN new_total;
END;
$$;

-- 7. SEED DEFAULT PRICING TIERS
INSERT INTO public.ai_credit_pricing (tier_name, credits, price, currency, discount_percentage, is_active, is_featured, display_order, description)
VALUES
    ('Starter', 100, 4.99, 'USD', 0, true, false, 1, '100 AI credits for light usage'),
    ('Growth', 500, 19.99, 'USD', 20, true, true, 2, '500 AI credits — best value'),
    ('Enterprise', 2000, 59.99, 'USD', 40, true, false, 3, '2000 AI credits for heavy usage')
ON CONFLICT DO NOTHING;

-- ================================================================
-- FIX: meeting_attendees RLS infinite recursion
-- The existing policy likely references meetings which references
-- meeting_attendees again, causing infinite recursion.
-- ================================================================

-- Drop the recursive policy and replace with a simple one
DO $$
BEGIN
    -- Try to drop existing policies that may cause recursion
    BEGIN
        DROP POLICY IF EXISTS "Users can view meeting attendees" ON public.meeting_attendees;
    EXCEPTION WHEN undefined_table THEN
        -- Table doesn't exist, skip
        NULL;
    END;
END $$;

-- Create a simple non-recursive policy
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_attendees' AND table_schema = 'public') THEN
        EXECUTE 'CREATE POLICY "Users can view meeting attendees" ON public.meeting_attendees FOR SELECT USING (auth.uid() = user_id OR auth.role() = ''service_role'')';
    END IF;
EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists with this name, skip
    NULL;
END $$;

-- ================================================================
-- FIX: projects table RLS
-- Enable RLS with a permissive policy so project members can access
-- ================================================================

-- Note: Only run this if you want to enable RLS on projects.
-- Currently RLS is OFF which means any authenticated user can see all projects.
-- Uncomment below to enable RLS:

-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view projects they are members of"
--     ON public.projects FOR SELECT
--     USING (
--         auth.uid() IN (
--             SELECT user_id FROM public.project_members WHERE project_id = id
--         )
--         OR auth.role() = 'service_role'
--     );
