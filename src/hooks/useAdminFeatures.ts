import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const supabase = _supabase as any;

export interface FeatureFlag {
    key: string;
    name: string;
    description: string | null;
    category: 'CORE' | 'ADVANCED' | 'EXPERIMENTAL';
    min_plan_tier: string;
    is_enabled: boolean;
    sort_order: number;
}

export const FEATURE_CATEGORIES = ['CORE', 'ADVANCED', 'EXPERIMENTAL'] as const;

export function useAdminFeatures() {
    return useQuery<FeatureFlag[]>({
        queryKey: ['admin-features'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('features')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return data ?? [];
        }
    });
}

export function useUpdateFeature() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: Partial<FeatureFlag> & { key: string }) => {
            const { key, ...rest } = updates;
            const { data, error } = await supabase
                .from('features')
                .update(rest)
                .eq('key', key)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-features'] });
            // Also invalidate public pricing cache as features might have changed
            queryClient.invalidateQueries({ queryKey: ['pricing-cache-public'] });
            toast.success('Feature updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update feature: ${error.message}`);
        }
    });
}

export function useCreateFeature() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (feature: Omit<FeatureFlag, 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('features')
                .insert(feature)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-features'] });
            toast.success('Feature created successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to create feature: ${error.message}`);
        }
    });
}

export function useSeedFeatures() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (features: Partial<FeatureFlag>[]) => {
            const { data, error } = await supabase
                .from('features')
                .upsert(features, { onConflict: 'key' })
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-features'] });
            toast.success(`Seeded ${data.length} features`);
        },
        onError: (error: Error) => {
            toast.error(`Failed to seed features: ${error.message}`);
        }
    });
}
