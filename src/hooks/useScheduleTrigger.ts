import { useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScheduleResult {
  success: boolean;
  updated: number;
  projectEnd: string;
  tasks: { id: string; name: string; start: string; end: string }[];
}

/**
 * Hook to trigger auto-scheduling via edge function
 * Debounces rapid changes to avoid excessive API calls
 */
export function useScheduleTrigger(projectId: string | null) {
  const queryClient = useQueryClient();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleMutation = useMutation({
    mutationFn: async ({ 
      changedTaskId, 
      recalculateAll = false 
    }: { 
      changedTaskId?: string; 
      recalculateAll?: boolean 
    }): Promise<ScheduleResult> => {
      if (!projectId) throw new Error('No project selected');

      const { data, error } = await supabase.functions.invoke('auto-schedule', {
        body: { 
          project_id: projectId,
          changed_task_id: changedTaskId,
          recalculate_all: recalculateAll,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as ScheduleResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: (error: Error) => {
      console.error('Auto-scheduling failed:', error.message);
      // Don't show toast for every failure - can be noisy during rapid edits
    },
  });

  /**
   * Trigger auto-scheduling with debounce
   * @param changedTaskId - The ID of the task that changed (optional)
   * @param immediate - If true, skip debounce and run immediately
   */
  const triggerSchedule = useCallback((
    changedTaskId?: string,
    immediate = false
  ) => {
    if (!projectId) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const doSchedule = () => {
      scheduleMutation.mutate({ changedTaskId });
    };

    if (immediate) {
      doSchedule();
    } else {
      // Debounce by 500ms to batch rapid changes
      debounceRef.current = setTimeout(doSchedule, 500);
    }
  }, [projectId, scheduleMutation]);

  /**
   * Force a full recalculation of all tasks
   */
  const recalculateAll = useCallback(() => {
    if (!projectId) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    scheduleMutation.mutate({ recalculateAll: true });
    toast.info('Recalculating project schedule...');
  }, [projectId, scheduleMutation]);

  return {
    triggerSchedule,
    recalculateAll,
    isScheduling: scheduleMutation.isPending,
  };
}
