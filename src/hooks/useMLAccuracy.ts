import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// Type Definitions
// ============================================

export interface MLTrainingData {
    id: string;
    project_id: string;
    snapshot_date: string;
    budget: number | null;
    actual_spent: number | null;
    cost_variance: number | null;
    planned_duration_days: number | null;
    actual_duration_days: number | null;
    schedule_variance_days: number | null;
    risk_count: number;
    high_risk_count: number;
    total_tasks: number;
    completed_tasks: number;
    delayed_tasks: number;
    resource_count: number;
    resource_utilization: number | null;
    project_status: string | null;
    project_health: string | null;
    methodology: string | null;
    external_factors: Record<string, any> | null;
    created_at: string;
}

export interface MLAccuracyLog {
    id: string;
    prediction_id: string | null;
    model_id: string | null;
    model_type: 'risk' | 'cost' | 'schedule';
    predicted_value: Record<string, any>;
    actual_value: Record<string, any>;
    accuracy_score: number | null;
    deviation_percent: number | null;
    is_within_threshold: boolean | null;
    notes: string | null;
    logged_at: string;
    logged_by: string | null;
}

// ============================================
// Training Data Query Hooks
// ============================================

/**
 * Fetch training data snapshots
 * @param projectId - Filter by project ID
 */
export const useTrainingData = (projectId?: string) => {
    return useQuery({
        queryKey: ["ml-training-data", projectId],
        queryFn: async (): Promise<MLTrainingData[]> => {
            try {
                let query = supabase
                    .from("ml_training_data")
                    .select("*")
                    .order("snapshot_date", { ascending: false });

                if (projectId) {
                    query = query.eq("project_id", projectId);
                }

                const { data, error } = await query;

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("ml_training_data table not available", e);
                return [];
            }
        },
    });
};

/**
 * Get training data statistics
 */
export const useTrainingDataStats = () => {
    return useQuery({
        queryKey: ["ml-training-data-stats"],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from("ml_training_data")
                    .select("*");

                if (error) throw error;

                const stats = {
                    total: data?.length || 0,
                    uniqueProjects: new Set(data?.map(d => d.project_id)).size || 0,
                    avgCostVariance: data?.filter(d => d.cost_variance != null).length
                        ? data
                            .filter(d => d.cost_variance != null)
                            .reduce((sum, d) => sum + (d.cost_variance || 0), 0) /
                        data.filter(d => d.cost_variance != null).length
                        : 0,
                    avgScheduleVariance: data?.filter(d => d.schedule_variance_days != null).length
                        ? data
                            .filter(d => d.schedule_variance_days != null)
                            .reduce((sum, d) => sum + (d.schedule_variance_days || 0), 0) /
                        data.filter(d => d.schedule_variance_days != null).length
                        : 0,
                };

                return stats;
            } catch (e) {
                console.warn("Training data stats query failed", e);
                return {
                    total: 0,
                    uniqueProjects: 0,
                    avgCostVariance: 0,
                    avgScheduleVariance: 0,
                };
            }
        },
    });
};

// ============================================
// Accuracy Log Query Hooks
// ============================================

/**
 * Fetch accuracy logs for a model
 * @param modelId - Filter by model ID
 * @param modelType - Filter by model type
 */
export const useAccuracyLogs = (
    modelId?: string,
    modelType?: 'risk' | 'cost' | 'schedule'
) => {
    return useQuery({
        queryKey: ["ml-accuracy-logs", modelId, modelType],
        queryFn: async (): Promise<MLAccuracyLog[]> => {
            try {
                let query = supabase
                    .from("ml_accuracy_logs")
                    .select("*")
                    .order("logged_at", { ascending: false });

                if (modelId) {
                    query = query.eq("model_id", modelId);
                }

                if (modelType) {
                    query = query.eq("model_type", modelType);
                }

                const { data, error } = await query;

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("ml_accuracy_logs table not available", e);
                return [];
            }
        },
    });
};

/**
 * Get accuracy statistics by model type
 * @param modelType - Model type to get stats for
 */
export const useAccuracyStats = (modelType?: 'risk' | 'cost' | 'schedule') => {
    return useQuery({
        queryKey: ["ml-accuracy-stats", modelType],
        queryFn: async () => {
            try {
                let query = supabase
                    .from("ml_accuracy_logs")
                    .select("*");

                if (modelType) {
                    query = query.eq("model_type", modelType);
                }

                const { data, error } = await query;

                if (error) throw error;

                const now = new Date();
                const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                const stats = {
                    total: data?.length || 0,
                    last30d: data?.filter(l => new Date(l.logged_at) > last30d).length || 0,
                    avgAccuracy: data?.filter(l => l.accuracy_score != null).length
                        ? data
                            .filter(l => l.accuracy_score != null)
                            .reduce((sum, l) => sum + (l.accuracy_score || 0), 0) /
                        data.filter(l => l.accuracy_score != null).length
                        : 0,
                    withinThreshold: data?.filter(l => l.is_within_threshold === true).length || 0,
                    outsideThreshold: data?.filter(l => l.is_within_threshold === false).length || 0,
                    avgDeviation: data?.filter(l => l.deviation_percent != null).length
                        ? Math.abs(
                            data
                                .filter(l => l.deviation_percent != null)
                                .reduce((sum, l) => sum + (l.deviation_percent || 0), 0) /
                            data.filter(l => l.deviation_percent != null).length
                        )
                        : 0,
                };

                return stats;
            } catch (e) {
                console.warn("Accuracy stats query failed", e);
                return {
                    total: 0,
                    last30d: 0,
                    avgAccuracy: 0,
                    withinThreshold: 0,
                    outsideThreshold: 0,
                    avgDeviation: 0,
                };
            }
        },
    });
};

/**
 * Get accuracy trend over time
 * @param modelId - Model ID to get trend for
 * @param days - Number of days to look back
 */
export const useAccuracyTrend = (modelId: string, days = 30) => {
    return useQuery({
        queryKey: ["ml-accuracy-trend", modelId, days],
        queryFn: async () => {
            try {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);

                const { data, error } = await supabase
                    .from("ml_accuracy_logs")
                    .select("logged_at, accuracy_score, deviation_percent")
                    .eq("model_id", modelId)
                    .gte("logged_at", cutoffDate.toISOString())
                    .order("logged_at", { ascending: true });

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("Accuracy trend query failed", e);
                return [];
            }
        },
        enabled: !!modelId,
    });
};

// ============================================
// Mutation Hooks
// ============================================

/**
 * Log actual vs predicted outcome for accuracy tracking
 */
export const useLogAccuracy = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (log: Omit<MLAccuracyLog, 'id' | 'logged_at'>) => {
            const { data, error } = await supabase
                .from("ml_accuracy_logs")
                .insert(log)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ml-accuracy-logs"] });
            queryClient.invalidateQueries({ queryKey: ["ml-accuracy-stats"] });
            queryClient.invalidateQueries({ queryKey: ["ml-accuracy-trend"] });
        },
    });
};
