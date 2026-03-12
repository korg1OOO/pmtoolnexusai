import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as _supabase } from "@/integrations/supabase/client";
const supabase = _supabase as any;
import { useEffect } from "react";

// ============================================
// Type Definitions
// ============================================

export interface MLRetrainingJob {
    id: string;
    model_type: 'risk' | 'cost' | 'schedule';
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at: string | null;
    completed_at: string | null;
    training_samples_count: number | null;
    new_model_id: string | null;
    accuracy_before: number | null;
    accuracy_after: number | null;
    improvement_percent: number | null;
    error_message: string | null;
    training_config: Record<string, any> | null;
    created_at: string;
    created_by: string | null;
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch all retraining jobs with optional filtering
 * @param modelType - Filter by model type
 * @param status - Filter by job status
 */
export const useRetrainingJobs = (
    modelType?: 'risk' | 'cost' | 'schedule',
    status?: 'pending' | 'running' | 'completed' | 'failed'
) => {
    return useQuery({
        queryKey: ["ml-retraining-jobs", modelType, status],
        queryFn: async (): Promise<MLRetrainingJob[]> => {
            try {
                let query = supabase
                    .from("ml_retraining_jobs")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (modelType) {
                    query = query.eq("model_type", modelType);
                }

                if (status) {
                    query = query.eq("status", status);
                }

                const { data, error } = await query;

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("ml_retraining_jobs table not available", e);
                return [];
            }
        },
    });
};

/**
 * Fetch a single retraining job by ID
 */
export const useRetrainingJob = (id: string | undefined) => {
    return useQuery({
        queryKey: ["ml-retraining-job", id],
        queryFn: async (): Promise<MLRetrainingJob | null> => {
            if (!id) return null;

            try {
                const { data, error } = await supabase
                    .from("ml_retraining_jobs")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;
                return data;
            } catch (e) {
                console.warn("ml_retraining_jobs query failed", e);
                return null;
            }
        },
        enabled: !!id,
    });
};

/**
 * Fetch active (running or pending) retraining jobs
 */
export const useActiveRetrainingJobs = () => {
    return useQuery({
        queryKey: ["ml-active-retraining-jobs"],
        queryFn: async (): Promise<MLRetrainingJob[]> => {
            try {
                const { data, error } = await supabase
                    .from("ml_retraining_jobs")
                    .select("*")
                    .in("status", ["pending", "running"])
                    .order("created_at", { ascending: false });

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("Active retraining jobs query failed", e);
                return [];
            }
        },
    });
};

/**
 * Get retraining job statistics
 */
export const useRetrainingJobStats = () => {
    return useQuery({
        queryKey: ["ml-retraining-job-stats"],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from("ml_retraining_jobs")
                    .select("status, model_type, improvement_percent, created_at");

                if (error) throw error;

                const now = new Date();
                const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                const stats = {
                    total: data?.length || 0,
                    active: data?.filter(j => j.status === 'running' || j.status === 'pending').length || 0,
                    completed: data?.filter(j => j.status === 'completed').length || 0,
                    failed: data?.filter(j => j.status === 'failed').length || 0,
                    last30d: data?.filter(j => new Date(j.created_at) > last30d).length || 0,
                    avgImprovement: data?.filter(j => j.improvement_percent != null).length
                        ? data
                            .filter(j => j.improvement_percent != null)
                            .reduce((sum, j) => sum + (j.improvement_percent || 0), 0) /
                        data.filter(j => j.improvement_percent != null).length
                        : 0,
                };

                return stats;
            } catch (e) {
                console.warn("Retraining job stats query failed", e);
                return {
                    total: 0,
                    active: 0,
                    completed: 0,
                    failed: 0,
                    last30d: 0,
                    avgImprovement: 0,
                };
            }
        },
    });
};

// ============================================
// Real-time Subscription Hook
// ============================================

/**
 * Subscribe to retraining job updates in real-time
 * @param jobId - Optional specific job ID to subscribe to
 * @param onUpdate - Callback when job is updated
 */
export const useRetrainingJobRealtime = (
    jobId?: string,
    onUpdate?: (job: MLRetrainingJob) => void
) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('ml-retraining-jobs-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ml_retraining_jobs',
                    filter: jobId ? `id=eq.${jobId}` : undefined,
                },
                (payload) => {
                    console.log('Retraining job update:', payload);

                    if (onUpdate && payload.new) {
                        onUpdate(payload.new as MLRetrainingJob);
                    }

                    // Invalidate queries to refetch data
                    queryClient.invalidateQueries({ queryKey: ["ml-retraining-jobs"] });
                    queryClient.invalidateQueries({ queryKey: ["ml-active-retraining-jobs"] });
                    queryClient.invalidateQueries({ queryKey: ["ml-retraining-job-stats"] });

                    if (jobId) {
                        queryClient.invalidateQueries({ queryKey: ["ml-retraining-job", jobId] });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [jobId, onUpdate, queryClient]);
};

// ============================================
// Mutation Hooks
// ============================================

/**
 * Trigger a new model retraining job
 * Calls the ml-retrain-model edge function
 */
export const useTriggerRetraining = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            modelType,
            trainingConfig
        }: {
            modelType: 'risk' | 'cost' | 'schedule';
            trainingConfig?: Record<string, any>;
        }) => {
            try {
                const { data, error } = await supabase.functions.invoke('ml-retrain-model', {
                    body: {
                        model_type: modelType,
                        training_config: trainingConfig
                    },
                });

                if (error) throw error;
                return data;
            } catch (e) {
                console.error("Failed to trigger retraining", e);
                throw e;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ml-retraining-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["ml-active-retraining-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["ml-retraining-job-stats"] });
        },
    });
};

/**
 * Cancel a pending retraining job
 */
export const useCancelRetrainingJob = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (jobId: string) => {
            const { data, error } = await supabase
                .from("ml_retraining_jobs")
                .update({
                    status: 'failed',
                    error_message: 'Cancelled by user',
                    completed_at: new Date().toISOString()
                })
                .eq("id", jobId)
                .eq("status", "pending") // Only cancel if still pending
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ml-retraining-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["ml-active-retraining-jobs"] });
        },
    });
};
