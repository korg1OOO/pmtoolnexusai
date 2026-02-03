import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EVMSnapshot {
    id: string;
    project_id: string;
    as_of_date: string;
    pv: number;
    ev: number;
    ac: number;
    bac: number;
    spi: number;
    cpi: number;
    created_at: string;
}

export function useEVM(projectId: string | null) {
    return useQuery({
        queryKey: ['project_evm_snapshots', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const { data, error } = await supabase
                .from('project_evm_snapshots')
                .select('*')
                .eq('project_id', projectId)
                .order('as_of_date', { ascending: true });

            if (error) throw error;
            return data as EVMSnapshot[];
        },
        enabled: !!projectId,
    });
}
