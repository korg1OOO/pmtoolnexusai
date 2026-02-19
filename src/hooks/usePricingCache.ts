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

export function usePricingCache() {
    return useQuery<CachedPricingData | null>({
        queryKey: ['pricing-cache-public'],
        queryFn: async (): Promise<CachedPricingData | null> => {
            try {
                const { data, error } = await supabase.functions.invoke('get-pricing-cache', {});
                if (error) throw error;
                return data as CachedPricingData;
            } catch {
                // Fallback: read plan_configs directly if Edge Function unavailable
                const { data: plans } = await supabase
                    .from('plan_configs')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });
                return { plans: plans ?? [], features: {}, cached_at: new Date().toISOString() };
            }
        },
        staleTime: 5 * 60 * 1000, // 5 min client-side stale
        gcTime: 60 * 60 * 1000, // keep in memory 1 hour
    });
}
