import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CriticalPathResult {
  success: boolean;
  updated: number;
  projectEnd: string;
  criticalPath: { id: string; name: string }[];
}

export function useCalculateCriticalPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string): Promise<CriticalPathResult> => {
      const { data, error } = await supabase.functions.invoke('calculate-critical-path', {
        body: { project_id: projectId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as CriticalPathResult;
    },
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast.success(`Critical path calculated: ${data.criticalPath.length} critical tasks`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to calculate critical path: ${error.message}`);
    },
  });
}

// Auto-trigger on task/dependency changes
export function useCriticalPathAutoUpdate(projectId: string | null) {
  const calculateCriticalPath = useCalculateCriticalPath();

  const triggerUpdate = async () => {
    if (!projectId) return;
    await calculateCriticalPath.mutateAsync(projectId);
  };

  return {
    triggerUpdate,
    isCalculating: calculateCriticalPath.isPending,
  };
}
