import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * get-pricing-cache
 * Returns cached pricing data for the public pricing page.
 * Falls back to fresh DB read if cache is missing or older than 1 hour.
 * This endpoint is anonymous — no auth required.
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!
        );

        // Try cache first
        const { data: cached } = await supabase
            .from('pricing_cache')
            .select('data, updated_at')
            .eq('id', 'public')
            .single();

        const cacheAge = cached?.updated_at
            ? Date.now() - new Date(cached.updated_at).getTime()
            : Infinity;

        if (cached && cacheAge < CACHE_TTL_MS) {
            return new Response(JSON.stringify(cached.data), {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    'X-Cache': 'HIT',
                    'X-Cache-Age': Math.round(cacheAge / 1000).toString(),
                },
                status: 200,
            });
        }

        // Cache miss — read directly from DB (service role for cache write, anon for read)
        const { data: plans } = await supabase
            .from('plan_configs')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        const { data: features } = await supabase
            .from('subscription_features')
            .select('tier, feature_key, feature_name, description, is_enabled')
            .eq('is_enabled', true)
            .order('tier')
            .order('feature_name');

        const featuresByTier: Record<string, any[]> = {};
        (features ?? []).forEach((f: any) => {
            if (!featuresByTier[f.tier]) featuresByTier[f.tier] = [];
            featuresByTier[f.tier].push({ key: f.feature_key, name: f.feature_name, description: f.description });
        });

        const payload = {
            plans: plans ?? [],
            features: featuresByTier,
            cached_at: new Date().toISOString(),
        };

        return new Response(JSON.stringify(payload), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'X-Cache': 'MISS',
            },
            status: 200,
        });
    } catch (err: any) {
        return new Response(
            JSON.stringify({ error: err.message ?? 'Unknown error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
