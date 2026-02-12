import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// Type Definitions
// ============================================

export interface MLPrediction {
    id: string;
    project_id: string;
    prediction_type: 'risk' | 'cost' | 'schedule';
    prediction_data: Record<string, any>;
    confidence_score: number;
    created_at: string;
    expires_at: string;
    created_by: string | null;
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch ML predictions for a project
 * @param projectId - Filter by project ID
 * @param predictionType - Filter by prediction type
 */
export const useMLPredictions = (
    projectId?: string,
    predictionType?: 'risk' | 'cost' | 'schedule'
) => {
    return useQuery({
        queryKey: ["ml-predictions", projectId, predictionType],
        queryFn: async (): Promise<MLPrediction[]> => {
            try {
                let query = supabase
                    .from("ml_predictions")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (projectId) {
                    query = query.eq("project_id", projectId);
                }

                if (predictionType) {
                    query = query.eq("prediction_type", predictionType);
                }

                const { data, error } = await query;

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("ml_predictions table not available", e);
                return [];
            }
        },
    });
};

/**
 * Fetch a single prediction by ID
 */
export const useMLPrediction = (id: string | undefined) => {
    return useQuery({
        queryKey: ["ml-prediction", id],
        queryFn: async (): Promise<MLPrediction | null> => {
            if (!id) return null;

            try {
                const { data, error } = await supabase
                    .from("ml_predictions")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;
                return data;
            } catch (e) {
                console.warn("ml_predictions query failed", e);
                return null;
            }
        },
        enabled: !!id,
    });
};

/**
 * Fetch recent predictions across all projects
 * @param limit - Number of recent predictions to fetch
 */
export const useRecentMLPredictions = (limit = 10) => {
    return useQuery({
        queryKey: ["ml-recent-predictions", limit],
        queryFn: async (): Promise<MLPrediction[]> => {
            try {
                const { data, error } = await supabase
                    .from("ml_predictions")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(limit);

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("Recent predictions query failed", e);
                return [];
            }
        },
    });
};

/**
 * Fetch expired predictions for cleanup
 */
export const useExpiredPredictions = () => {
    return useQuery({
        queryKey: ["ml-expired-predictions"],
        queryFn: async (): Promise<MLPrediction[]> => {
            try {
                const { data, error } = await supabase
                    .from("ml_predictions")
                    .select("*")
                    .lt("expires_at", new Date().toISOString())
                    .order("expires_at", { ascending: true });

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("Expired predictions query failed", e);
                return [];
            }
        },
    });
};

/**
 * Get prediction statistics
 */
export const usePredictionStats = () => {
    return useQuery({
        queryKey: ["ml-prediction-stats"],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from("ml_predictions")
                    .select("prediction_type, confidence_score, created_at");

                if (error) throw error;

                const now = new Date();
                const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

                const stats = {
                    total: data?.length || 0,
                    last24h: data?.filter(p => new Date(p.created_at) > last24h).length || 0,
                    last7d: data?.filter(p => new Date(p.created_at) > last7d).length || 0,
                    avgConfidence: data?.length
                        ? data.reduce((sum, p) => sum + p.confidence_score, 0) / data.length
                        : 0,
                    byType: {
                        risk: data?.filter(p => p.prediction_type === 'risk').length || 0,
                        cost: data?.filter(p => p.prediction_type === 'cost').length || 0,
                        schedule: data?.filter(p => p.prediction_type === 'schedule').length || 0,
                    }
                };

                return stats;
            } catch (e) {
                console.warn("Prediction stats query failed", e);
                return {
                    total: 0,
                    last24h: 0,
                    last7d: 0,
                    avgConfidence: 0,
                    byType: { risk: 0, cost: 0, schedule: 0 }
                };
            }
        },
    });
};
