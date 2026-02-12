/**
 * Subscription Analytics Hook
 * Provides MRR, ARR, churn, and tier-specific analytics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionAnalytics {
    total_subscriptions: number;
    active_subscriptions: number;
    cancelled_subscriptions: number;
    total_mrr: number;
    total_arr: number;
    avg_mrr: number;
    new_subscriptions_30d: number;
    churned_30d: number;
}

export interface TierAnalytics {
    tier: string;
    total_count: number;
    active_count: number;
    tier_mrr: number;
    avg_mrr: number;
    churn_rate_30d: number;
}

/**
 * Get overall subscription analytics
 */
export function useSubscriptionAnalytics() {
    return useQuery({
        queryKey: ['subscription-analytics'],
        queryFn: async (): Promise<SubscriptionAnalytics> => {
            const { data, error } = await supabase
                .from('subscription_analytics')
                .select('*')
                .single();

            if (error) throw error;
            return data || {
                total_subscriptions: 0,
                active_subscriptions: 0,
                cancelled_subscriptions: 0,
                total_mrr: 0,
                total_arr: 0,
                avg_mrr: 0,
                new_subscriptions_30d: 0,
                churned_30d: 0,
            };
        },
    });
}

/**
 * Get tier-specific analytics
 */
export function useTierAnalytics() {
    return useQuery({
        queryKey: ['tier-analytics'],
        queryFn: async (): Promise<TierAnalytics[]> => {
            const { data, error } = await supabase
                .from('tier_analytics')
                .select('*')
                .order('tier_mrr', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });
}

/**
 * Calculate churn rate
 */
export function calculateChurnRate(churned: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((churned / total) * 100 * 100) / 100;
}

/**
 * Calculate LTV (Lifetime Value)
 */
export function calculateLTV(avgMRR: number, churnRate: number): number {
    if (churnRate === 0) return 0;
    return Math.round(avgMRR / (churnRate / 100));
}

/**
 * Format MRR/ARR
 */
export function formatRevenue(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
