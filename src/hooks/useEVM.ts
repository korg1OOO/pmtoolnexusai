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
        queryFn: async (): Promise<EVMSnapshot[]> => {
            if (!projectId) return [];
            try {
                const { data, error } = await supabase
                    .from('project_evm_snapshots')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('snapshot_date', { ascending: true });

                if (error) throw error;
                
                // Map database fields to interface
                return (data || []).map((item: any) => ({
                    ...item,
                    as_of_date: item.snapshot_date ?? item.as_of_date ?? item.created_at,
                }));
            } catch (e) {
                console.warn('EVM fetch error:', e);
                return [];
            }
        },
        enabled: !!projectId,
    });
}
