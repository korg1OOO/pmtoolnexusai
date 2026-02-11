/**
 * Advanced Admin Service Hooks
 * Extended hooks for analytics, emails, and referrals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =============================================
// ANALYTICS HOOKS
// =============================================

export const useAnalyticsMRR = (days: number = 30) => {
    return useQuery({
        queryKey: ['analytics-mrr', days],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('analytics_mrr_daily')
                .select('*')
                .order('date', { ascending: true })
                .limit(days);

            if (error) throw error;
            return data || [];
        },
    });
};

export const useAnalyticsChurn = (months: number = 12) => {
    return useQuery({
        queryKey: ['analytics-churn', months],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('analytics_churn')
                .select('*')
                .order('month', { ascending: true })
                .limit(months);

            if (error) throw error;
            return data || [];
        },
    });
};

export const useAnalyticsDiscounts = () => {
    return useQuery({
        queryKey: ['analytics-discounts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('analytics_discount_performance')
                .select('*')
                .limit(20);

            if (error) throw error;
            return data || [];
        },
    });
};

export const useAnalyticsLicenses = () => {
    return useQuery({
        queryKey: ['analytics-licenses'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('analytics_license_usage')
                .select('*');

            if (error) throw error;
            return data || [];
        },
    });
};

// =============================================
// EMAIL PREFERENCES HOOKS
// =============================================

export const useEmailPreferences = (userId: string) => {
    return useQuery({
        queryKey: ['email-preferences', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('email_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
    });
};

export const useUpdateEmailPreferences = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, preferences }: { userId: string; preferences: any }) => {
            const { data, error } = await supabase
                .from('email_preferences')
                .upsert({ user_id: userId, ...preferences })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['email-preferences', variables.userId] });
        },
    });
};

// =============================================
// REFERRAL HOOKS
// =============================================

export const useReferralCodes = (userId?: string) => {
    return useQuery({
        queryKey: ['referral-codes', userId],
        queryFn: async () => {
            let query = supabase.from('referral_codes').select('*');

            if (userId) {
                query = query.eq('referrer_user_id', userId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });
};

export const useCreateReferralCode = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (referralCode: any) => {
            const { data, error } = await supabase
                .from('referral_codes')
                .insert(referralCode)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['referral-codes'] });
        },
    });
};

export const useReferralConversions = (codeId: string) => {
    return useQuery({
        queryKey: ['referral-conversions', codeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('referral_conversions')
                .select('*')
                .eq('referral_code_id', codeId)
                .order('converted_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });
};

// =============================================
// EMAIL SENDING HOOK
// =============================================

export const useSendEmail = () => {
    return useMutation({
        mutationFn: async ({ type, data }: { type: string; data: any }) => {
            const { data: result, error } = await supabase.functions.invoke('send-email', {
                body: { type, data },
            });

            if (error) throw error;
            return result;
        },
    });
};

// =============================================
// ADVANCED DISCOUNT CODE UTILITIES
// =============================================

/**
 * Check if discount code is valid for user and tier
 */
export async function validateDiscountCode(
    code: string,
    userId: string,
    tier: string
): Promise<{ valid: boolean; error?: string; discountCode?: any }> {
    // Get discount code
    const { data: discountCode, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

    if (error) {
        return { valid: false, error: 'Discount code not found' };
    }

    // Check if active
    if (!discountCode.is_active) {
        return { valid: false, error: 'Discount code is inactive' };
    }

    // Check expiration
    if (discountCode.valid_until && new Date(discountCode.valid_until) < new Date()) {
        return { valid: false, error: 'Discount code has expired' };
    }

    // Check usage limit
    if (discountCode.max_uses && discountCode.used_count >= discountCode.max_uses) {
        return { valid: false, error: 'Discount code has reached maximum uses' };
    }

    // Check tier restrictions
    if (discountCode.tier_restrictions && discountCode.tier_restrictions.length > 0) {
        if (!discountCode.tier_restrictions.includes(tier)) {
            return { valid: false, error: `Discount code is not valid for ${tier} tier` };
        }
    }

    // Check first-time user only
    if (discountCode.first_time_user_only) {
        const { data: existingSubs } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (existingSubs && existingSubs.length > 0) {
            return { valid: false, error: 'Discount code is for first-time users only' };
        }
    }

    // Check per-user usage limit
    const { data: usageHistory } = await supabase
        .from('discount_code_usage')
        .select('id')
        .eq('discount_code_id', discountCode.id)
        .eq('user_id', userId);

    if (usageHistory && usageHistory.length >= discountCode.max_uses_per_user) {
        return { valid: false, error: 'You have already used this discount code' };
    }

    return { valid: true, discountCode };
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
    originalAmount: number,
    discountType: 'percentage' | 'fixed_amount',
    discountValue: number,
    maxDiscountAmount?: number
): { discountAmount: number; finalAmount: number } {
    let discountAmount = 0;

    if (discountType === 'percentage') {
        discountAmount = (originalAmount * discountValue) / 100;
    } else {
        discountAmount = discountValue;
    }

    // Apply max discount cap if specified
    if (maxDiscountAmount && discountAmount > maxDiscountAmount) {
        discountAmount = maxDiscountAmount;
    }

    // Ensure discount doesn't exceed original amount
    if (discountAmount > originalAmount) {
        discountAmount = originalAmount;
    }

    const finalAmount = originalAmount - discountAmount;

    return { discountAmount, finalAmount };
}
