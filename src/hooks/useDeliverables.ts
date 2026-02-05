import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Deliverable {
    id: string;
    project_id: string;
    name: string;
    description: string | null;
    phase: string | null;
    type: 'document' | 'system' | 'process' | 'training' | 'other' | null;
    status: 'not-started' | 'in-progress' | 'review' | 'approved' | 'rejected';
    owner_id: string | null;
    due_date: string | null;
    completed_date: string | null;
    progress: number;
    acceptance_criteria: { text: string; met: boolean }[];
    created_at: string;
    updated_at: string;
    owner?: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

export function useDeliverables(projectId: string | null) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['deliverables', projectId],
        queryFn: async (): Promise<(Deliverable & { owner: { full_name: string | null, avatar_url: string | null } | null })[]> => {
            if (!projectId) return [];

            try {
                const { data, error } = await (supabase as any)
                    .from('deliverables')
                    .select(`
                        *,
                        owner:owner_id(full_name, avatar_url)
                    `)
                    .eq('project_id', projectId)
                    .order('due_date', { ascending: true });

                if (error) {
                    console.warn('Deliverables table may not exist:', error);
                    return [];
                }

                // Parse acceptance_criteria if it's a string
                return (data || []).map((d: any) => ({
                    ...d,
                    acceptance_criteria: typeof d.acceptance_criteria === 'string'
                        ? JSON.parse(d.acceptance_criteria)
                        : (d.acceptance_criteria as any[] || [])
                }));
            } catch (e) {
                console.warn('Error fetching deliverables:', e);
                return [];
            }
        },
        enabled: !!projectId,
    });

    const createDeliverable = useMutation({
        mutationFn: async (newDeliverable: Partial<Deliverable>) => {
            if (!projectId) throw new Error('Project ID is required');

            const { data, error } = await (supabase as any)
                .from('deliverables')
                .insert([{ ...newDeliverable, project_id: projectId }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliverables', projectId] });
            toast.success('Deliverable created successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to create deliverable: ${error.message}`);
        },
    });

    const updateDeliverable = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Deliverable> }) => {
            const { data, error } = await (supabase as any)
                .from('deliverables')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliverables', projectId] });
            toast.success('Deliverable updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update deliverable: ${error.message}`);
        },
    });

    const deleteDeliverable = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from('deliverables')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliverables', projectId] });
            toast.success('Deliverable deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete deliverable: ${error.message}`);
        },
    });

    return {
        ...query,
        createDeliverable,
        updateDeliverable,
        deleteDeliverable,
    };
}
