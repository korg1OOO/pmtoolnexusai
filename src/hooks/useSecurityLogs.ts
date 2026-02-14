/**
 * useSecurityLogs Hook
 * React hooks for security audit log management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSecurityLogs,
    logSecurityEvent,
    getLoginAttempts,
    getSecurityStats,
    SecurityLogFilters,
} from '@/services/securityAuditService';
import { toast } from 'sonner';

export function useSecurityLogs(filters: SecurityLogFilters = {}) {
    return useQuery({
        queryKey: ['security-logs', filters],
        queryFn: () => getSecurityLogs(filters),
    });
}

export function useLoginAttempts(userId: string, limit = 10) {
    return useQuery({
        queryKey: ['login-attempts', userId, limit],
        queryFn: () => getLoginAttempts(userId, limit),
        enabled: !!userId,
    });
}

export function useSecurityStats() {
    return useQuery({
        queryKey: ['security-stats'],
        queryFn: getSecurityStats,
    });
}

export function useLogSecurityEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logSecurityEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-logs'] });
            queryClient.invalidateQueries({ queryKey: ['security-stats'] });
        },
        onError: (error: Error) => {
            console.error('Failed to log security event:', error);
        },
    });
}
