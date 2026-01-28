import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import type { Database } from '@/integrations/supabase/types';

type TaskType = Database['public']['Enums']['task_type'];
type TaskStatus = Database['public']['Enums']['task_status'];
type PriorityLevel = Database['public']['Enums']['priority_level'];
type ConstraintType = Database['public']['Enums']['constraint_type'];

export interface DbTask {
  id: string;
  project_id: string;
  parent_id: string | null;
  wbs: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  priority: PriorityLevel;
  start_date: string;
  end_date: string;
  duration: number;
  progress: number;
  assignee_id: string | null;
  is_critical: boolean | null;
  notes: string | null;
  expanded: boolean | null;
  level: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // CPM fields (optional)
  constraint_type?: ConstraintType | null;
  constraint_date?: string | null;
  deadline?: string | null;
  work_hours?: number | null;
  actual_work_hours?: number | null;
  remaining_work_hours?: number | null;
  effort_driven?: boolean | null;
  cost?: number | null;
  actual_cost?: number | null;
  fixed_cost?: number | null;
  early_start?: string | null;
  early_finish?: string | null;
  late_start?: string | null;
  late_finish?: string | null;
  free_slack?: number | null;
  total_slack?: number | null;
}

export interface DbDependency {
  id: string;
  task_id: string;
  predecessor_id: string;
  type: Database['public']['Enums']['dependency_type'];
  lag: number;
  created_at: string;
}

export interface DbBaseline {
  id: string;
  task_id: string;
  baseline_name: string;
  baseline_start: string;
  baseline_end: string;
  baseline_duration: number;
  baseline_cost: number;
  created_at: string;
}

export function useTasks(projectId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as DbTask[];
    },
    enabled: !!projectId,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
}

export function useDependencies(projectId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dependencies', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // Get all task IDs for this project first
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId);

      if (tasksError) throw tasksError;
      
      const taskIds = tasks.map(t => t.id);
      if (taskIds.length === 0) return [];

      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .in('task_id', taskIds);

      if (error) throw error;
      return data as DbDependency[];
    },
    enabled: !!projectId,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`dependencies-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_dependencies',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dependencies', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
}

export function useBaselines(taskId: string | null) {
  return useQuery({
    queryKey: ['baselines', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from('task_baselines')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DbBaseline[];
    },
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Omit<DbTask, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] });
    },
    onError: (error) => {
      toast.error('Failed to create task: ' + error.message);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, project_id, ...updates }: Partial<DbTask> & { id: string; project_id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, project_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] });
    },
    onError: (error) => {
      toast.error('Failed to update task: ' + error.message);
    },
  });
}

export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tasks, projectId }: { tasks: Partial<DbTask>[]; projectId: string }) => {
      const updates = tasks.map(async (task) => {
        if (!task.id) return null;
        const { id, ...rest } = task;
        const { error } = await supabase
          .from('tasks')
          .update(rest)
          .eq('id', id);
        if (error) throw error;
        return task;
      });

      await Promise.all(updates);
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.projectId] });
    },
    onError: (error) => {
      toast.error('Failed to update tasks: ' + error.message);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, projectId }: { taskId: string; projectId: string }) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.projectId] });
      toast.success('Task deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete task: ' + error.message);
    },
  });
}

export function useCreateDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dependency, projectId }: { 
      dependency: Omit<DbDependency, 'id' | 'created_at'>; 
      projectId: string 
    }) => {
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert(dependency)
        .select()
        .single();

      if (error) throw error;
      return { data, projectId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['dependencies', result.projectId] });
      toast.success('Dependency created');
    },
    onError: (error) => {
      toast.error('Failed to create dependency: ' + error.message);
    },
  });
}

export function useDeleteDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dependencyId, projectId }: { dependencyId: string; projectId: string }) => {
      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dependencies', data.projectId] });
      toast.success('Dependency removed');
    },
    onError: (error) => {
      toast.error('Failed to delete dependency: ' + error.message);
    },
  });
}

export function useCreateBaseline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (baseline: Omit<DbBaseline, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('task_baselines')
        .insert(baseline)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['baselines', data.task_id] });
      toast.success('Baseline saved');
    },
    onError: (error) => {
      toast.error('Failed to save baseline: ' + error.message);
    },
  });
}

export function useSaveProjectBaseline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, name, description }: { 
      projectId: string; 
      name: string; 
      description?: string 
    }) => {
      // Get all tasks for the project
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);

      if (tasksError) throw tasksError;

      // Create project baseline record
      const { data: baseline, error: baselineError } = await supabase
        .from('project_baselines')
        .insert({ project_id: projectId, name, description })
        .select()
        .single();

      if (baselineError) throw baselineError;

      // Create task baselines for all tasks
      const taskBaselines = tasks.map(task => ({
        task_id: task.id,
        baseline_name: name,
        baseline_start: task.start_date,
        baseline_end: task.end_date,
        baseline_duration: task.duration,
        baseline_cost: 0,
      }));

      if (taskBaselines.length > 0) {
        const { error: taskBaselineError } = await supabase
          .from('task_baselines')
          .insert(taskBaselines);

        if (taskBaselineError) throw taskBaselineError;
      }

      return { projectId, baseline };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-baselines', data.projectId] });
      toast.success('Project baseline saved');
    },
    onError: (error) => {
      toast.error('Failed to save baseline: ' + error.message);
    },
  });
}
