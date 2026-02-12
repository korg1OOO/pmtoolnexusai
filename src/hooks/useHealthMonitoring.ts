/**
 * Health Monitoring Hooks
 * Hooks for system metrics, service status, and performance monitoring
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// =============================================
// TYPES
// =============================================

export interface SystemMetric {
    id: string;
    metric_type: string;
    value: number;
    unit?: string;
    metadata?: Record<string, any>;
    recorded_at: string;
}

export interface ServiceStatus {
    id: string;
    service_name: string;
    status: 'healthy' | 'degraded' | 'down';
    response_time?: number;
    last_check_at: string;
    error_message?: string;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface PerformanceThreshold {
    metric_type: string;
    warning_threshold: number;
    critical_threshold: number;
    unit: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface MetricsSummary {
    metric_type: string;
    sample_count: number;
    avg_value: number;
    min_value: number;
    max_value: number;
    median_value: number;
    p95_value: number;
    p99_value: number;
    last_recorded: string;
}

export interface ThresholdViolation {
    id: string;
    metric_type: string;
    value: number;
    unit?: string;
    recorded_at: string;
    warning_threshold: number;
    critical_threshold: number;
    severity: 'normal' | 'warning' | 'critical';
    metadata?: Record<string, any>;
}

// =============================================
// SYSTEM METRICS
// =============================================

export function useSystemMetrics(filters?: {
    metricType?: string;
    limit?: number;
    hoursAgo?: number;
}) {
    return useQuery({
        queryKey: ['system-metrics', filters],
        queryFn: async () => {
            let query = supabase
                .from('system_metrics')
                .select('*')
                .order('recorded_at', { ascending: false })
                .limit(filters?.limit || 100);

            if (filters?.metricType) {
                query = query.eq('metric_type', filters.metricType);
            }

            if (filters?.hoursAgo) {
                const since = new Date();
                since.setHours(since.getHours() - filters.hoursAgo);
                query = query.gte('recorded_at', since.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as SystemMetric[];
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

export function useRecordMetric() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (metricData: {
            metric_type: string;
            value: number;
            unit?: string;
            metadata?: Record<string, any>;
        }) => {
            const { data, error } = await supabase.rpc('record_system_metric', {
                p_metric_type: metricData.metric_type,
                p_value: metricData.value,
                p_unit: metricData.unit || null,
                p_metadata: metricData.metadata || {},
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['recent-metrics-summary'] });
        },
    });
}

export function useRecentMetricsSummary() {
    return useQuery({
        queryKey: ['recent-metrics-summary'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('recent_metrics_summary')
                .select('*');

            if (error) throw error;
            return data as MetricsSummary[];
        },
        refetchInterval: 60000, // Refresh every minute
    });
}

// =============================================
// SERVICE STATUS
// =============================================

export function useServiceStatus() {
    return useQuery({
        queryKey: ['service-status'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('system_health_summary')
                .select('*');

            if (error) throw error;
            return data as ServiceStatus[];
        },
        refetchInterval: 15000, // Refresh every 15 seconds
    });
}

export function useUpdateServiceStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (statusData: {
            service_name: string;
            status: 'healthy' | 'degraded' | 'down';
            response_time?: number;
            error_message?: string;
            metadata?: Record<string, any>;
        }) => {
            const { data, error } = await supabase.rpc('update_service_status', {
                p_service_name: statusData.service_name,
                p_status: statusData.status,
                p_response_time: statusData.response_time || null,
                p_error_message: statusData.error_message || null,
                p_metadata: statusData.metadata || {},
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-status'] });
        },
    });
}

// =============================================
// PERFORMANCE THRESHOLDS
// =============================================

export function usePerformanceThresholds() {
    return useQuery({
        queryKey: ['performance-thresholds'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('performance_thresholds')
                .select('*')
                .order('metric_type');

            if (error) throw error;
            return data as PerformanceThreshold[];
        },
    });
}

export function useUpdateThreshold() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({
            metricType,
            warningThreshold,
            criticalThreshold,
        }: {
            metricType: string;
            warningThreshold?: number;
            criticalThreshold?: number;
        }) => {
            const updates: any = {};
            if (warningThreshold !== undefined) updates.warning_threshold = warningThreshold;
            if (criticalThreshold !== undefined) updates.critical_threshold = criticalThreshold;

            const { data, error } = await supabase
                .from('performance_thresholds')
                .update(updates)
                .eq('metric_type', metricType)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['performance-thresholds'] });
            toast({
                title: 'Threshold Updated',
                description: 'Performance threshold updated successfully',
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
// THRESHOLD VIOLATIONS
// =============================================

export function useThresholdViolations() {
    return useQuery({
        queryKey: ['threshold-violations'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('metric_threshold_violations')
                .select('*')
                .order('recorded_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as ThresholdViolation[];
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

// =============================================
// HEALTH CHECK UTILITIES
// =============================================

export function useCheckMetricThreshold() {
    return useMutation({
        mutationFn: async ({
            metricType,
            value,
        }: {
            metricType: string;
            value: number;
        }) => {
            const { data, error } = await supabase.rpc('check_metric_threshold', {
                p_metric_type: metricType,
                p_value: value,
            });

            if (error) throw error;
            return data as string;
        },
    });
}

// =============================================
// COMPUTED HEALTH STATUS
// =============================================

export function useOverallHealth() {
    const { data: services } = useServiceStatus();
    const { data: violations } = useThresholdViolations();

    return {
        status: computeOverallHealth(services, violations),
        services,
        violations,
    };
}

function computeOverallHealth(
    services?: ServiceStatus[],
    violations?: ThresholdViolation[]
): 'healthy' | 'degraded' | 'down' {
    if (!services) return 'healthy';

    const hasDown = services.some(s => s.status === 'down');
    const hasDegraded = services.some(s => s.status === 'degraded');
    const hasCriticalViolations = violations?.some(v => v.severity === 'critical');

    if (hasDown || hasCriticalViolations) return 'down';
    if (hasDegraded) return 'degraded';
    return 'healthy';
}
