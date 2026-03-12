import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface QualityItem {
    id: string;
    project_id: string;
    item_name: string;
    standard_reference: string;
    status: 'pending' | 'passed' | 'failed' | 'conditional';
    inspection_date: string;
    inspector_name: string;
    comments: string;
    custom_fields: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export function useQualityRegister(projectId: string | null) {
    return useQuery({
        queryKey: ['quality-register', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const { data, error } = await supabase
                .from('project_quality_register')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as QualityItem[];
        },
        enabled: !!projectId,
    });
}

export function useCreateQualityItem() {
    const queryClient = useQueryClient();
    const { tenant } = useAuth();

    return useMutation({
        mutationFn: async (newItem: Omit<QualityItem, 'id' | 'created_at' | 'updated_at' | 'custom_fields'> & { custom_fields?: Record<string, any> }) => {
            if (!tenant?.id) throw new Error('No tenant found');

            const { data, error } = await supabase
                .from('project_quality_register')
                .insert([{ ...newItem, tenant_id: tenant.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['quality-register', variables.project_id] });
        },
        onError: (error) => {
            console.error('Error creating quality item:', error);
            toast.error('Failed to create quality item');
        },
    });
}

export function useUpdateQualityItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, project_id, ...updates }: Partial<QualityItem> & { id: string, project_id: string }) => {
            const { data, error } = await supabase
                .from('project_quality_register')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['quality-register', variables.project_id] });
        },
        onError: (error) => {
            console.error('Error updating quality item:', error);
            toast.error('Failed to update quality item');
        },
    });
}

export function useDeleteQualityItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, project_id }: { id: string, project_id: string }) => {
            const { error } = await supabase
                .from('project_quality_register')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return id;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['quality-register', variables.project_id] });
            toast.success('Quality item deleted');
        },
        onError: (error) => {
            console.error('Error deleting quality item:', error);
            toast.error('Failed to delete quality item');
        },
    });
}
