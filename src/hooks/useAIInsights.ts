/**
 * AI Insights Hook
 * Manages AI-powered predictions, recommendations, and warnings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type InsightCategory = 'prediction' | 'recommendation' | 'warning' | 'pattern';
export type InsightTrend = 'up' | 'down' | 'neutral';

export interface AIInsight {
    id: string;
    project_id: string;
    user_id: string | null;
    category: InsightCategory;
    title: string;
    description: string;
    confidence: number;
    trend: InsightTrend | null;
    metadata: Record<string, any>;
    is_dismissed: boolean;
    dismissed_at: string | null;
    created_at: string;
    expires_at: string | null;
    updated_at: string;
}

/**
 * Fetch active AI insights for a project
 */
export function useAIInsights(projectId: string) {
    return useQuery({
        queryKey: ['ai-insights', projectId],
        queryFn: async (): Promise<AIInsight[]> => {
            const { data, error } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('project_id', projectId)
                .eq('is_dismissed', false)
                .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!projectId,
    });
}

/**
 * Get insights by category
 */
export function useInsightsByCategory(projectId: string, category: InsightCategory) {
    return useQuery({
        queryKey: ['ai-insights', projectId, category],
        queryFn: async (): Promise<AIInsight[]> => {
            const { data, error } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('project_id', projectId)
                .eq('category', category)
                .eq('is_dismissed', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!projectId,
    });
}

/**
 * Create a new AI insight
 */
export function useCreateInsight() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {
            project_id: string;
            category: InsightCategory;
            title: string;
            description: string;
            confidence: number;
            trend?: InsightTrend;
            metadata?: Record<string, any>;
            expires_at?: string;
        }) => {
            const { data, error } = await supabase
                .from('ai_insights')
                .insert({
                    project_id: input.project_id,
                    category: input.category,
                    title: input.title,
                    description: input.description,
                    confidence: input.confidence,
                    trend: input.trend || null,
                    metadata: input.metadata || {},
                    expires_at: input.expires_at || null,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ai-insights', variables.project_id] });
            toast.success('AI insight generated');
        },
        onError: (error: any) => {
            console.error('Failed to create insight:', error);
            toast.error('Failed to generate insight');
        },
    });
}

/**
 * Dismiss an insight
 */
export function useDismissInsight() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (insightId: string) => {
            const { data, error } = await supabase
                .from('ai_insights')
                .update({
                    is_dismissed: true,
                    dismissed_at: new Date().toISOString(),
                })
                .eq('id', insightId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['ai-insights', data.project_id] });
        },
        onError: (error: any) => {
            console.error('Failed to dismiss insight:', error);
            toast.error('Failed to dismiss insight');
        },
    });
}

/**
 * Get insight statistics
 */
export function useInsightStats(projectId: string) {
    return useQuery({
        queryKey: ['insight-stats', projectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_insights')
                .select('category, is_dismissed')
                .eq('project_id', projectId);

            if (error) throw error;

            const stats = {
                total: data?.length || 0,
                active: data?.filter(i => !i.is_dismissed).length || 0,
                dismissed: data?.filter(i => i.is_dismissed).length || 0,
                by_category: {
                    prediction: data?.filter(i => i.category === 'prediction' && !i.is_dismissed).length || 0,
                    recommendation: data?.filter(i => i.category === 'recommendation' && !i.is_dismissed).length || 0,
                    warning: data?.filter(i => i.category === 'warning' && !i.is_dismissed).length || 0,
                    pattern: data?.filter(i => i.category === 'pattern' && !i.is_dismissed).length || 0,
                },
            };

            return stats;
        },
        enabled: !!projectId,
    });
}
