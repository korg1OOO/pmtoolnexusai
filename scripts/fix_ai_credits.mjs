/**
 * Create ai_credits table and RPC functions in Supabase
 * Fixes: 406 (Not Acceptable) on ai_credits table
 *        409 (Conflict) on initialize_ai_credits RPC
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqypmwcsxawpltsnqbwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxeXBtd2NzeGF3cGx0c25xYnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUxMzYyNCwiZXhwIjoyMDg3MDg5NjI0fQ.1I6fOGJWGajVDlOjXFHSqw4dJcQ14hBIZgXYWCVcVbg';

const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' }
});

const MIGRATION_SQL = `
-- ===== AI CREDITS TABLE =====
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

ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_credits' AND policyname = 'Users can view own credits') THEN
        CREATE POLICY "Users can view own credits" ON public.ai_credits FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_credits' AND policyname = 'Users can update own credits') THEN
        CREATE POLICY "Users can update own credits" ON public.ai_credits FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- ===== AI CREDIT PRICING TABLE =====
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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_credit_pricing' AND policyname = 'Anyone can view active pricing') THEN
        CREATE POLICY "Anyone can view active pricing" ON public.ai_credit_pricing FOR SELECT USING (true);
    END IF;
END $$;

-- ===== AI CREDIT PURCHASES TABLE =====
CREATE TABLE IF NOT EXISTS public.ai_credit_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_purchased NUMERIC NOT NULL,
    amount_paid NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    payment_method TEXT DEFAULT 'stripe',
    payment_id TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    purchased_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    applied_at TIMESTAMPTZ
);

ALTER TABLE public.ai_credit_purchases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_credit_purchases' AND policyname = 'Users can view own purchases') THEN
        CREATE POLICY "Users can view own purchases" ON public.ai_credit_purchases FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- ===== INITIALIZE AI CREDITS RPC =====
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

-- ===== ADD AI CREDITS RPC =====
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

-- ===== SEED DEFAULT PRICING TIERS =====
INSERT INTO public.ai_credit_pricing (tier_name, credits, price, currency, discount_percentage, is_active, is_featured, display_order, description)
VALUES
    ('Starter', 100, 4.99, 'USD', 0, true, false, 1, '100 AI credits for light usage'),
    ('Growth', 500, 19.99, 'USD', 20, true, true, 2, '500 AI credits — best value'),
    ('Enterprise', 2000, 59.99, 'USD', 40, true, false, 3, '2000 AI credits for heavy usage')
ON CONFLICT DO NOTHING;
`;

async function run() {
    console.log('=== AI Credits Migration ===\n');

    // We need to use the SQL editor API or pg_query to run DDL
    // Try using supabase.rpc with a generic SQL executor if available
    try {
        // Attempt via the Management API SQL endpoint
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ sql: MIGRATION_SQL })
        });

        if (response.ok) {
            console.log('✅ Migration applied via exec_sql RPC!');
        } else {
            const errText = await response.text();
            console.log(`exec_sql failed (${response.status}): ${errText}`);
            console.log('\nTrying alternative approach: individual table checks...\n');

            // Check each table/function individually
            await checkTable('ai_credits');
            await checkTable('ai_credit_pricing');
            await checkTable('ai_credit_purchases');
            await checkRpc('initialize_ai_credits');
            await checkRpc('add_ai_credits');
        }
    } catch (err) {
        console.error('Migration error:', err.message);
    }

    // Now try to create via the Supabase SQL API (dashboard API)
    console.log('\n--- Attempting migration via Supabase SQL API ---');
    try {
        const sqlResponse = await fetch(`${supabaseUrl}/pg/query`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: MIGRATION_SQL })
        });

        if (sqlResponse.ok) {
            const result = await sqlResponse.json();
            console.log('✅ Migration applied via pg/query!');
            console.log('Result:', JSON.stringify(result).substring(0, 200));
        } else {
            const errText = await sqlResponse.text();
            console.log(`pg/query failed (${sqlResponse.status}): ${errText.substring(0, 200)}`);
        }
    } catch (err) {
        console.error('SQL API error:', err.message);
    }

    // Verify
    console.log('\n--- Verification ---');
    const checks = ['ai_credits', 'ai_credit_pricing', 'ai_credit_purchases'];
    for (const table of checks) {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`❌ ${table}: ${error.message} (${error.code})`);
        } else {
            console.log(`✅ ${table}: accessible (${data?.length || 0} rows)`);
        }
    }
}

async function checkTable(name) {
    const { data, error } = await supabase.from(name).select('id').limit(1);
    if (error) {
        console.log(`  ❌ ${name}: ${error.message} (${error.code})`);
    } else {
        console.log(`  ✅ ${name}: exists (${data?.length || 0} rows)`);
    }
}

async function checkRpc(name) {
    const { error } = await supabase.rpc(name, {
        p_tenant_id: '00000000-0000-0000-0000-000000000000',
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_initial_credits: 0,
        p_credits: 0
    });
    if (error) {
        console.log(`  ❌ ${name}: ${error.message} (${error.code})`);
    } else {
        console.log(`  ✅ ${name}: exists`);
    }
}

run().catch(console.error);
