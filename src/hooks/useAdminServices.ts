/**
 * Admin Service Hooks
 * React Query hooks for admin panel data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
    Subscription,
    DiscountCode,
    DiscountCodeUsage,
    LicenseKey,
    LicenseKeyActivation,
} from '@/integrations/supabase/types';

// =============================================
// SUBSCRIPTIONS
// =============================================

export const useSubscriptions = (filters?: {
    tier?: string;
    status?: string;
    userId?: string;
}) => {
    return useQuery({
        queryKey: ['admin-subscriptions', filters],
        queryFn: async (): Promise<Subscription[]> => {
            let query = supabase.from('subscriptions').select('*');

            if (filters?.tier) {
                query = query.eq('tier', filters.tier);
            }
            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.userId) {
                query = query.eq('user_id', filters.userId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });
};

export const useSubscriptionMetrics = () => {
    return useQuery({
        queryKey: ['admin-subscription-metrics'],
        queryFn: async () => {
            const { data: subscriptions, error } = await supabase
                .from('subscriptions')
                .select('tier, status, mrr')
                .eq('status', 'active');

            if (error) throw error;

            const totalSubscriptions = subscriptions?.length || 0;
            const totalMRR = subscriptions?.reduce((sum, sub) => sum + (sub.mrr || 0), 0) || 0;

            const tierCounts = {
                pro: subscriptions?.filter(s => s.tier === 'pro').length || 0,
                business: subscriptions?.filter(s => s.tier === 'business').length || 0,
                agency: subscriptions?.filter(s => s.tier === 'agency').length || 0,
            };

            return {
                totalSubscriptions,
                totalMRR,
                tierCounts,
            };
        },
    });
};

export const useCreateSubscription = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (subscription: Partial<Subscription>) => {
            const { data, error } = await supabase
                .from('subscriptions')
                .insert(subscription)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['admin-subscription-metrics'] });
        },
    });
};

export const useUpdateSubscription = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Subscription> }) => {
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
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['admin-subscription-metrics'] });
        },
    });
};

export const useCancelSubscription = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (subscriptionId: string) => {
            const { data, error } = await supabase
                .from('subscriptions')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                })
                .eq('id', subscriptionId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['admin-subscription-metrics'] });
        },
    });
};

// =============================================
// DISCOUNT CODES
// =============================================

export const useDiscountCodes = (filters?: { isActive?: boolean }) => {
    return useQuery({
        queryKey: ['admin-discount-codes', filters],
        queryFn: async (): Promise<DiscountCode[]> => {
            let query = supabase.from('discount_codes').select('*');

            if (filters?.isActive !== undefined) {
                query = query.eq('is_active', filters.isActive);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });
};

export const useDiscountCodeUsage = (codeId?: string) => {
    return useQuery({
        queryKey: ['admin-discount-usage', codeId],
        queryFn: async (): Promise<DiscountCodeUsage[]> => {
            let query = supabase.from('discount_code_usage').select('*');

            if (codeId) {
                query = query.eq('discount_code_id', codeId);
            }

            const { data, error } = await query.order('used_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!codeId,
    });
};

export const useCreateDiscountCode = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (discountCode: Partial<DiscountCode>) => {
            const { data, error } = await supabase
                .from('discount_codes')
                .insert(discountCode)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-discount-codes'] });
        },
    });
};

export const useUpdateDiscountCode = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<DiscountCode> }) => {
            const { data, error } = await supabase
                .from('discount_codes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-discount-codes'] });
        },
    });
};

export const useDeactivateDiscountCode = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (codeId: string) => {
            const { data, error } = await supabase
                .from('discount_codes')
                .update({ is_active: false })
                .eq('id', codeId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-discount-codes'] });
        },
    });
};

// =============================================
// LICENSE KEYS
// =============================================

export const useLicenseKeys = (filters?: {
    licenseType?: string;
    isActive?: boolean;
    isRedeemed?: boolean;
}) => {
    return useQuery({
        queryKey: ['admin-license-keys', filters],
        queryFn: async (): Promise<LicenseKey[]> => {
            let query = supabase.from('license_keys').select('*');

            if (filters?.licenseType) {
                query = query.eq('license_type', filters.licenseType);
            }
            if (filters?.isActive !== undefined) {
                query = query.eq('is_active', filters.isActive);
            }
            if (filters?.isRedeemed !== undefined) {
                query = query.eq('is_redeemed', filters.isRedeemed);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });
};

export const useLicenseKeyActivations = (licenseKeyId?: string) => {
    return useQuery({
        queryKey: ['admin-license-activations', licenseKeyId],
        queryFn: async (): Promise<LicenseKeyActivation[]> => {
            const { data, error } = await supabase
                .from('license_key_activations')
                .select('*')
                .eq('license_key_id', licenseKeyId!)
                .order('activated_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!licenseKeyId,
    });
};

export const useCreateLicenseKey = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (licenseKey: Partial<LicenseKey>) => {
            const { data, error } = await supabase
                .from('license_keys')
                .insert(licenseKey)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-license-keys'] });
        },
    });
};

export const useBulkCreateLicenseKeys = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (licenseKeys: Partial<LicenseKey>[]) => {
            const { data, error } = await supabase
                .from('license_keys')
                .insert(licenseKeys)
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-license-keys'] });
        },
    });
};

export const useRevokeLicenseKey = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (licenseKeyId: string) => {
            const { data, error } = await supabase
                .from('license_keys')
                .update({ is_active: false })
                .eq('id', licenseKeyId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-license-keys'] });
        },
    });
};
