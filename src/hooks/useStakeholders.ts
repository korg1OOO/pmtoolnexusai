import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

export type Stakeholder = Tables<'stakeholders'> & { custom_fields?: Record<string, any> };

export function useStakeholders(projectId: string | null) {
    return useQuery({
        queryKey: ['stakeholders', projectId],
        queryFn: async () => {
            let query = supabase.from('stakeholders').select('*');
            if (projectId) {
                query = query.eq('project_id', projectId);
            }
            const { data, error } = await query.order('name');
            if (error) throw error;
            return data as Stakeholder[];
        },
        enabled: true, // We might want to see all stakeholders or project-specific
    });
}

export function useCreateStakeholder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (stakeholder: Omit<Stakeholder, 'id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('stakeholders')
                .insert(stakeholder)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
            toast.success('Stakeholder added successfully');
        },
        onError: (error) => {
            toast.error('Failed to add stakeholder: ' + error.message);
        },
    });
}

export function useUpdateStakeholder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Stakeholder> & { id: string }) => {
            const { data, error } = await supabase
                .from('stakeholders')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
            toast.success('Stakeholder updated successfully');
        },
        onError: (error) => {
            toast.error('Failed to update stakeholder: ' + error.message);
        },
    });
}
