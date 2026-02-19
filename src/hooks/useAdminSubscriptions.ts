/**
 * useAdminSubscriptions
 * Admin-facing hooks for the full subscriptions management page.
 * Provides rich data including Stripe IDs, workspace names, plan limits, and computed MRR stats.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const supabase = _supabase as any;

export type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'cancelled' | 'paused' | 'trial';
export type SubTier = 'free' | 'pro' | 'business' | 'agency';

export interface AdminSubscription {
    id: string;
    user_id: string | null;
    email: string;
    full_name: string | null;
    workspace_id: string | null;
    workspace_name: string | null;       // joined from projects/tenants
    tier: SubTier;
    status: SubStatus;
    billing_cycle: 'monthly' | 'annual';
    mrr: number;
    trial_ends_at: string | null;
    renewal_date: string | null;
    cancelled_at: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    usage_stats: {
        projects_count?: number;
        team_members?: number;
        storage_gb?: number;
        ai_credits_used?: number;
    };
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionRevenueSummary {
    mrr: number;
    arr: number;
    activeCount: number;
    trialCount: number;
    churnedCount: number;
    churnRate: number;
}

/** Fetch all subscriptions for the admin table */
export function useAdminSubscriptions(filters?: {
    search?: string;
    status?: SubStatus | 'all';
    tier?: SubTier | 'all';
    page?: number;
    pageSize?: number;
}) {
    const page = filters?.page ?? 0;
    const pageSize = filters?.pageSize ?? 25;

    return useQuery<{ rows: AdminSubscription[]; total: number }>({
        queryKey: ['admin-subscriptions', filters],
        queryFn: async () => {
            let query = supabase
                .from('subscriptions')
                .select('*', { count: 'exact' });

            // Search by email or full_name
            if (filters?.search && filters.search.trim() !== '') {
                const s = filters.search.trim();
                query = query.or(`email.ilike.%${s}%,full_name.ilike.%${s}%`);
            }

            // Status filter
            if (filters?.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            // Tier filter
            if (filters?.tier && filters.tier !== 'all') {
                query = query.eq('tier', filters.tier);
            }

            query = query
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            const { data, error, count } = await query;
            if (error) throw error;
            return { rows: data ?? [], total: count ?? 0 };
        },
        staleTime: 30_000,
    });
}

/** Revenue summary stats derived from subscriptions */
export function useSubscriptionRevenueSummary(): { data: SubscriptionRevenueSummary | undefined; isLoading: boolean } {
    const { data, isLoading } = useQuery<SubscriptionRevenueSummary>({
        queryKey: ['admin-sub-revenue-summary'],
        queryFn: async () => {
            const { data: subs, error } = await supabase
                .from('subscriptions')
                .select('status, mrr, trial_ends_at, cancelled_at, created_at');
            if (error) throw error;

            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const active = subs?.filter((s: any) => s.status === 'active') ?? [];
            const trials = subs?.filter((s: any) => s.status === 'trialing' || s.status === 'trial') ?? [];
            const churned = subs?.filter((s: any) => {
                const cancelledAt = s.cancelled_at ? new Date(s.cancelled_at) : null;
                return cancelledAt && cancelledAt >= thirtyDaysAgo;
            }) ?? [];

            const totalActive = active.length + trials.length;
            const mrr = active.reduce((sum: number, s: any) => sum + (s.mrr ?? 0), 0);

            return {
                mrr,
                arr: mrr * 12,
                activeCount: active.length,
                trialCount: trials.length,
                churnedCount: churned.length,
                churnRate: totalActive > 0 ? (churned.length / totalActive) * 100 : 0,
            };
        },
        staleTime: 60_000,
    });
    return { data, isLoading };
}

/** Admin: override a subscription's plan tier (manual override) */
export function useOverrideSubscriptionPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, tier, mrr }: { id: string; tier: SubTier; mrr: number }) => {
            const { data, error } = await supabase
                .from('subscriptions')
                .update({ tier, mrr, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            qc.invalidateQueries({ queryKey: ['admin-sub-revenue-summary'] });
            toast.success(`Plan changed to ${vars.tier}`);
        },
        onError: (err: any) => toast.error('Plan override failed: ' + (err.message ?? '')),
    });
}

/** Admin: cancel a subscription */
export function useAdminCancelSubscription() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('subscriptions')
                .update({ status: 'canceled', cancelled_at: new Date().toISOString(), mrr: 0 })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            qc.invalidateQueries({ queryKey: ['admin-sub-revenue-summary'] });
            toast.success('Subscription canceled');
        },
        onError: (err: any) => toast.error('Cancel failed: ' + (err.message ?? '')),
    });
}

/** Admin: apply a credit adjustment to subscription */
export function useApplyCreditAdjustment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, creditDelta, note }: { id: string; creditDelta: number; note: string }) => {
            // Fetch current usage stats
            const { data: current, error: fetchErr } = await supabase
                .from('subscriptions')
                .select('usage_stats')
                .eq('id', id)
                .single();
            if (fetchErr) throw fetchErr;

            const prev = current?.usage_stats ?? {};
            const updated = {
                ...prev,
                ai_credits_used: Math.max(0, (prev.ai_credits_used ?? 0) - creditDelta),
                last_credit_adjustment: { delta: creditDelta, note, applied_at: new Date().toISOString() },
            };

            const { data, error } = await supabase
                .from('subscriptions')
                .update({ usage_stats: updated })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            toast.success('Credit adjustment applied');
        },
        onError: (err: any) => toast.error('Credit adjustment failed: ' + (err.message ?? '')),
    });
}

/** Admin: toggle a feature flag for a tier in subscription_features */
export function useToggleFeatureFlag() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ tier, featureKey, enabled }: { tier: string; featureKey: string; enabled: boolean }) => {
            const { data, error } = await supabase
                .from('subscription_features')
                .update({ is_enabled: enabled })
                .eq('tier', tier)
                .eq('feature_key', featureKey)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['subscription-features'] });
            qc.invalidateQueries({ queryKey: ['user-features'] });
            toast.success('Feature flag updated — takes effect immediately');
        },
        onError: (err: any) => toast.error('Feature flag update failed: ' + (err.message ?? '')),
    });
}

/** Fetch all feature flags per tier */
export function useSubscriptionFeatureFlags() {
    return useQuery({
        queryKey: ['subscription-features'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subscription_features')
                .select('*')
                .order('tier', { ascending: true })
                .order('feature_name', { ascending: true });
            if (error) throw error;
            return data ?? [];
        },
    });
}

/** Admin: refresh the public pricing cache via Edge Function */
export function useRefreshPricingCache() {
    return useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.functions.invoke('refresh-pricing-cache', {});
            if (error) throw error;
            return data;
        },
        onSuccess: () => toast.success('Pricing cache refreshed — public pricing page will serve updated data'),
        onError: (err: any) => toast.error('Cache refresh failed: ' + (err.message ?? '')),
    });
}
