/**
 * useRACIAssignments
 * Fetch, create and delete RACI assignments from the `raci_assignments` table.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RACIAssignment {
    id: string;
    project_id: string;
    stakeholder_id: string;
    activity: string;
    raci_role: 'R' | 'A' | 'C' | 'I' | 'R/A';
    created_at: string;
    updated_at: string;
    // joined
    stakeholder_name?: string;
}

export type RACIRole = 'R' | 'A' | 'C' | 'I' | 'R/A' | '';

const RACI_KEY = (projectId: string) => ['raci_assignments', projectId];

export function useRACIAssignments(projectId: string | null) {
    return useQuery({
        queryKey: RACI_KEY(projectId ?? ''),
        enabled: !!projectId,
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('raci_assignments')
                .select('*, stakeholders(name)')
                .eq('project_id', projectId)
                .order('activity');
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                ...row,
                stakeholder_name: row.stakeholders?.name ?? '',
            })) as RACIAssignment[];
        },
    });
}

export function useUpsertRACIAssignment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            project_id: string;
            stakeholder_id: string;
            activity: string;
            raci_role: RACIRole;
        }) => {
            if (!payload.raci_role) {
                // Empty role = delete
                const { error } = await (supabase as any)
                    .from('raci_assignments')
                    .delete()
                    .eq('project_id', payload.project_id)
                    .eq('stakeholder_id', payload.stakeholder_id)
                    .eq('activity', payload.activity);
                if (error) throw error;
                return null;
            }
            const { data, error } = await (supabase as any)
                .from('raci_assignments')
                .upsert(payload, { onConflict: 'project_id,stakeholder_id,activity' })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: RACI_KEY(variables.project_id) });
        },
        onError: (err: any) => {
            toast.error('Failed to update RACI: ' + err.message);
        },
    });
}

export function useDeleteRACIAssignment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
            const { error } = await (supabase as any)
                .from('raci_assignments')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return project_id;
        },
        onSuccess: (project_id) => {
            qc.invalidateQueries({ queryKey: RACI_KEY(project_id) });
            toast.success('RACI assignment removed');
        },
        onError: (err: any) => {
            toast.error('Failed to remove RACI: ' + err.message);
        },
    });
}

/** Derive a pivot table: activity → { stakeholder_id → role } */
export function pivotRACIData(
    assignments: RACIAssignment[],
): Record<string, Record<string, RACIRole>> {
    const pivot: Record<string, Record<string, RACIRole>> = {};
    for (const a of assignments) {
        if (!pivot[a.activity]) pivot[a.activity] = {};
        pivot[a.activity][a.stakeholder_id] = a.raci_role as RACIRole;
    }
    return pivot;
}
