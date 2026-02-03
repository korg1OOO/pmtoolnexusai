import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

export type Scenario = Tables<'scenarios'>;

export function useScenarios(projectId: string | null) {
    return useQuery({
        queryKey: ['scenarios', projectId],
        queryFn: async () => {
            let query = supabase.from('scenarios').select('*');
            if (projectId) {
                query = query.eq('project_id', projectId);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data as Scenario[];
        },
    });
}

export function useCreateScenario() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (scenario: Omit<Scenario, 'id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('scenarios')
                .insert(scenario)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scenarios'] });
            toast.success('Scenario created successfully');
        },
        onError: (error) => {
            toast.error('Failed to create scenario: ' + error.message);
        },
    });
}
