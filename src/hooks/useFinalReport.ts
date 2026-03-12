import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

export type FinalReport = Tables<'final_reports'>;

export function useFinalReport(projectId: string | null) {
    return useQuery({
        queryKey: ['final_report', projectId],
        queryFn: async () => {
            if (!projectId) return null;
            const { data, error } = await supabase
                .from('final_reports')
                .select('*')
                .eq('project_id', projectId)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: !!projectId,
    });
}

export function useUpdateFinalReport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (report: Partial<FinalReport> & { project_id: string }) => {
            const { data, error } = await supabase
                .from('final_reports')
                .upsert(report)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['final_report', data.project_id] });
            toast.success('Final report updated successfully');
        },
        onError: (error) => {
            toast.error('Failed to update final report: ' + error.message);
        },
    });
}
