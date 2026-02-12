/**
 * AI Usage Tracking Hooks
 * Hooks for AI usage logging, cost monitoring, and budget tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// =============================================
// TYPES
// =============================================

export interface AIUsageLog {
    id: string;
    user_id: string;
    provider: string;
    model: string;
    operation: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd: number;
    duration_ms?: number;
    success: boolean;
    error_message?: string;
    metadata?: Record<string, any>;
    created_at: string;
}

export interface AIProviderCost {
    id: string;
    provider: string;
    model: string;
    prompt_token_cost: number;
    completion_token_cost: number;
    effective_date: string;
    notes?: string;
    created_at: string;
}

export interface AIBudget {
    id: string;
    name: string;
    budget_type: string;
    target_id?: string;
    limit_usd: number;
    period: string;
    alert_threshold: number;
    start_date: string;
    end_date?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AIUsageSummary {
    provider: string;
    model: string;
    request_count: number;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_tokens: number;
    total_cost_usd: number;
    avg_duration_ms: number;
    error_count: number;
    usage_date: string;
}

export interface AICostByProvider {
    provider: string;
    request_count: number;
    total_tokens: number;
    total_cost_usd: number;
    avg_cost_per_request: number;
    unique_users: number;
}

export interface AIUsageByUser {
    user_id: string;
    email: string;
    full_name?: string;
    request_count: number;
    total_tokens: number;
    total_cost_usd: number;
    providers_used: string[];
    last_usage: string;
}

export interface BudgetStatus {
    id: string;
    name: string;
    budget_type: string;
    limit_usd: number;
    period: string;
    alert_threshold: number;
    spent_usd: number;
    remaining_usd: number;
    utilization: number;
    status: 'normal' | 'warning' | 'exceeded';
    start_date: string;
    end_date?: string;
    is_active: boolean;
}

// =============================================
// AI USAGE LOGS
// =============================================

export function useAIUsageLogs(filters?: {
    provider?: string;
    userId?: string;
    limit?: number;
    daysAgo?: number;
}) {
    return useQuery({
        queryKey: ['ai-usage-logs', filters],
        queryFn: async () => {
            let query = supabase
                .from('ai_usage_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(filters?.limit || 100);

            if (filters?.provider) {
                query = query.eq('provider', filters.provider);
            }

            if (filters?.userId) {
                query = query.eq('user_id', filters.userId);
            }

            if (filters?.daysAgo) {
                const since = new Date();
                since.setDate(since.getDate() - filters.daysAgo);
                query = query.gte('created_at', since.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as AIUsageLog[];
        },
        refetchInterval: 60000, // Refresh every minute
    });
}

export function useLogAIUsage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (usageData: {
            provider: string;
            model: string;
            operation: string;
            prompt_tokens: number;
            completion_tokens: number;
            duration_ms?: number;
            success?: boolean;
            error_message?: string;
            metadata?: Record<string, any>;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase.rpc('log_ai_usage', {
                p_user_id: user?.id,
                p_provider: usageData.provider,
                p_model: usageData.model,
                p_operation: usageData.operation,
                p_prompt_tokens: usageData.prompt_tokens,
                p_completion_tokens: usageData.completion_tokens,
                p_duration_ms: usageData.duration_ms || null,
                p_success: usageData.success ?? true,
                p_error_message: usageData.error_message || null,
                p_metadata: usageData.metadata || {},
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-usage-logs'] });
            queryClient.invalidateQueries({ queryKey: ['ai-usage-summary'] });
            queryClient.invalidateQueries({ queryKey: ['ai-cost-by-provider'] });
            queryClient.invalidateQueries({ queryKey: ['budget-status'] });
        },
    });
}

// =============================================
// USAGE ANALYTICS
// =============================================

export function useAIUsageSummary() {
    return useQuery({
        queryKey: ['ai-usage-summary'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_usage_summary')
                .select('*')
                .order('usage_date', { ascending: false });

            if (error) throw error;
            return data as AIUsageSummary[];
        },
        refetchInterval: 60000,
    });
}

export function useAICostByProvider() {
    return useQuery({
        queryKey: ['ai-cost-by-provider'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_cost_by_provider')
                .select('*');

            if (error) throw error;
            return data as AICostByProvider[];
        },
        refetchInterval: 60000,
    });
}

export function useAIUsageByUser() {
    return useQuery({
        queryKey: ['ai-usage-by-user'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_usage_by_user')
                .select('*');

            if (error) throw error;
            return data as AIUsageByUser[];
        },
        refetchInterval: 60000,
    });
}

// =============================================
// PROVIDER COSTS
// =============================================

export function useProviderCosts() {
    return useQuery({
        queryKey: ['provider-costs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_provider_costs')
                .select('*')
                .order('provider')
                .order('model');

            if (error) throw error;
            return data as AIProviderCost[];
        },
    });
}

export function useUpdateProviderCost() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (costData: {
            provider: string;
            model: string;
            prompt_token_cost: number;
            completion_token_cost: number;
            notes?: string;
        }) => {
            const { data, error } = await supabase
                .from('ai_provider_costs')
                .insert([costData])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-costs'] });
            toast({
                title: 'Pricing Updated',
                description: 'AI provider pricing updated successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// =============================================
// BUDGETS
// =============================================

export function useAIBudgets() {
    return useQuery({
        queryKey: ['ai-budgets'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_budgets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as AIBudget[];
        },
    });
}

export function useBudgetStatus() {
    return useQuery({
        queryKey: ['budget-status'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_budget_status')
                .select('*');

            if (error) throw error;
            return data as BudgetStatus[];
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

export function useCreateBudget() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (budgetData: {
            name: string;
            budget_type: string;
            target_id?: string;
            limit_usd: number;
            period: string;
            alert_threshold?: number;
            start_date: string;
            end_date?: string;
        }) => {
            const { data, error } = await supabase
                .from('ai_budgets')
                .insert([budgetData])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-budgets'] });
            queryClient.invalidateQueries({ queryKey: ['budget-status'] });
            toast({
                title: 'Budget Created',
                description: 'AI budget created successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

export function useUpdateBudget() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({
            id,
            ...updates
        }: {
            id: string;
            limit_usd?: number;
            alert_threshold?: number;
            is_active?: boolean;
        }) => {
            const { data, error } = await supabase
                .from('ai_budgets')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-budgets'] });
            queryClient.invalidateQueries({ queryKey: ['budget-status'] });
            toast({
                title: 'Budget Updated',
                description: 'AI budget updated successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// =============================================
// USER COST TRACKING
// =============================================

export function useUserMonthlyCost(userId?: string) {
    return useQuery({
        queryKey: ['user-monthly-cost', userId],
        queryFn: async () => {
            if (!userId) return 0;

            const { data, error } = await supabase.rpc('get_user_monthly_cost', {
                p_user_id: userId,
            });

            if (error) throw error;
            return data as number;
        },
        enabled: !!userId,
        refetchInterval: 60000,
    });
}
