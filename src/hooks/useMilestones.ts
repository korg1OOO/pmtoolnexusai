import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Milestone {
    id: string;
    name: string;
    project_id: string;
    status: 'completed' | 'on-track' | 'at-risk' | 'overdue';
    due_date: string;
    owner_id?: string;
    progress: number;
    dependencies?: number;
    description?: string;
    created_at?: string;
}

export const useMilestones = (projectId: string) => {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['milestones', projectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('project_milestones')
                .select('*')
                .eq('project_id', projectId)
                .order('due_date', { ascending: true });

            if (error) throw error;
            return data as Milestone[];
        },
        enabled: !!projectId,
    });

    const createMilestone = useMutation({
        mutationFn: async (newMilestone: Partial<Milestone>) => {
            const { data, error } = await supabase
                .from('project_milestones')
                .insert(newMilestone)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
        },
    });

    const updateMilestone = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Milestone> }) => {
            const { data, error } = await supabase
                .from('project_milestones')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
        },
    });

    const deleteMilestone = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('project_milestones')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
        },
    });

    return {
        data,
        isLoading,
        error,
        createMilestone,
        updateMilestone,
        deleteMilestone
    };
};
