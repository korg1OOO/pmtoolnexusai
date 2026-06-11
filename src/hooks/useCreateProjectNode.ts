import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCreateProjectNode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (node: {
      mega_project_id: string;
      parent_id?: string | null;
      name: string;
      description?: string;
      type: 'module' | 'submodule';
    }) => {
      const { data, error } = await supabase
        .from('project_nodes')
        .insert([node])
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