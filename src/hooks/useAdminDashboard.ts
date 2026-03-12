/**
 * Admin Dashboard Hook
 * Manages activity logging and system status monitoring
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { toast } from 'sonner';

export type ActivityType = 'success' | 'info' | 'warning' | 'error';
export type ServiceStatus = 'operational' | 'degraded' | 'down';

export interface ActivityLogEntry {
    id: string;
    user_id: string | null;
    user_email: string | null;
    action: string;
    action_type: ActivityType;
    metadata: Record<string, any>;
    created_at: string;
}

export interface SystemStatusEntry {
    id: string;
    service_name: string;
    status: ServiceStatus;
    uptime_percentage: number;
    last_checked: string;
    metadata: Record<string, any>;
    updated_at: string;
}

/**
 * Fetch recent admin activity
 */
export function useRecentActivity(limit = 10) {
    return useQuery({
        queryKey: ['admin-activity', limit],
        queryFn: async (): Promise<ActivityLogEntry[]> => {
            const { data, error } = await supabase
                .from('admin_activity_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        },
    });
}

/**
 * Fetch system status for all services
 */
export function useSystemStatus() {
    return useQuery({
        queryKey: ['system-status'],
        queryFn: async (): Promise<SystemStatusEntry[]> => {
            const { data, error } = await supabase
                .from('system_status')
                .select('*')
                .order('service_name', { ascending: true });

            if (error) throw error;
            return data || [];
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

/**
 * Log an activity event
 */
export function useLogActivity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {
            action: string;
            action_type: ActivityType;
            user_email?: string;
            metadata?: Record<string, any>;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('admin_activity_log')
                .insert({
                    user_id: user?.id || null,
                    user_email: input.user_email || user?.email || null,
                    action: input.action,
                    action_type: input.action_type,
                    metadata: input.metadata || {},
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-activity'] });
        },
        onError: (error: any) => {
            console.error('Failed to log activity:', error);
        },
    });
}

/**
 * Update system service status
 */
export function useUpdateServiceStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {
            service_name: string;
            status: ServiceStatus;
            uptime_percentage?: number;
            metadata?: Record<string, any>;
        }) => {
            const { data, error } = await supabase
                .from('system_status')
                .update({
                    status: input.status,
                    uptime_percentage: input.uptime_percentage,
                    metadata: input.metadata || {},
                    last_checked: new Date().toISOString(),
                })
                .eq('service_name', input.service_name)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-status'] });
            toast.success('Service status updated');
        },
        onError: (error: any) => {
            console.error('Failed to update service status:', error);
            toast.error('Failed to update service status');
        },
    });
}

/**
 * Get activity statistics
 */
export function useActivityStats() {
    return useQuery({
        queryKey: ['activity-stats'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('admin_activity_log')
                .select('action_type, created_at')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (error) throw error;

            const stats = {
                total: data?.length || 0,
                success: data?.filter(d => d.action_type === 'success').length || 0,
                error: data?.filter(d => d.action_type === 'error').length || 0,
                warning: data?.filter(d => d.action_type === 'warning').length || 0,
                info: data?.filter(d => d.action_type === 'info').length || 0,
            };

            return stats;
        },
    });
}
