/**
 * Feature Access Hook
 * Checks user's subscription tier and feature access
 */

import { useQuery } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
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
 * Tier pricing (can be moved to database later)
 */
export const TIER_PRICING = {
    free: { monthly: 0, annual: 0 },
    pro: { monthly: 10, annual: 100 },
    business: { monthly: 39, annual: 390 },
    agency: { monthly: 99, annual: 990 },
} as const;

/**
 * Tier limits
 */
export const TIER_LIMITS = {
    free: {
        projects: 3,
        teamMembers: 1,
        fileSize: 10, // MB
        storage: 100, // MB
    },
    pro: {
        projects: -1, // unlimited
        teamMembers: 10,
        fileSize: 100,
        storage: 10000, // 10GB
    },
    business: {
        projects: -1,
        teamMembers: 50,
        fileSize: 500,
        storage: 100000, // 100GB
    },
    agency: {
        projects: -1,
        teamMembers: -1, // unlimited
        fileSize: 1000,
        storage: 500000, // 500GB
    },
} as const;
