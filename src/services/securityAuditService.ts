/**
 * Security Audit Service
 * Manages security event logging and retrieval
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export interface SecurityAuditLog {
    id: string;
    event_type: string;
    user_id?: string;
    user_email?: string;
    ip_address?: string;
    user_agent?: string;
    severity: 'info' | 'warning' | 'critical';
    details: Record<string, any>;
    created_at: string;
}

export interface SecurityLogFilters {
    severity?: string;
    event_type?: string;
    user_id?: string;
    limit?: number;
    offset?: number;
}

/**
 * Get security logs with optional filtering
 */
export async function getSecurityLogs(filters: SecurityLogFilters = {}) {
    let query = supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters.severity && filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
    }

    if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
    }

    if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
    }

    if (filters.limit) {
        query = query.limit(filters.limit);
    }

    if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as SecurityAuditLog[];
}

/**
 * Log a security event
 */
export async function logSecurityEvent(event: {
    event_type: string;
    user_id?: string;
    user_email?: string;
    ip_address?: string;
    user_agent?: string;
    severity: 'info' | 'warning' | 'critical';
    details?: Record<string, any>;
}) {
    const { data, error } = await supabase.rpc('log_security_event', {
        p_event_type: event.event_type,
        p_user_id: event.user_id || null,
        p_user_email: event.user_email || null,
        p_ip_address: event.ip_address || null,
        p_user_agent: event.user_agent || null,
        p_severity: event.severity,
        p_details: event.details || {},
    });

    if (error) throw error;
    return data;
}

/**
 * Get login attempts for a user
 */
export async function getLoginAttempts(userId: string, limit = 10) {
    const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .in('event_type', ['login_success', 'login_failed'])
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data as SecurityAuditLog[];
}

/**
 * Get security statistics
 */
export async function getSecurityStats() {
    const { data, error } = await supabase
        .from('security_audit_logs')
        .select('severity, event_type, created_at');

    if (error) throw error;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
        total: data.length,
        critical: data.filter(log => log.severity === 'critical').length,
        warning: data.filter(log => log.severity === 'warning').length,
        last24h: data.filter(log => new Date(log.created_at) > last24h).length,
        failedLogins: data.filter(log => log.event_type === 'login_failed').length,
    };

    return stats;
}
