/**
 * Subscriptions Hook
 * Manages user subscriptions and billing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SubscriptionTier = 'free' | 'pro' | 'business' | 'agency';
export type SubscriptionStatus = 'active' | 'cancelled' | 'paused' | 'trial';

export interface Subscription {
    id: string;
    user_id: string | null;
    email: string;
    full_name: string | null;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    mrr: number;
    joined_at: string;
    cancelled_at: string | null;
    trial_ends_at: string | null;
    usage_stats: {
        articles_per_month?: number;
        projects_count?: number;
        team_members?: number;
        storage_gb?: number;
    };
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionMetrics {
    total_subscribers: number;
    active_subscribers: number;
    total_mrr: number;
    churn_rate: number;
    by_tier: {
        pro: number;
        business: number;
        agency: number;
    };
}

/**
 * Fetch all subscriptions (admin only)
 */
export function useSubscriptions() {
    return useQuery({
        queryKey: ['subscriptions'],
        queryFn: async (): Promise<Subscription[]> => {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .order('joined_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });
}

/**
 * Get subscription metrics
 */
export function useSubscriptionMetrics() {
    return useQuery({
        queryKey: ['subscription-metrics'],
        queryFn: async (): Promise<SubscriptionMetrics> => {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*');

            if (error) throw error;

            const total_subscribers = data?.length || 0;
            const active_subscribers = data?.filter(s => s.status === 'active').length || 0;
            const total_mrr = data?.reduce((sum, s) => sum + (s.mrr || 0), 0) || 0;

            const by_tier = {
                pro: data?.filter(s => s.tier === 'pro' && s.status === 'active').length || 0,
                business: data?.filter(s => s.tier === 'business' && s.status === 'active').length || 0,
                agency: data?.filter(s => s.tier === 'agency' && s.status === 'active').length || 0,
            };

            // Calculate churn (cancelled in last 30 days / total at start of period)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentCancellations = data?.filter(s =>
                s.cancelled_at && new Date(s.cancelled_at) > thirtyDaysAgo
            ).length || 0;
            const churn_rate = total_subscribers > 0 ? (recentCancellations / total_subscribers) * 100 : 0;

            return {
                total_subscribers,
                active_subscribers,
                total_mrr,
                churn_rate,
                by_tier,
            };
        },
    });
}

/**
 * Update subscription
 */
export function useUpdateSubscription() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {
            id: string;
            tier?: SubscriptionTier;
            status?: SubscriptionStatus;
            mrr?: number;
            usage_stats?: Partial<Subscription['usage_stats']>;
        }) => {
            const { id, ...updates } = input;

            const { data, error } = await supabase
                .from('subscriptions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
            toast.success('Subscription updated');
        },
        onError: (error: any) => {
            console.error('Failed to update subscription:', error);
            toast.error('Failed to update subscription');
        },
    });
}

/**
 * Cancel subscription
 */
export function useCancelSubscription() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (subscriptionId: string) => {
            const { data, error } = await supabase
                .from('subscriptions')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    mrr: 0,
                })
                .eq('id', subscriptionId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
            toast.success('Subscription cancelled');
        },
        onError: (error: any) => {
            console.error('Failed to cancel subscription:', error);
            toast.error('Failed to cancel subscription');
        },
    });
}

/**
 * Get current user's subscription
 */
export function useMySubscription() {
    return useQuery({
        queryKey: ['my-subscription'],
        queryFn: async (): Promise<Subscription | null> => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        },
    });
}
