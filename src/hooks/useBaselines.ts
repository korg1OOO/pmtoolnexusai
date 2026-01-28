import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectBaseline {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  baseline_date: string;
  created_by: string | null;
  created_at: string;
}

export interface TaskBaseline {
  id: string;
  task_id: string;
  baseline_name: string;
  baseline_start: string;
  baseline_end: string;
  baseline_duration: number;
  baseline_cost: number | null;
  created_at: string;
}

export interface TaskWithBaseline {
  id: string;
  name: string;
  wbs: string;
  type: string;
  start_date: string;
  end_date: string;
  duration: number;
  progress: number;
  is_critical: boolean | null;
  baseline?: {
    start: string;
    end: string;
    duration: number;
    cost: number | null;
  };
  variance: {
    startDays: number;
    finishDays: number;
    durationDays: number;
  };
  status: 'on-track' | 'behind' | 'ahead' | 'no-baseline';
}

/**
 * Fetch all project baselines
 */
export function useProjectBaselines(projectId: string | null) {
  return useQuery({
    queryKey: ['project-baselines', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_baselines')
        .select('*')
        .eq('project_id', projectId)
        .order('baseline_date', { ascending: false });

      if (error) throw error;
      return data as ProjectBaseline[];
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch task baselines for a specific baseline name
 */
export function useTaskBaselines(projectId: string | null, baselineName: string | null) {
  return useQuery({
    queryKey: ['task-baselines', projectId, baselineName],
    queryFn: async () => {
      if (!projectId || !baselineName) return [];
      
      // Get task IDs for this project first
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId);
      
      if (tasksError) throw tasksError;
      
      const taskIds = tasks.map(t => t.id);
      if (taskIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('task_baselines')
        .select('*')
        .in('task_id', taskIds)
        .eq('baseline_name', baselineName);

      if (error) throw error;
      return data as TaskBaseline[];
    },
    enabled: !!projectId && !!baselineName,
  });
}

/**
 * Get tasks with baseline comparison data
 */
export function useTasksWithBaseline(projectId: string | null, baselineName: string | null) {
  return useQuery({
    queryKey: ['tasks-with-baseline', projectId, baselineName],
    queryFn: async (): Promise<TaskWithBaseline[]> => {
      if (!projectId) return [];
      
      // Fetch current tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      
      if (tasksError) throw tasksError;
      if (!tasks) return [];
      
      // If no baseline selected, return tasks without baseline data
      if (!baselineName) {
        return tasks.map(task => ({
          id: task.id,
          name: task.name,
          wbs: task.wbs,
          type: task.type,
          start_date: task.start_date,
          end_date: task.end_date,
          duration: task.duration,
          progress: task.progress,
          is_critical: task.is_critical,
          variance: { startDays: 0, finishDays: 0, durationDays: 0 },
          status: 'no-baseline' as const,
        }));
      }
      
      // Fetch baselines for these tasks
      const taskIds = tasks.map(t => t.id);
      const { data: baselines, error: baselinesError } = await supabase
        .from('task_baselines')
        .select('*')
        .in('task_id', taskIds)
        .eq('baseline_name', baselineName);
      
      if (baselinesError) throw baselinesError;
      
      // Create baseline map
      const baselineMap = new Map<string, TaskBaseline>();
      for (const bl of baselines || []) {
        baselineMap.set(bl.task_id, bl);
      }
      
      // Combine data
      return tasks.map(task => {
        const bl = baselineMap.get(task.id);
        
        if (!bl) {
          return {
            id: task.id,
            name: task.name,
            wbs: task.wbs,
            type: task.type,
            start_date: task.start_date,
            end_date: task.end_date,
            duration: task.duration,
            progress: task.progress,
            is_critical: task.is_critical,
            variance: { startDays: 0, finishDays: 0, durationDays: 0 },
            status: 'no-baseline' as const,
          };
        }
        
        // Calculate variances (positive = late/over, negative = early/under)
        const currentStart = new Date(task.start_date);
        const baselineStart = new Date(bl.baseline_start);
        const currentEnd = new Date(task.end_date);
        const baselineEnd = new Date(bl.baseline_end);
        
        const startDays = Math.round((currentStart.getTime() - baselineStart.getTime()) / (1000 * 60 * 60 * 24));
        const finishDays = Math.round((currentEnd.getTime() - baselineEnd.getTime()) / (1000 * 60 * 60 * 24));
        const durationDays = task.duration - bl.baseline_duration;
        
        // Determine status
        let status: 'on-track' | 'behind' | 'ahead';
        if (finishDays > 0) {
          status = 'behind';
        } else if (finishDays < 0) {
          status = 'ahead';
        } else {
          status = 'on-track';
        }
        
        return {
          id: task.id,
          name: task.name,
          wbs: task.wbs,
          type: task.type,
          start_date: task.start_date,
          end_date: task.end_date,
          duration: task.duration,
          progress: task.progress,
          is_critical: task.is_critical,
          baseline: {
            start: bl.baseline_start,
            end: bl.baseline_end,
            duration: bl.baseline_duration,
            cost: bl.baseline_cost,
          },
          variance: { startDays, finishDays, durationDays },
          status,
        };
      });
    },
    enabled: !!projectId,
  });
}

/**
 * Delete a project baseline
 */
export function useDeleteBaseline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ baselineId, projectId }: { baselineId: string; projectId: string }) => {
      // First get the baseline name
      const { data: baseline, error: fetchError } = await supabase
        .from('project_baselines')
        .select('name')
        .eq('id', baselineId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Get all task IDs for this project
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId);
      
      if (tasks && tasks.length > 0) {
        // Delete task baselines
        await supabase
          .from('task_baselines')
          .delete()
          .in('task_id', tasks.map(t => t.id))
          .eq('baseline_name', baseline.name);
      }
      
      // Delete project baseline
      const { error } = await supabase
        .from('project_baselines')
        .delete()
        .eq('id', baselineId);
      
      if (error) throw error;
      return { projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-baselines', projectId] });
      queryClient.invalidateQueries({ queryKey: ['task-baselines', projectId] });
      toast.success('Baseline deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete baseline: ' + error.message);
    },
  });
}

/**
 * Update baseline from current values
 */
export function useUpdateBaseline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ baselineId, projectId, name }: { baselineId: string; projectId: string; name: string }) => {
      // Get current tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);
      
      if (tasksError) throw tasksError;
      
      // Delete existing task baselines
      if (tasks && tasks.length > 0) {
        await supabase
          .from('task_baselines')
          .delete()
          .in('task_id', tasks.map(t => t.id))
          .eq('baseline_name', name);
        
        // Insert new task baselines
        const taskBaselines = tasks.map(task => ({
          task_id: task.id,
          baseline_name: name,
          baseline_start: task.start_date,
          baseline_end: task.end_date,
          baseline_duration: task.duration,
          baseline_cost: task.cost || 0,
        }));
        
        const { error: insertError } = await supabase
          .from('task_baselines')
          .insert(taskBaselines);
        
        if (insertError) throw insertError;
      }
      
      // Update baseline date
      await supabase
        .from('project_baselines')
        .update({ baseline_date: new Date().toISOString().split('T')[0] })
        .eq('id', baselineId);
      
      return { projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-baselines', projectId] });
      queryClient.invalidateQueries({ queryKey: ['task-baselines', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks-with-baseline', projectId] });
      toast.success('Baseline updated with current values');
    },
    onError: (error) => {
      toast.error('Failed to update baseline: ' + error.message);
    },
  });
}
