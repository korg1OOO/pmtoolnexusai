import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type TraceabilityLink = Tables<'traceability_matrix'>;

export function useTraceabilityMatrix(projectId: string | null) {
    return useQuery({
        queryKey: ['traceability_matrix', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const { data, error } = await supabase
                .from('traceability_matrix')
                .select('*')
                .eq('project_id', projectId);
            if (error) throw error;
            return data as TraceabilityLink[];
        },
        enabled: !!projectId,
    });
}
