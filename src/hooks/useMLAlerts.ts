import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

// ============================================
// Type Definitions
// ============================================

export interface MLAlert {
    id: string;
    model_type: 'risk' | 'cost' | 'schedule';
    alert_type: 'accuracy_drop' | 'drift_detected' | 'retrain_needed' | 'data_quality' | 'retraining_complete' | 'model_activated';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    metadata: Record<string, any> | null;
    is_acknowledged: boolean;
    acknowledged_by: string | null;
    acknowledged_at: string | null;
    created_at: string;
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch ML alerts with optional filtering
 * @param acknowledged - Filter by acknowledged status
 * @param severity - Filter by severity level
 * @param modelType - Filter by model type
 */
export const useMLAlerts = (
    acknowledged?: boolean,
    severity?: 'critical' | 'warning' | 'info',
    modelType?: 'risk' | 'cost' | 'schedule'
) => {
    return useQuery({
        queryKey: ["ml-alerts", acknowledged, severity, modelType],
        queryFn: async (): Promise<MLAlert[]> => {
            try {
                let query = supabase
                    .from("ml_alerts")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (acknowledged !== undefined) {
                    query = query.eq("is_acknowledged", acknowledged);
                }

                if (severity) {
                    query = query.eq("severity", severity);
                }

                if (modelType) {
                    query = query.eq("model_type", modelType);
                }

                const { data, error } = await query;

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("ml_alerts table not available", e);
                return [];
            }
        },
    });
};

/**
 * Fetch unacknowledged alerts (for notifications)
 */
export const useUnacknowledgedAlerts = () => {
    return useQuery({
        queryKey: ["ml-unacknowledged-alerts"],
        queryFn: async (): Promise<MLAlert[]> => {
            try {
                const { data, error } = await supabase
                    .from("ml_alerts")
                    .select("*")
                    .eq("is_acknowledged", false)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("Unacknowledged alerts query failed", e);
                return [];
            }
        },
    });
};

/**
 * Fetch critical alerts
 */
export const useCriticalAlerts = () => {
    return useQuery({
        queryKey: ["ml-critical-alerts"],
        queryFn: async (): Promise<MLAlert[]> => {
            try {
                const { data, error } = await supabase
                    .from("ml_alerts")
                    .select("*")
                    .eq("severity", "critical")
                    .eq("is_acknowledged", false)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("Critical alerts query failed", e);
                return [];
            }
        },
    });
};

/**
 * Get alert statistics
 */
export const useAlertStats = () => {
    return useQuery({
        queryKey: ["ml-alert-stats"],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from("ml_alerts")
                    .select("severity, is_acknowledged, created_at, model_type");

                if (error) throw error;

                const now = new Date();
                const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                const stats = {
                    total: data?.length || 0,
                    unacknowledged: data?.filter(a => !a.is_acknowledged).length || 0,
                    critical: data?.filter(a => a.severity === 'critical' && !a.is_acknowledged).length || 0,
                    warning: data?.filter(a => a.severity === 'warning' && !a.is_acknowledged).length || 0,
                    info: data?.filter(a => a.severity === 'info' && !a.is_acknowledged).length || 0,
                    last24h: data?.filter(a => new Date(a.created_at) > last24h).length || 0,
                    byType: {
                        risk: data?.filter(a => a.model_type === 'risk' && !a.is_acknowledged).length || 0,
                        cost: data?.filter(a => a.model_type === 'cost' && !a.is_acknowledged).length || 0,
                        schedule: data?.filter(a => a.model_type === 'schedule' && !a.is_acknowledged).length || 0,
                    }
                };

                return stats;
            } catch (e) {
                console.warn("Alert stats query failed", e);
                return {
                    total: 0,
                    unacknowledged: 0,
                    critical: 0,
                    warning: 0,
                    info: 0,
                    last24h: 0,
                    byType: { risk: 0, cost: 0, schedule: 0 }
                };
            }
        },
    });
};

// ============================================
// Real-time Subscription Hook
// ============================================

/**
 * Subscribe to new ML alerts in real-time
 * @param onNewAlert - Callback when new alert is created
 */
export const useMLAlertsRealtime = (
    onNewAlert?: (alert: MLAlert) => void
) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('ml-alerts-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ml_alerts',
                },
                (payload) => {
                    console.log('New ML alert:', payload);

                    if (onNewAlert && payload.new) {
                        onNewAlert(payload.new as MLAlert);
                    }

                    // Invalidate queries to refetch data
                    queryClient.invalidateQueries({ queryKey: ["ml-alerts"] });
                    queryClient.invalidateQueries({ queryKey: ["ml-unacknowledged-alerts"] });
                    queryClient.invalidateQueries({ queryKey: ["ml-critical-alerts"] });
                    queryClient.invalidateQueries({ queryKey: ["ml-alert-stats"] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [onNewAlert, queryClient]);
};

// ============================================
// Mutation Hooks
// ============================================

/**
 * Acknowledge an alert
 */
export const useAcknowledgeAlert = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            userId
        }: {
            id: string;
            userId: string;
        }) => {
            const { data, error } = await supabase
                .from("ml_alerts")
                .update({
                    is_acknowledged: true,
                    acknowledged_by: userId,
                    acknowledged_at: new Date().toISOString()
                })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ml-alerts"] });
            queryClient.invalidateQueries({ queryKey: ["ml-unacknowledged-alerts"] });
            queryClient.invalidateQueries({ queryKey: ["ml-critical-alerts"] });
            queryClient.invalidateQueries({ queryKey: ["ml-alert-stats"] });
        },
    });
};

/**
 * Acknowledge all alerts of a specific type or severity
 */
export const useAcknowledgeMultipleAlerts = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            userId,
            severity,
            modelType
        }: {
            userId: string;
            severity?: 'critical' | 'warning' | 'info';
            modelType?: 'risk' | 'cost' | 'schedule';
        }) => {
            let query = supabase
                .from("ml_alerts")
                .update({
                    is_acknowledged: true,
                    acknowledged_by: userId,
                    acknowledged_at: new Date().toISOString()
                })
                .eq("is_acknowledged", false);

            if (severity) {
                query = query.eq("severity", severity);
            }

            if (modelType) {
                query = query.eq("model_type", modelType);
            }

            const { data, error } = await query.select();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ml-alerts"] });
            queryClient.invalidateQueries({ queryKey: ["ml-unacknowledged-alerts"] });
            queryClient.invalidateQueries({ queryKey: ["ml-critical-alerts"] });
            queryClient.invalidateQueries({ queryKey: ["ml-alert-stats"] });
        },
    });
};
