import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

export type ProjectCharter = Tables<'project_charters'>;

export function useProjectCharter(projectId: string | null) {
    return useQuery({
        queryKey: ['project_charter', projectId],
        queryFn: async () => {
            if (!projectId) return null;
            const { data, error } = await supabase
                .from('project_charters')
                .select('*')
                .eq('project_id', projectId)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: !!projectId,
    });
}

export function useUpdateProjectCharter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (charter: Partial<ProjectCharter> & { project_id: string }) => {
            const { data, error } = await supabase
                .from('project_charters')
                .upsert(charter)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['project_charter', data.project_id] });
            toast.success('Project charter updated successfully');
        },
        onError: (error) => {
            toast.error('Failed to update project charter: ' + error.message);
        },
    });
}
