/**
 * useApprovals
 * Fetches approvals from the DB and maps them to the ApprovalWorkflow type
 * that the existing ApprovalWorkflows component expects.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ApprovalWorkflow, Approver } from '@/types/analytics';

const supabaseAny = supabase as any;

const APPROVALS_KEY = (projectId?: string | null) =>
    projectId ? ['approvals', projectId] : ['approvals'];

// ─── Fetch ────────────────────────────────────────────────────
export function useApprovals(projectId?: string | null) {
    return useQuery({
        queryKey: APPROVALS_KEY(projectId),
        queryFn: async () => {
            let query = supabaseAny
                .from('approvals')
                .select('*, profiles!approvals_assignee_id_fkey(full_name, email)')
                .order('created_at', { ascending: false });
            if (projectId) query = query.eq('project_id', projectId);
            const { data, error } = await query;
            if (error) throw error;
            return (data ?? []).map(mapToWorkflow) as ApprovalWorkflow[];
        },
    });
}

// ─── Map DB row → ApprovalWorkflow ────────────────────────────
function mapToWorkflow(row: any): ApprovalWorkflow {
    const approver: Approver = {
        userId: row.assignee_id ?? 'unassigned',
        name: row.profiles?.full_name ?? 'Unassigned',
        role: 'Reviewer',
        order: 1,
        status: row.status === 'approved' ? 'approved'
            : row.status === 'rejected' ? 'rejected'
                : 'pending',
        actionDate: row.approved_at ?? row.rejected_at
            ? new Date(row.approved_at ?? row.rejected_at)
            : undefined,
        comments: row.rejection_reason ?? undefined,
    };

    return {
        id: row.id,
        title: row.title,
        type: row.type,
        status: row.status === 'delegated' ? 'pending' : row.status,
        currentApprover: approver.name,
        approvalChain: [approver],
        submittedDate: new Date(row.created_at),
        submittedBy: row.created_by ?? 'Unknown',
        completedDate: row.approved_at ?? row.rejected_at
            ? new Date(row.approved_at ?? row.rejected_at)
            : undefined,
        comments: row.rejection_reason ?? undefined,
        // Store extra metadata we need for delegation
        ...({ _raw: { id: row.id, priority: row.priority, due_date: row.due_date } } as any),
    };
}

// ─── Approve ──────────────────────────────────────────────────
export function useApproveApproval() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (approvalId: string) => {
            const { error } = await supabaseAny
                .from('approvals')
                .update({ status: 'approved', approved_at: new Date().toISOString() })
                .eq('id', approvalId);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['approvals'] });
            toast.success('Approval granted');
        },
        onError: (err: any) => toast.error('Failed to approve: ' + err.message),
    });
}

// ─── Reject ───────────────────────────────────────────────────
export function useRejectApproval() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ approvalId, reason }: { approvalId: string; reason?: string }) => {
            const { error } = await supabaseAny
                .from('approvals')
                .update({
                    status: 'rejected',
                    rejected_at: new Date().toISOString(),
                    rejection_reason: reason ?? null,
                })
                .eq('id', approvalId);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['approvals'] });
            toast.success('Approval rejected');
        },
        onError: (err: any) => toast.error('Failed to reject: ' + err.message),
    });
}

// ─── Mark delegated ───────────────────────────────────────────
export function useMarkApprovalDelegated() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (approvalId: string) => {
            const { error } = await supabaseAny
                .from('approvals')
                .update({ status: 'delegated' })
                .eq('id', approvalId);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['approvals'] });
            toast.success('Approval delegated');
        },
        onError: (err: any) => toast.error('Failed to delegate: ' + err.message),
    });
}
