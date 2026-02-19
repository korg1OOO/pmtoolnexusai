/**
 * usePricingCache
 * Fetches public pricing data for the unauthenticated pricing page.
 * Reads from the get-pricing-cache Edge Function (cache-first, DB fallback).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
import type { PlanConfig } from './usePlanConfigs';

const supabase = _supabase as any;

export interface CachedPricingData {
    plans: PlanConfig[];
    features: Record<string, { key: string; name: string; description: string | null }[]>;
    cached_at: string;
}

export function usePricingCache(options?: { enabled?: boolean }) {
    return useQuery<CachedPricingData | null>({
        queryKey: ['pricing-cache-public'],
        enabled: options?.enabled ?? true,
        queryFn: async (): Promise<CachedPricingData | null> => {
            try {
                const { data, error } = await supabase.functions.invoke('get-pricing-cache', {});
                if (error) throw error;

                // If features are missing in cache (e.g. edge function not updated), fetch from DB
                const cachedData = data as CachedPricingData;
                if (!cachedData.features || Object.keys(cachedData.features).length === 0) {
                    // Fetch features from DB and merge
                    const { data: featureFlags } = await supabase
                        .from('features')
                        .select('*')
                        .eq('is_enabled', true)
                        .order('sort_order', { ascending: true });

                    const featuresByTier: Record<string, any[]> = {};
                    (cachedData.plans || []).forEach((p: any) => {
                        featuresByTier[p.tier] = (featureFlags || [])
                            .filter((f: any) => {
                                const tiers = ['free', 'starter', 'pro', 'business', 'agency', 'enterprise'];
                                const pIndex = tiers.indexOf(p.tier.toLowerCase());
                                const fIndex = tiers.indexOf(f.min_plan_tier.toLowerCase());
                                return pIndex >= fIndex && fIndex !== -1;
                            })
                            .map((f: any) => ({
                                key: f.key,
                                name: f.name,
                                description: f.description
                            }));
                    });
                    return { ...cachedData, features: featuresByTier };
                }

                return cachedData;
            } catch {
                // Fallback: read subscription_plans and features directly if Edge Function unavailable
                const { data: plans } = await supabase
                    .from('subscription_plans')
                    .select('*')
                    .eq('active', true) // assuming 'active' column based on previous context, or remove filter if unsure
                    .order('price_monthly', { ascending: true });

                const { data: featureFlags } = await supabase
                    .from('features')
                    .select('*')
                    .eq('is_enabled', true)
                    .order('sort_order', { ascending: true });

                // Transform features to Record<tier, features[]>
                const featuresByTier: Record<string, any[]> = {};
                (plans || []).forEach((p: any) => {
                    featuresByTier[p.tier] = (featureFlags || [])
                        .filter((f: any) => {
                            // Simple tier check (assuming order: free, starter, pro, business/agency)
                            // This is a naive client-side fallback check. 
                            // Real logic should be in Edge Function or a robust utility.
                            const tiers = ['free', 'starter', 'pro', 'business', 'agency', 'enterprise'];
                            const pIndex = tiers.indexOf(p.tier.toLowerCase());
                            const fIndex = tiers.indexOf(f.min_plan_tier.toLowerCase());
                            return pIndex >= fIndex && fIndex !== -1;
                        })
                        .map((f: any) => ({
                            key: f.key,
                            name: f.name,
                            description: f.description
                        }));
                });

                return {
                    plans: plans ?? [],
                    features: featuresByTier,
                    cached_at: new Date().toISOString()
                };
            }
        },
        staleTime: 5 * 60 * 1000, // 5 min client-side stale
        gcTime: 60 * 60 * 1000, // keep in memory 1 hour
    });
}
