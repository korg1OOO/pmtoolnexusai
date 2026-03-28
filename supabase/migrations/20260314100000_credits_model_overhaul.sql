-- AI Credits Model Overhaul
-- $1 = 1,000 credits = $0.25 real LLM+compute cost
-- 1,000 free credits/month for all users

-- 1. Add monthly grant timestamp column
ALTER TABLE ai_credits
ADD COLUMN IF NOT EXISTS monthly_credits_granted_at TIMESTAMPTZ;

-- 2. Update initialize_ai_credits RPC to default to 1,000 credits
DROP FUNCTION IF EXISTS public.initialize_ai_credits(UUID, UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.initialize_ai_credits(UUID, UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.initialize_ai_credits(
    p_tenant_id UUID,
    p_user_id UUID,
    p_initial_credits NUMERIC DEFAULT 1000
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.ai_credits (tenant_id, user_id, total_credits, used_credits, monthly_credits_granted_at)
    VALUES (p_tenant_id, p_user_id, p_initial_credits, 0, now())
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
END;
$$;

-- 3. Replace pricing tiers with new model: $1 = 1,000 credits
DELETE FROM public.ai_credit_pricing;

INSERT INTO public.ai_credit_pricing (tier_name, credits, price, currency, discount_percentage, is_active, is_featured, display_order, description)
VALUES
    ('Starter',    5000,   5,    'USD', 0,  true, false, 1, '5,000 AI credits — great for light usage'),
    ('Growth',     25000,  20,   'USD', 20, true, true,  2, '25,000 AI credits — 20% discount, most popular'),
    ('Enterprise', 100000, 75,   'USD', 25, true, false, 3, '100,000 AI credits — 25% bulk discount')
ON CONFLICT DO NOTHING;

-- 4. Grant existing users 1,000 initial free credits (set monthly_credits_granted_at)
UPDATE public.ai_credits
SET monthly_credits_granted_at = now(),
    total_credits = GREATEST(total_credits, 1000)
WHERE monthly_credits_granted_at IS NULL;
