// Approval Analytics Service
// Provides analytics data for approval workflows, delegations, and compliance

import { supabase } from '@/lib/supabase';

export interface ApprovalMetrics {
    entityId: string;
    entityType: string;
    totalApprovals: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    avgTurnaroundHours: number;
    maxTurnaroundHours: number;
    minTurnaroundHours: number;
    approvalRate: number; // calculated
}

export interface ApprovalTrend {
    date: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
}

export interface Bottleneck {
    approvalId: string;
    title: string;
    entityId: string;
    entityType: string;
    approverId: string;
    approverName?: string;
    approverEmail?: string;
    approverStatus: string;
    hoursPending: number;
    orderIndex: number;
    priority: string;
    createdAt: string;
}

export interface DelegationPattern {
    delegatorId: string;
    delegatorName?: string;
    delegateId: string;
    delegateName?: string;
    delegationType: string;
    delegationCount: number;
    activeDelegations: number;
    completedDelegations: number;
    revokedDelegations: number;
    avgDurationDays: number;
    lastDelegationDate: string;
}

export interface ApproverPerformance {
    userId: string;
    userName?: string;
    userEmail?: string;
    totalApprovals: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    avgResponseHours: number;
    entitiesServed: number;
    lastApprovalDate: string;
    approvalRate: number; // calculated
}

export interface ComplianceMetrics {
    entityId: string;
    entityType: string;
    totalChecklists: number;
    completedChecklists: number;
    avgCompletionPercent: number;
    overdueItems: number;
    totalItems: number;
    completedItems: number;
    completionRate: number; // calculated
}

export interface ApprovalAnalytics {
    metrics: ApprovalMetrics;
    trends: ApprovalTrend[];
    bottlenecks: Bottleneck[];
    delegationPatterns: DelegationPattern[];
    topApprovers: ApproverPerformance[];
    complianceMetrics: ComplianceMetrics;
}

/**
 * Get overall approval metrics for an entity
 */
export async function getApprovalMetrics(
    entityId: string,
    entityType: string
): Promise<ApprovalMetrics> {
    try {
        const { data, error } = await supabase
            .from('approval_metrics')
            .select('*')
            .eq('entity_id', entityId)
            .eq('entity_type', entityType)
            .single();

        if (error) throw error;

        if (!data) {
            // Return empty metrics if no data
            return {
                entityId,
                entityType,
                totalApprovals: 0,
                approvedCount: 0,
                rejectedCount: 0,
                pendingCount: 0,
                avgTurnaroundHours: 0,
                maxTurnaroundHours: 0,
                minTurnaroundHours: 0,
                approvalRate: 0,
            };
        }

        // Calculate approval rate
        const approvalRate = data.total_approvals > 0
            ? (data.approved_count / data.total_approvals) * 100
            : 0;

        return {
            entityId: data.entity_id,
            entityType: data.entity_type,
            totalApprovals: data.total_approvals,
            approvedCount: data.approved_count,
            rejectedCount: data.rejected_count,
            pendingCount: data.pending_count,
            avgTurnaroundHours: data.avg_turnaround_hours || 0,
            maxTurnaroundHours: data.max_turnaround_hours || 0,
            minTurnaroundHours: data.min_turnaround_hours || 0,
            approvalRate,
        };
    } catch (error) {
        console.error('Error fetching approval metrics:', error);
        throw new Error('Failed to fetch approval metrics');
    }
}

/**
 * Get approval trends over time
 */
export async function getApprovalTrends(
    entityId: string,
    entityType: string,
    days: number = 30
): Promise<ApprovalTrend[]> {
    try {
        const { data, error } = await supabase
            .from('approval_trends')
            .select('*')
            .eq('entity_id', entityId)
            .eq('entity_type', entityType)
            .order('date', { ascending: false })
            .limit(days);

        if (error) throw error;

        return (data || []).map(row => ({
            date: row.date,
            total: row.total,
            approved: row.approved,
            rejected: row.rejected,
            pending: row.pending,
        })).reverse(); // Reverse to show oldest to newest
    } catch (error) {
        console.error('Error fetching approval trends:', error);
        throw new Error('Failed to fetch approval trends');
    }
}

/**
 * Get bottleneck analysis - stuck approvals
 */
export async function getBottleneckAnalysis(
    entityId: string,
    entityType: string,
    limit: number = 10
): Promise<Bottleneck[]> {
    try {
        const { data, error } = await supabase
            .from('approval_bottlenecks')
            .select(`
        *,
        approver:user_id (
          id,
          email,
          profiles (full_name)
        )
      `)
            .eq('entity_id', entityId)
            .eq('entity_type', entityType)
            .order('hours_pending', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return (data || []).map(row => ({
            approvalId: row.approval_id,
            title: row.title,
            entityId: row.entity_id,
            entityType: row.entity_type,
            approverId: row.approver_id,
            approverName: row.approver?.profiles?.full_name || row.approver?.email,
            approverEmail: row.approver?.email,
            approverStatus: row.approver_status,
            hoursPending: row.hours_pending,
            orderIndex: row.order_index,
            priority: row.priority,
            createdAt: row.created_at,
        }));
    } catch (error) {
        console.error('Error fetching bottleneck analysis:', error);
        throw new Error('Failed to fetch bottleneck analysis');
    }
}

/**
 * Get delegation patterns
 */
export async function getDelegationPatterns(
    entityId: string,
    entityType: string
): Promise<DelegationPattern[]> {
    try {
        // First get delegations for this entity
        const { data: delegations, error: delegationsError } = await supabase
            .from('delegations')
            .select('delegator_id, delegate_id')
            .eq('entity_id', entityId)
            .eq('entity_type', entityType);

        if (delegationsError) throw delegationsError;

        if (!delegations || delegations.length === 0) {
            return [];
        }

        // Get unique user IDs
        const userIds = [...new Set([
            ...delegations.map(d => d.delegator_id),
            ...delegations.map(d => d.delegate_id),
        ])];

        // Get delegation patterns
        const { data, error } = await supabase
            .from('delegation_patterns')
            .select(`
        *,
        delegator:delegator_id (
          id,
          email,
          profiles (full_name)
        ),
        delegate:delegate_id (
          id,
          email,
          profiles (full_name)
        )
      `)
            .in('delegator_id', userIds)
            .in('delegate_id', userIds);

        if (error) throw error;

        return (data || []).map(row => ({
            delegatorId: row.delegator_id,
            delegatorName: row.delegator?.profiles?.full_name || row.delegator?.email,
            delegateId: row.delegate_id,
            delegateName: row.delegate?.profiles?.full_name || row.delegate?.email,
            delegationType: row.delegation_type,
            delegationCount: row.delegation_count,
            activeDelegations: row.active_delegations,
            completedDelegations: row.completed_delegations,
            revokedDelegations: row.revoked_delegations,
            avgDurationDays: row.avg_duration_days || 0,
            lastDelegationDate: row.last_delegation_date,
        }));
    } catch (error) {
        console.error('Error fetching delegation patterns:', error);
        throw new Error('Failed to fetch delegation patterns');
    }
}

/**
 * Get approver performance metrics
 */
export async function getApproverPerformance(
    entityId: string,
    entityType: string,
    limit: number = 10
): Promise<ApproverPerformance[]> {
    try {
        // Get approvers for this entity
        const { data: approvers, error: approversError } = await supabase
            .from('approvers')
            .select('user_id')
            .eq('approval_id', supabase
                .from('approval_workflows')
                .select('id')
                .eq('entity_id', entityId)
                .eq('entity_type', entityType)
            );

        if (approversError) throw approversError;

        if (!approvers || approvers.length === 0) {
            return [];
        }

        const userIds = [...new Set(approvers.map(a => a.user_id))];

        const { data, error } = await supabase
            .from('approver_performance')
            .select(`
        *,
        user:user_id (
          id,
          email,
          profiles (full_name)
        )
      `)
            .in('user_id', userIds)
            .order('avg_response_hours', { ascending: true })
            .limit(limit);

        if (error) throw error;

        return (data || []).map(row => {
            const approvalRate = row.total_approvals > 0
                ? (row.approved_count / row.total_approvals) * 100
                : 0;

            return {
                userId: row.user_id,
                userName: row.user?.profiles?.full_name || row.user?.email,
                userEmail: row.user?.email,
                totalApprovals: row.total_approvals,
                approvedCount: row.approved_count,
                rejectedCount: row.rejected_count,
                pendingCount: row.pending_count,
                avgResponseHours: row.avg_response_hours || 0,
                entitiesServed: row.entities_served,
                lastApprovalDate: row.last_approval_date,
                approvalRate,
            };
        });
    } catch (error) {
        console.error('Error fetching approver performance:', error);
        throw new Error('Failed to fetch approver performance');
    }
}

/**
 * Get compliance metrics
 */
export async function getComplianceMetrics(
    entityId: string,
    entityType: string
): Promise<ComplianceMetrics> {
    try {
        const { data, error } = await supabase
            .from('compliance_metrics')
            .select('*')
            .eq('entity_id', entityId)
            .eq('entity_type', entityType)
            .single();

        if (error) throw error;

        if (!data) {
            return {
                entityId,
                entityType,
                totalChecklists: 0,
                completedChecklists: 0,
                avgCompletionPercent: 0,
                overdueItems: 0,
                totalItems: 0,
                completedItems: 0,
                completionRate: 0,
            };
        }

        const completionRate = data.total_items > 0
            ? (data.completed_items / data.total_items) * 100
            : 0;

        return {
            entityId: data.entity_id,
            entityType: data.entity_type,
            totalChecklists: data.total_checklists,
            completedChecklists: data.completed_checklists,
            avgCompletionPercent: data.avg_completion_percent || 0,
            overdueItems: data.overdue_items,
            totalItems: data.total_items,
            completedItems: data.completed_items,
            completionRate,
        };
    } catch (error) {
        console.error('Error fetching compliance metrics:', error);
        throw new Error('Failed to fetch compliance metrics');
    }
}

/**
 * Get all analytics data for an entity
 */
export async function getApprovalAnalytics(
    entityId: string,
    entityType: string,
    trendDays: number = 30
): Promise<ApprovalAnalytics> {
    try {
        const [metrics, trends, bottlenecks, delegationPatterns, topApprovers, complianceMetrics] = await Promise.all([
            getApprovalMetrics(entityId, entityType),
            getApprovalTrends(entityId, entityType, trendDays),
            getBottleneckAnalysis(entityId, entityType, 10),
            getDelegationPatterns(entityId, entityType),
            getApproverPerformance(entityId, entityType, 10),
            getComplianceMetrics(entityId, entityType),
        ]);

        return {
            metrics,
            trends,
            bottlenecks,
            delegationPatterns,
            topApprovers,
            complianceMetrics,
        };
    } catch (error) {
        console.error('Error fetching approval analytics:', error);
        throw new Error('Failed to fetch approval analytics');
    }
}
