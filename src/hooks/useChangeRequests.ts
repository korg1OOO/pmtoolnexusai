import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type ChangeRequest = Tables<'change_requests'>;
export type ChangeRequestInsert = TablesInsert<'change_requests'>;
export type ChangeRequestUpdate = TablesUpdate<'change_requests'>;

export function useChangeRequests(projectId: string | null) {
    return useQuery({
        queryKey: ['change_requests', projectId],
        queryFn: async () => {
            let query = supabase.from('change_requests').select('*');
            if (projectId) {
                query = query.eq('project_id', projectId);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data as ChangeRequest[];
        },
    });
}

export function useCreateChangeRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (cr: ChangeRequestInsert) => {
            const { data, error } = await supabase
                .from('change_requests')
                .insert(cr)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['change_requests'] });
            toast.success('Change request created successfully');
        },
        onError: (error) => {
            toast.error('Failed to create change request: ' + error.message);
        },
    });
}
export function useUpdateChangeRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: ChangeRequestUpdate & { id: string }) => {
            const { data, error } = await supabase
                .from('change_requests')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['change_requests', data.project_id] });
            toast.success('Change request updated' + (data.status ? ` to ${data.status}` : ''));
        },
        onError: (error) => {
            toast.error('Failed to update change request: ' + error.message);
        },
    });
}
