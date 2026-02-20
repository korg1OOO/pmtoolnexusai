/**
 * Feature Access Hook
 * Checks user's subscription tier and feature access
 */

import { useQuery } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { usePlanConfigs } from '@/hooks/usePlanConfigs';
const supabase = _supabase as any;

export type SubscriptionTier = 'free' | 'pro' | 'business' | 'agency';

export interface FeatureAccess {
    feature_key: string;
    feature_name: string;
    description: string | null;
    is_enabled: boolean;
}

/**
 * Get current user's subscription tier
 */
export function useUserTier() {
    return useQuery({
        queryKey: ['user-tier'],
        queryFn: async (): Promise<SubscriptionTier> => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 'free';

            const { data, error } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            if (error || !data) return 'free';
            return (data.subscription_tier as SubscriptionTier) || 'free';
        },
    });
}

/**
 * Get all features available to current user
 */
export function useUserFeatures() {
    return useQuery({
        queryKey: ['user-features'],
        queryFn: async (): Promise<FeatureAccess[]> => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('user_features')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            return data || [];
        },
    });
}

/**
 * Check if user has access to a specific feature
 */
export function useHasFeature(featureKey: string) {
    const { data: features = [] } = useUserFeatures();
    return features.some(f => f.feature_key === featureKey);
}

/**
 * Check multiple features at once
 */
export function useHasFeatures(featureKeys: string[]) {
    const { data: features = [] } = useUserFeatures();
    const enabledKeys = new Set(features.map(f => f.feature_key));

    return featureKeys.reduce((acc, key) => {
        acc[key] = enabledKeys.has(key);
        return acc;
    }, {} as Record<string, boolean>);
}

/**
 * Get features by tier (for pricing page)
 */
export function useFeaturesByTier(tier: SubscriptionTier) {
    return useQuery({
        queryKey: ['features-by-tier', tier],
        queryFn: async (): Promise<FeatureAccess[]> => {
            // Get cumulative features (includes lower tiers)
            const tierHierarchy: Record<SubscriptionTier, SubscriptionTier[]> = {
                free: ['free'],
                pro: ['free', 'pro'],
                business: ['free', 'pro', 'business'],
                agency: ['free', 'pro', 'business', 'agency'],
            };

            const { data, error } = await supabase
                .from('subscription_features')
                .select('feature_key, feature_name, description, is_enabled')
                .in('tier', tierHierarchy[tier])
                .eq('is_enabled', true)
                .order('tier', { ascending: true });

            if (error) throw error;
            return data || [];
        },
    });
}

/**
 * Tier comparison helper
 */
export const TIER_ORDER: SubscriptionTier[] = ['free', 'pro', 'business', 'agency'];

export function isTierHigherOrEqual(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
    return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

/**
 * Tier pricing (hardcoded fallback — kept for backwards-compat).
 * @deprecated Use useTierPricing() to read live values from the DB.
 */
export const TIER_PRICING = {
    free: { monthly: 0, annual: 0 },
    pro: { monthly: 10, annual: 100 },
    business: { monthly: 39, annual: 390 },
    agency: { monthly: 99, annual: 990 },
} as const;

/**
 * Tier limits (hardcoded fallback — kept for backwards-compat).
 * @deprecated Use useTierLimits(tier) to read live values from the DB.
 */
export const TIER_LIMITS = {
    free: { projects: 3, teamMembers: 1, fileSize: 10, storage: 100, aiCredits: 0 },
    pro: { projects: -1, teamMembers: 10, fileSize: 100, storage: 10000, aiCredits: 500 },
    business: { projects: -1, teamMembers: 50, fileSize: 500, storage: 100000, aiCredits: 2000 },
    agency: { projects: -1, teamMembers: -1, fileSize: 1000, storage: 500000, aiCredits: -1 },
} as const;

// ─── DB-backed reactive alternatives ─────────────────────────────────────────

/**
 * Returns live pricing for all tiers from the plan_configs DB table.
 * Falls back to the hardcoded TIER_PRICING if the query has not resolved yet.
 * Emits a console.error if the DB query fails so the issue is observable.
 */
export function useTierPricing() {
    const { data: configs = [], isError } = usePlanConfigs();
    if (isError) {
        console.error('[useFeatureAccess] useTierPricing: plan_configs query failed — using hardcoded fallback. Check plan_configs RLS policies.');
    }
    if (configs.length === 0) return TIER_PRICING as Record<string, { monthly: number; annual: number }>;
    return Object.fromEntries(
        configs.map(c => [c.tier, { monthly: c.price_monthly, annual: c.price_annual }])
    ) as Record<string, { monthly: number; annual: number }>;
}

/**
 * Returns live limits for a specific tier from the plan_configs DB table.
 * Falls back to the hardcoded TIER_LIMITS if the query has not resolved yet.
 * Emits a console.error if the DB query fails so the issue is observable.
 */
export function useTierLimits(tier: SubscriptionTier) {
    const { data: configs = [], isError } = usePlanConfigs();
    if (isError) {
        console.error('[useFeatureAccess] useTierLimits: plan_configs query failed — using hardcoded fallback. Check plan_configs RLS policies.');
    }
    const cfg = configs.find(c => c.tier === tier);
    if (!cfg) return TIER_LIMITS[tier] as { projects: number; teamMembers: number; fileSize: number; storage: number; aiCredits: number };
    return {
        projects: cfg.max_projects,
        teamMembers: cfg.max_members,
        fileSize: cfg.max_file_size_mb,
        storage: cfg.max_storage_mb,
        aiCredits: cfg.max_ai_credits,
    };
}
