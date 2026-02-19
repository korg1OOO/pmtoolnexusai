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
    tier: Tier;
    display_name: string;
    description: string | null;
    price_monthly: number;
    price_annual: number;
    max_projects: number;     // -1 = unlimited
    max_members: number;      // -1 = unlimited
    max_storage_mb: number;   // -1 = unlimited
    max_ai_credits: number;   // -1 = unlimited
    max_file_size_mb: number;
    is_popular: boolean;
    is_active: boolean;
    stripe_price_monthly_id: string | null;
    stripe_price_annual_id: string | null;
    sort_order: number;
    updated_at: string;
}

const STALE_MINUTES = 5;

/** Fetch all plan configs ordered by sort_order */
export function usePlanConfigs() {
    return useQuery<PlanConfig[]>({
        queryKey: ['plan-configs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('plan_configs')
                .select('*')
                .order('sort_order', { ascending: true });
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
                .from('plan_configs')
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
                .from('plan_configs')
                .update({ ...rest, updated_at: new Date().toISOString() })
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
