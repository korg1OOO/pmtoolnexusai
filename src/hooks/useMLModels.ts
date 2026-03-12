import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as _supabase } from "@/integrations/supabase/client";
const supabase = _supabase as any;

// ============================================
// Type Definitions
// ============================================

export interface MLModel {
    id: string;
    model_type: 'risk' | 'cost' | 'schedule';
    model_version: string;
    algorithm: string;
    accuracy_metrics: Record<string, number> | null;
    training_date: string;
    training_data_size: number | null;
    hyperparameters: Record<string, any> | null;
    is_active: boolean;
    created_at: string;
    notes: string | null;
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch all ML models with optional filtering
 * @param modelType - Filter by model type (risk, cost, schedule)
 * @param activeOnly - Only return active models
 */
export const useMLModels = (
    modelType?: 'risk' | 'cost' | 'schedule',
    activeOnly = false
) => {
    return useQuery({
        queryKey: ["ml-models", modelType, activeOnly],
        queryFn: async (): Promise<MLModel[]> => {
            try {
                let query = supabase
                    .from("ml_model_metadata")
                    .select("*")
                    .order("training_date", { ascending: false });

                if (modelType) {
                    query = query.eq("model_type", modelType);
                }

                if (activeOnly) {
                    query = query.eq("is_active", true);
                }

                const { data, error } = await query;

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("ml_model_metadata table not available", e);
                return [];
            }
        },
    });
};

/**
 * Fetch a single ML model by ID
 */
export const useMLModel = (id: string | undefined) => {
    return useQuery({
        queryKey: ["ml-model", id],
        queryFn: async (): Promise<MLModel | null> => {
            if (!id) return null;

            try {
                const { data, error } = await supabase
                    .from("ml_model_metadata")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;
                return data;
            } catch (e) {
                console.warn("ml_model_metadata query failed", e);
                return null;
            }
        },
        enabled: !!id,
    });
};

/**
 * Get active model for a specific type
 */
export const useActiveModel = (modelType: 'risk' | 'cost' | 'schedule') => {
    return useQuery({
        queryKey: ["ml-active-model", modelType],
        queryFn: async (): Promise<MLModel | null> => {
            try {
                const { data, error } = await supabase
                    .from("ml_model_metadata")
                    .select("*")
                    .eq("model_type", modelType)
                    .eq("is_active", true)
                    .order("training_date", { ascending: false })
                    .limit(1)
                    .single();

                if (error) throw error;
                return data;
            } catch (e) {
                console.warn("Active model query failed", e);
                return null;
            }
        },
    });
};

/**
 * Get model accuracy statistics by type
 */
export const useModelAccuracyStats = (modelType?: 'risk' | 'cost' | 'schedule') => {
    return useQuery({
        queryKey: ["ml-accuracy-stats", modelType],
        queryFn: async () => {
            try {
                let query = supabase
                    .from("ml_model_metadata")
                    .select("model_type, accuracy_metrics, training_date, is_active");

                if (modelType) {
                    query = query.eq("model_type", modelType);
                }

                const { data, error } = await query;

                if (error) throw error;

                // Calculate aggregate statistics
                const stats = {
                    total: data?.length || 0,
                    active: data?.filter(m => m.is_active).length || 0,
                    avgAccuracy: data?.length
                        ? data.reduce((sum, m) => {
                            const acc = m.accuracy_metrics?.precision || m.accuracy_metrics?.accuracy || 0;
                            return sum + acc;
                        }, 0) / data.length
                        : 0,
                    byType: {} as Record<string, any>
                };

                return stats;
            } catch (e) {
                console.warn("Model stats query failed", e);
                return { total: 0, active: 0, avgAccuracy: 0, byType: {} };
            }
        },
    });
};

// ============================================
// Mutation Hooks
// ============================================

/**
 * Activate a specific model version (deactivates others of same type)
 */
export const useActivateModel = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, modelType }: { id: string; modelType: string }) => {
            try {
                // First, deactivate all models of this type
                await supabase
                    .from("ml_model_metadata")
                    .update({ is_active: false })
                    .eq("model_type", modelType);

                // Then activate the selected model
                const { data, error } = await supabase
                    .from("ml_model_metadata")
                    .update({ is_active: true })
                    .eq("id", id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } catch (e) {
                console.error("Failed to activate model", e);
                throw e;
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["ml-models"] });
            queryClient.invalidateQueries({ queryKey: ["ml-active-model", variables.modelType] });
            queryClient.invalidateQueries({ queryKey: ["ml-model", variables.id] });
        },
    });
};

/**
 * Deactivate a model version
 */
export const useDeactivateModel = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from("ml_model_metadata")
                .update({ is_active: false })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ml-models"] });
            queryClient.invalidateQueries({ queryKey: ["ml-active-model"] });
        },
    });
};

/**
 * Create a new model version (typically called after retraining)
 */
export const useCreateModel = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (model: Omit<MLModel, 'id' | 'created_at'>) => {
            const { data, error } = await supabase
                .from("ml_model_metadata")
                .insert(model)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ml-models"] });
            queryClient.invalidateQueries({ queryKey: ["ml-accuracy-stats"] });
        },
    });
};

/**
 * Update model notes or metadata
 */
export const useUpdateModel = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            updates
        }: {
            id: string;
            updates: Partial<Pick<MLModel, 'notes' | 'hyperparameters'>>
        }) => {
            const { data, error } = await supabase
                .from("ml_model_metadata")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["ml-model", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["ml-models"] });
        },
    });
};
