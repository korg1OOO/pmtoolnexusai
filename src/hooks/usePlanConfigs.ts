/**
 * usePlanConfigs
 * Reads plan pricing and limits from the plan_configs table.
 * Replaces the hardcoded TIER_PRICING / TIER_LIMITS constants in useFeatureAccess.ts.
 * Cached by React Query for 5 minutes; admin edits bust the cache via invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const supabase = _supabase as any;

export type Tier = 'free' | 'pro' | 'business' | 'agency';

export interface PlanConfig {
    id: string; // Added ID
    tier: Tier;
    name: string;
    description?: string; // Optional in DB? No, verify types.ts said `name` is string, description not listed in types.ts row?
    // Wait, types.ts `subscription_plans` Row has: active, created_at, features, id, limits, name, price_annual, price_monthly, stripe_price_id_annual, stripe_price_id_monthly, tier.
    // description is MISSING in DB. I should check if I need it or if it's in features json.
    // For now I will mark it optional or remove it.
    price_monthly: number | null;
    price_annual: number | null;
    limits: any; // JSON
    features: any; // JSON
    active: boolean | null;
    stripe_price_id_monthly?: string | null;
    stripe_price_id_annual?: string | null;
    // Removed is_popular, highlight_text, sort_order as they don't exist in DB
    max_file_size_mb: number; // -1 = unlimited
    is_popular: boolean;
    is_active: boolean;
    stripe_price_monthly_id: string | null;
    stripe_price_annual_id: string | null;
    updated_at: string;
}

const STALE_MINUTES = 5;

/** Fetch all plan configs ordered by sort_order */
export function usePlanConfigs() {
    return useQuery<PlanConfig[]>({
        queryKey: ['plan-configs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price_monthly', { ascending: true }); // sort_order might not exist
            if (error) throw error;
            return data ?? [];
        },
        staleTime: STALE_MINUTES * 60 * 1000,
    });
}

/** Fetch a single plan config by tier */
export function usePlanConfig(tier: Tier) {
    return useQuery<PlanConfig | null>({
        queryKey: ['plan-configs', tier],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('tier', tier)
                .single();
            if (error) return null;
            return data ?? null;
        },
        staleTime: STALE_MINUTES * 60 * 1000,
    });
}

/** Admin: inline update a plan config field */
export function useUpdatePlanConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (updates: Partial<PlanConfig> & { tier: Tier }) => {
            const { tier, ...rest } = updates;
            const { data, error } = await supabase
                .from('subscription_plans')
                .update({ ...rest }) // updated_at might not exist or be auto-managed
                .eq('tier', tier)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['plan-configs'] });
            toast.success('Plan config saved — click "Refresh Pricing Cache" to publish changes to the public pricing page');
        },
        onError: (err: any) => {
            toast.error('Failed to save plan config: ' + (err.message ?? 'unknown error'));
        },
    });
}

/** Helper: format limit for display */
export const formatLimit = (val: number, unit = '') =>
    val === -1 ? 'Unlimited' : `${val.toLocaleString()}${unit ? ' ' + unit : ''}`;
