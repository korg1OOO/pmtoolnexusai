/**
 * usePlanConfigs
 * Reads plan pricing and limits from the subscription_plans table.
 * Maps DB row shape to PlanConfig for use across admin + pricing pages.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const supabase = _supabase as any;

export type Tier = 'free' | 'pro' | 'business' | 'agency';

export interface PlanConfig {
    id: string;
    tier: Tier;
    name: string;
    display_name: string;
    description?: string;
    price_monthly: number;
    price_annual: number;
    limits: any;
    features: any;
    active: boolean;
    is_active: boolean;
    is_popular: boolean;
    stripe_price_id_monthly?: string | null;
    stripe_price_id_annual?: string | null;
    max_projects: number;
    max_members: number;
    max_storage_mb: number;
    max_ai_credits: number;
    max_file_size_mb: number;
    updated_at: string;
}

/** Map a raw DB row to PlanConfig, extracting limits from JSON */
function mapRowToPlanConfig(row: any): PlanConfig {
    const limits = row.limits ?? {};
    return {
        id: row.id,
        tier: row.tier,
        name: row.name,
        display_name: row.name,
        description: row.description ?? '',
        price_monthly: row.price_monthly ?? 0,
        price_annual: row.price_annual ?? 0,
        limits: row.limits,
        features: row.features,
        active: row.active ?? true,
        is_active: row.active ?? true,
        is_popular: limits.is_popular ?? false,
        stripe_price_id_monthly: row.stripe_price_id_monthly,
        stripe_price_id_annual: row.stripe_price_id_annual,
        max_projects: limits.projects ?? 0,
        max_members: limits.users ?? limits.members ?? 0,
        max_storage_mb: limits.storage_mb ?? limits.storage ?? 0,
        max_ai_credits: limits.ai_credits ?? 0,
        max_file_size_mb: limits.file_size_mb ?? -1,
        updated_at: row.updated_at ?? row.created_at ?? '',
    };
}

const STALE_MINUTES = 5;

/** Fetch all plan configs ordered by price */
export function usePlanConfigs() {
    return useQuery<PlanConfig[]>({
        queryKey: ['plan-configs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price_monthly', { ascending: true });
            if (error) throw error;
            return (data ?? []).map(mapRowToPlanConfig);
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
            return data ? mapRowToPlanConfig(data) : null;
        },
        staleTime: STALE_MINUTES * 60 * 1000,
    });
}

/** Admin: inline update a plan config field */
export function useUpdatePlanConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (updates: Partial<PlanConfig> & { tier: Tier }) => {
            const { tier, display_name, max_projects, max_members, max_storage_mb, max_ai_credits, max_file_size_mb, is_active, is_popular, ...rest } = updates;

            // Build the DB update payload
            const dbUpdate: any = {};
            if (display_name !== undefined) dbUpdate.name = display_name;
            if (rest.name !== undefined) dbUpdate.name = rest.name;
            if (rest.price_monthly !== undefined) dbUpdate.price_monthly = rest.price_monthly;
            if (rest.price_annual !== undefined) dbUpdate.price_annual = rest.price_annual;
            if (rest.description !== undefined) dbUpdate.description = rest.description;
            if (is_active !== undefined) dbUpdate.active = is_active;
            if (rest.active !== undefined) dbUpdate.active = rest.active;

            // If any limit fields changed, rebuild limits JSON
            if (max_projects !== undefined || max_members !== undefined || max_storage_mb !== undefined || max_ai_credits !== undefined || max_file_size_mb !== undefined || is_popular !== undefined) {
                // Fetch current limits first
                const { data: current } = await supabase
                    .from('subscription_plans')
                    .select('limits')
                    .eq('tier', tier)
                    .single();
                const currentLimits = current?.limits ?? {};
                const newLimits = { ...currentLimits };
                if (max_projects !== undefined) newLimits.projects = max_projects;
                if (max_members !== undefined) newLimits.users = max_members;
                if (max_storage_mb !== undefined) newLimits.storage_mb = max_storage_mb;
                if (max_ai_credits !== undefined) newLimits.ai_credits = max_ai_credits;
                if (max_file_size_mb !== undefined) newLimits.file_size_mb = max_file_size_mb;
                if (is_popular !== undefined) newLimits.is_popular = is_popular;
                dbUpdate.limits = newLimits;
            }

            const { data, error } = await supabase
                .from('subscription_plans')
                .update(dbUpdate)
                .eq('tier', tier)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['plan-configs'] });
            toast.success('Plan config saved — click "Refresh Pricing Cache" to publish changes');
        },
        onError: (err: any) => {
            toast.error('Failed to save plan config: ' + (err.message ?? 'unknown error'));
        },
    });
}

/** Helper: format limit for display */
export const formatLimit = (val: number, unit = '') =>
    val === -1 ? 'Unlimited' : `${val.toLocaleString()}${unit ? ' ' + unit : ''}`;
