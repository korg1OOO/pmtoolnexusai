import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// Type Definitions
// ============================================

export interface ReferralCode {
    id: string;
    user_id: string;
    code: string;
    commission_rate: number;
    status: 'active' | 'inactive' | 'expired';
    created_at: string;
    expires_at: string | null;
}

export interface ReferralConversion {
    id: string;
    referral_code_id: string;
    referred_user_id: string;
    conversion_type: string;
    conversion_value: number;
    status: 'pending' | 'approved' | 'paid' | 'cancelled';
    converted_at: string;
    created_at: string;
}

export interface AffiliatePayout {
    id: string;
    user_id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    period_start: string;
    period_end: string;
    conversion_ids: string[];
    approved_by: string | null;
    approved_at: string | null;
    paid_at: string | null;
    rejection_reason: string | null;
    created_at: string;
}

// ============================================
// Referral Code Hooks
// ============================================

export const useReferralCodes = (userId?: string, status?: string) => {
    return useQuery({
        queryKey: ["referral-codes", userId, status],
        queryFn: async (): Promise<ReferralCode[]> => {
            try {
                let query = supabase
                    .from("referral_codes")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (userId) {
                    query = query.eq("user_id", userId);
                }

                if (status) {
                    query = query.eq("status", status);
                }

                const { data, error } = await query;
                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("referral_codes query failed", e);
                return [];
            }
        },
    });
};

export const useReferralCode = (code: string | undefined) => {
    return useQuery({
        queryKey: ["referral-code", code],
        queryFn: async (): Promise<ReferralCode | null> => {
            if (!code) return null;

            try {
                const { data, error } = await supabase
                    .from("referral_codes")
                    .select("*")
                    .eq("code", code)
                    .single();

                if (error) throw error;
                return data;
            } catch (e) {
                console.warn("referral_code lookup failed", e);
                return null;
            }
        },
        enabled: !!code,
    });
};

export const useReferralCodeStats = (code: string) => {
    return useQuery({
        queryKey: ["referral-code-stats", code],
        queryFn: async () => {
            try {
                // Get code ID first
                const { data: codeData } = await supabase
                    .from("referral_codes")
                    .select("id")
                    .eq("code", code)
                    .single();

                if (!codeData) return { uses: 0, conversions: 0, totalValue: 0 };

                // Get conversion stats
                const { data: conversions } = await supabase
                    .from("referral_conversions")
                    .select("*")
                    .eq("referral_code_id", codeData.id);

                const stats = {
                    uses: conversions?.length || 0,
                    conversions: conversions?.filter(c => c.status !== 'cancelled').length || 0,
                    totalValue: conversions?.reduce((sum, c) => sum + c.conversion_value, 0) || 0,
                };

                return stats;
            } catch (e) {
                console.warn("Code stats query failed", e);
                return { uses: 0, conversions: 0, totalValue: 0 };
            }
        },
        enabled: !!code,
    });
};

// ============================================
// Referral Conversion Hooks
// ============================================

export const useReferralConversions = (referralCodeId?: string, status?: string) => {
    return useQuery({
        queryKey: ["referral-conversions", referralCodeId, status],
        queryFn: async (): Promise<ReferralConversion[]> => {
            try {
                let query = supabase
                    .from("referral_conversions")
                    .select("*")
                    .order("converted_at", { ascending: false });

                if (referralCodeId) {
                    query = query.eq("referral_code_id", referralCodeId);
                }

                if (status) {
                    query = query.eq("status", status);
                }

                const { data, error } = await query;
                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("referral_conversions query failed", e);
                return [];
            }
        },
    });
};

export const useConversionStats = () => {
    return useQuery({
        queryKey: ["conversion-stats"],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from("referral_conversions")
                    .select("*");

                if (error) throw error;

                const now = new Date();
                const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                const stats = {
                    total: data?.length || 0,
                    pending: data?.filter(c => c.status === 'pending').length || 0,
                    approved: data?.filter(c => c.status === 'approved').length || 0,
                    paid: data?.filter(c => c.status === 'paid').length || 0,
                    last30d: data?.filter(c => new Date(c.converted_at) > last30d).length || 0,
                    totalValue: data?.reduce((sum, c) => sum + c.conversion_value, 0) || 0,
                };

                return stats;
            } catch (e) {
                console.warn("Conversion stats query failed", e);
                return {
                    total: 0,
                    pending: 0,
                    approved: 0,
                    paid: 0,
                    last30d: 0,
                    totalValue: 0,
                };
            }
        },
    });
};

// ============================================
// Affiliate Payout Hooks
// ============================================

export const useAffiliatePayouts = (userId?: string, status?: string) => {
    return useQuery({
        queryKey: ["affiliate-payouts", userId, status],
        queryFn: async (): Promise<AffiliatePayout[]> => {
            try {
                let query = supabase
                    .from("affiliate_payouts")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (userId) {
                    query = query.eq("user_id", userId);
                }

                if (status) {
                    query = query.eq("status", status);
                }

                const { data, error } = await query;
                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("affiliate_payouts query failed", e);
                return [];
            }
        },
    });
};

export const useAffiliatePayout = (id: string | undefined) => {
    return useQuery({
        queryKey: ["affiliate-payout", id],
        queryFn: async (): Promise<AffiliatePayout | null> => {
            if (!id) return null;

            try {
                const { data, error } = await supabase
                    .from("affiliate_payouts")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;
                return data;
            } catch (e) {
                console.warn("affiliate_payout query failed", e);
                return null;
            }
        },
        enabled: !!id,
    });
};

export const usePendingPayouts = () => {
    return useQuery({
        queryKey: ["pending-payouts"],
        queryFn: async (): Promise<AffiliatePayout[]> => {
            try {
                const { data, error } = await supabase
                    .from("affiliate_payouts")
                    .select("*")
                    .eq("status", "pending")
                    .order("created_at", { ascending: true });

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("Pending payouts query failed", e);
                return [];
            }
        },
    });
};

export const usePayoutStats = () => {
    return useQuery({
        queryKey: ["payout-stats"],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from("affiliate_payouts")
                    .select("*");

                if (error) throw error;

                const stats = {
                    total: data?.length || 0,
                    pending: data?.filter(p => p.status === 'pending').length || 0,
                    approved: data?.filter(p => p.status === 'approved').length || 0,
                    paid: data?.filter(p => p.status === 'paid').length || 0,
                    rejected: data?.filter(p => p.status === 'rejected').length || 0,
                    totalPaid: data
                        ?.filter(p => p.status === 'paid')
                        .reduce((sum, p) => sum + p.amount, 0) || 0,
                    totalPending: data
                        ?.filter(p => p.status === 'pending' || p.status === 'approved')
                        .reduce((sum, p) => sum + p.amount, 0) || 0,
                };

                return stats;
            } catch (e) {
                console.warn("Payout stats query failed", e);
                return {
                    total: 0,
                    pending: 0,
                    approved: 0,
                    paid: 0,
                    rejected: 0,
                    totalPaid: 0,
                    totalPending: 0,
                };
            }
        },
    });
};

// ============================================
// Mutation Hooks
// ============================================

export const useGenerateReferralCode = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            userId,
            commissionRate
        }: {
            userId: string;
            commissionRate: number;
        }) => {
            // Generate unique code
            const code = `REF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

            const { data, error } = await supabase
                .from("referral_codes")
                .insert({
                    user_id: userId,
                    code,
                    commission_rate: commissionRate,
                    status: 'active',
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["referral-codes"] });
        },
    });
};

export const useDeactivateReferralCode = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (codeId: string) => {
            const { data, error } = await supabase
                .from("referral_codes")
                .update({ status: 'inactive' })
                .eq("id", codeId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["referral-codes"] });
        },
    });
};

export const useUpdateConversionStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            status
        }: {
            id: string;
            status: 'approved' | 'paid' | 'cancelled';
        }) => {
            const { data, error } = await supabase
                .from("referral_conversions")
                .update({ status })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["referral-conversions"] });
            queryClient.invalidateQueries({ queryKey: ["conversion-stats"] });
        },
    });
};

export const useApprovePayout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            approvedBy
        }: {
            id: string;
            approvedBy: string;
        }) => {
            const { data, error } = await supabase
                .from("affiliate_payouts")
                .update({
                    status: 'approved',
                    approved_by: approvedBy,
                    approved_at: new Date().toISOString()
                })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["affiliate-payouts"] });
            queryClient.invalidateQueries({ queryKey: ["pending-payouts"] });
            queryClient.invalidateQueries({ queryKey: ["payout-stats"] });
        },
    });
};

export const useRejectPayout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            reason
        }: {
            id: string;
            reason: string;
        }) => {
            const { data, error } = await supabase
                .from("affiliate_payouts")
                .update({
                    status: 'rejected',
                    rejection_reason: reason
                })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["affiliate-payouts"] });
            queryClient.invalidateQueries({ queryKey: ["pending-payouts"] });
            queryClient.invalidateQueries({ queryKey: ["payout-stats"] });
        },
    });
};

export const useCreatePayout = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payout: Omit<AffiliatePayout, 'id' | 'created_at' | 'approved_by' | 'approved_at' | 'paid_at'>) => {
            const { data, error } = await supabase
                .from("affiliate_payouts")
                .insert(payout)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["affiliate-payouts"] });
            queryClient.invalidateQueries({ queryKey: ["pending-payouts"] });
            queryClient.invalidateQueries({ queryKey: ["payout-stats"] });
        },
    });
};
