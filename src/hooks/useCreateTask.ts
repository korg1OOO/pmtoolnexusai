import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: {
      node_id: string;
      title: string;
      description?: string;
      assignee?: string;
      due_date?: string | null;
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }) => {
      const { data, error } = await supabase
        .from('actions')
        .insert({
          source_type: 'project_node',
          source_id: task.node_id,
          title: task.title,
          description: task.description,
          owner_name: task.assignee || 'Unassigned',
          due_date: task.due_date,
          priority: task.priority || 'medium',
          status: 'pending',
          progress: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-hierarchy'] });
    },
  });
};