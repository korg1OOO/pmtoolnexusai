import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * refresh-pricing-cache
 * Reads plan_configs + subscription_features from DB and writes to pricing_cache.
 * Called by admin when they want to publish updated pricing to the public page.
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Fetch plan configs
        const { data: plans, error: plansErr } = await supabase
            .from('plan_configs')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (plansErr) throw plansErr;

        // Fetch feature flags grouped by tier
        const { data: features, error: featErr } = await supabase
            .from('subscription_features')
            .select('tier, feature_key, feature_name, description, is_enabled')
            .eq('is_enabled', true)
            .order('tier')
            .order('feature_name');

        if (featErr) throw featErr;

        // Build cache payload
        const featuresByTier: Record<string, any[]> = {};
        (features ?? []).forEach((f: any) => {
            if (!featuresByTier[f.tier]) featuresByTier[f.tier] = [];
            featuresByTier[f.tier].push({
                key: f.feature_key,
                name: f.feature_name,
                description: f.description,
            });
        });

        const cacheData = {
            plans: plans ?? [],
            features: featuresByTier,
            cached_at: new Date().toISOString(),
        };

        // Write to pricing_cache (upsert single-row)
        const { error: cacheErr } = await supabase
            .from('pricing_cache')
            .upsert({ id: 'public', data: cacheData, updated_at: new Date().toISOString() });

        if (cacheErr) throw cacheErr;

        return new Response(
            JSON.stringify({ success: true, cached_at: cacheData.cached_at }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch (err: any) {
        return new Response(
            JSON.stringify({ error: err.message ?? 'Unknown error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
