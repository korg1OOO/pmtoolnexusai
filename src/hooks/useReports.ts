import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ReportType = 'status' | 'financial' | 'resource' | 'risk' | 'custom';
export type ReportCategory = 'Status' | 'Financial' | 'Resource' | 'Risk' | 'Custom';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'on-demand';

export interface Report {
    id: string;
    project_id: string;
    name: string;
    description: string | null;
    type: ReportType;
    category: ReportCategory;
    frequency: ReportFrequency | null;
    last_generated: string | null;
    next_run: string | null;
    is_scheduled: boolean;
    config: any;
    created_at: string;
    updated_at: string;
}

export function useReports(projectId: string | null) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['reports', projectId],
        queryFn: async () => {
            if (!projectId) return [];

            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('project_id', projectId)
                .order('name');

            if (error) {
                toast.error('Failed to fetch reports');
                throw error;
            }

            return data as Report[];
        },
        enabled: !!projectId,
    });

    const createReport = useMutation({
        mutationFn: async (newReport: Partial<Report>) => {
            if (!projectId) throw new Error('Project ID is required');

            const { data, error } = await supabase
                .from('reports')
                .insert([{ ...newReport, project_id: projectId }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports', projectId] });
            toast.success('Report created successfully');
        },
        onError: (error) => {
            toast.error(`Failed to create report: ${error.message}`);
        },
    });

    const updateReport = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Report> }) => {
            const { data, error } = await supabase
                .from('reports')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports', projectId] });
            toast.success('Report updated successfully');
        },
        onError: (error) => {
            toast.error(`Failed to update report: ${error.message}`);
        },
    });

    const deleteReport = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports', projectId] });
            toast.success('Report deleted successfully');
        },
        onError: (error) => {
            toast.error(`Failed to delete report: ${error.message}`);
        },
    });

    return {
        ...query,
        createReport,
        updateReport,
        deleteReport,
    };
}
