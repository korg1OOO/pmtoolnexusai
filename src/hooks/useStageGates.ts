import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StageGate {
    id: string;
    project_id: string;
    name: string;
    description: string | null;
    phase: string | null;
    status: 'pending' | 'in-review' | 'approved' | 'rejected' | 'deferred';
    scheduled_date: string | null;
    actual_date: string | null;
    created_at: string;
    criteria?: GateCriteria[];
    approvers?: GateApprover[];
}

export interface GateCriteria {
    id: string;
    gate_id: string;
    description: string;
    status: 'met' | 'not-met' | 'partial' | 'na';
    evidence_link: string | null;
}

export interface GateApprover {
    id: string;
    gate_id: string;
    user_id: string;
    role: string | null;
    status: 'pending' | 'approved' | 'rejected';
    comments: string | null;
    decided_at: string | null;
    user?: {
        full_name: string | null;
        avatar_url: string | null;
        email: string | null;
    };
}

export function useStageGates(projectId: string | null) {
    const queryClient = useQueryClient();

    const { data: gates, isLoading } = useQuery({
        queryKey: ['stage-gates', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            try {
                const { data, error } = await (supabase as any)
                    .from('stage_gates')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('scheduled_date', { ascending: true });

                if (error) throw error;

                // Fetch criteria and approvers separately
                const gateIds = (data || []).map((g: any) => g.id);
                if (gateIds.length === 0) return data as StageGate[];

                const { data: criteria } = await (supabase as any)
                    .from('gate_criteria')
                    .select('*')
                    .in('gate_id', gateIds);

                const { data: approvers } = await (supabase as any)
                    .from('gate_approvers')
                    .select('*')
                    .in('gate_id', gateIds);

                return (data || []).map((g: any) => ({
                    ...g,
                    criteria: (criteria || []).filter((c: any) => c.gate_id === g.id),
                    approvers: (approvers || []).filter((a: any) => a.gate_id === g.id),
                })) as StageGate[];
            } catch (err) {
                console.warn('stage_gates table may not exist:', err);
                return [];
            }
        },
        enabled: !!projectId,
    });

    const createGate = useMutation({
        mutationFn: async (gate: Partial<StageGate>) => {
            const { data, error } = await (supabase as any)
                .from('stage_gates')
                .insert(gate as any)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stage-gates', projectId] });
            toast.success('Stage gate created');
        },
        onError: (error: any) => toast.error('Failed to create gate: ' + error.message),
    });

    const updateGateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: StageGate['status'] }) => {
            const { error } = await (supabase as any)
                .from('stage_gates')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stage-gates', projectId] });
            toast.success('Gate status updated');
        },
    });

    const approveGate = useMutation({
        mutationFn: async ({ gateId, status, comments }: { gateId: string; status: 'approved' | 'rejected'; comments?: string }) => {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not authenticated");

            const { data: existing } = await (supabase as any)
                .from('gate_approvers')
                .select('id')
                .eq('gate_id', gateId)
                .eq('user_id', user.id)
                .single();

            if (existing) {
                const { error } = await (supabase as any)
                    .from('gate_approvers')
                    .update({ status, comments, decided_at: new Date().toISOString() })
                    .eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await (supabase as any)
                    .from('gate_approvers')
                    .insert({
                        gate_id: gateId,
                        user_id: user.id,
                        status,
                        comments,
                        decided_at: new Date().toISOString()
                    });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stage-gates', projectId] });
            toast.success('Approval recorded');
        },
        onError: (error: any) => toast.error('Failed to record approval: ' + error.message),
    });

    return {
        gates,
        isLoading,
        createGate,
        updateGateStatus,
        approveGate
    };
}
