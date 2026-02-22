import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const supabase = _supabase as any;

export interface RequirementItem {
    id: string;
    project_id: string;
    code: string | null;
    requirement: string | null;
    description: string | null;
    process: string | null;
    module: string | null;
    department: string | null;
    owner: string | null;
    consultant: string | null;
    date: string | null;
    meeting_reference: string | null;
    status: string;
    custom_fields: Record<string, string>;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export function useRequirements(projectId: string | null) {
    return useQuery<RequirementItem[]>({
        queryKey: ['requirements', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const { data, error } = await supabase
                .from('requirement_traceability_items')
                .select('*')
                .eq('project_id', projectId)
                .order('sort_order', { ascending: true });
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!projectId,
    });
}

export function useCreateRequirement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (item: Partial<RequirementItem> & { project_id: string }) => {
            const { data, error } = await supabase
                .from('requirement_traceability_items')
                .insert({ ...item, status: item.status ?? 'Open', custom_fields: item.custom_fields ?? {} })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_d, vars) => {
            qc.invalidateQueries({ queryKey: ['requirements', vars.project_id] });
        },
        onError: (e: Error) => toast.error('Failed to create requirement: ' + e.message),
    });
}

export function useUpdateRequirement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<RequirementItem> & { id: string; project_id: string }) => {
            const { data, error } = await supabase
                .from('requirement_traceability_items')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_d, vars) => {
            qc.invalidateQueries({ queryKey: ['requirements', vars.project_id] });
        },
        onError: (e: Error) => toast.error('Failed to update: ' + e.message),
    });
}

export function useDeleteRequirement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
            const { error } = await supabase.from('requirement_traceability_items').delete().eq('id', id);
            if (error) throw error;
            return project_id;
        },
        onSuccess: (projectId) => {
            qc.invalidateQueries({ queryKey: ['requirements', projectId] });
            toast.success('Requirement deleted');
        },
        onError: (e: Error) => toast.error('Failed to delete: ' + e.message),
    });
}

export function useBulkUpsertRequirements() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, items }: { projectId: string; items: Partial<RequirementItem>[] }) => {
            const rows = items.map((item, i) => ({
                ...item,
                project_id: projectId,
                status: item.status ?? 'Open',
                custom_fields: item.custom_fields ?? {},
                sort_order: item.sort_order ?? i,
            }));
            const { data, error } = await supabase
                .from('requirement_traceability_items')
                .upsert(rows, { onConflict: 'id' })
                .select();
            if (error) throw error;
            return data;
        },
        onSuccess: (_d, vars) => {
            qc.invalidateQueries({ queryKey: ['requirements', vars.projectId] });
            toast.success('Requirements imported successfully');
        },
        onError: (e: Error) => toast.error('Import failed: ' + e.message),
    });
}
