import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Resource {
  id: string;
  project_id: string;
  name: string;
  email: string | null;
  type: 'work' | 'material' | 'cost';
  max_units: number;
  standard_rate: number;
  overtime_rate: number;
  cost_per_use: number;
  calendar_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceAssignment {
  id: string;
  task_id: string;
  resource_id: string;
  units: number;
  work_hours: number;
  actual_work_hours: number;
  remaining_work_hours: number;
  start_date: string | null;
  end_date: string | null;
  cost: number;
  actual_cost: number;
  created_at: string;
  updated_at: string;
  resource?: Resource;
}

export function useResources(projectId: string | null) {
  return useQuery({
    queryKey: ['resources', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('project_id', projectId)
        .order('name');

      if (error) throw error;
      return data as Resource[];
    },
    enabled: !!projectId,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('resources')
        .insert(resource)
        .select()
        .single();

      if (error) throw error;
      return data as Resource;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources', data.project_id] });
      toast.success('Resource created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create resource: ${error.message}`);
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Resource> & { id: string }) => {
      const { data, error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Resource;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resources', data.project_id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update resource: ${error.message}`);
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['resources', projectId] });
      toast.success('Resource deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete resource: ${error.message}`);
    },
  });
}

// Resource Assignments
export function useResourceAssignments(taskId: string | null) {
  return useQuery({
    queryKey: ['resource-assignments', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from('resource_assignments')
        .select(`
          *,
          resource:resources(*)
        `)
        .eq('task_id', taskId);

      if (error) throw error;
      return data as ResourceAssignment[];
    },
    enabled: !!taskId,
  });
}

export function useTaskResourceAssignments(projectId: string | null) {
  return useQuery({
    queryKey: ['all-resource-assignments', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // Get all tasks for the project, then get their assignments
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', projectId);

      if (tasksError) throw tasksError;

      const taskIds = tasks.map(t => t.id);
      if (taskIds.length === 0) return [];

      const { data, error } = await supabase
        .from('resource_assignments')
        .select(`
          *,
          resource:resources(*)
        `)
        .in('task_id', taskIds);

      if (error) throw error;
      return data as ResourceAssignment[];
    },
    enabled: !!projectId,
  });
}

export function useCreateResourceAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: Omit<ResourceAssignment, 'id' | 'created_at' | 'updated_at' | 'resource'>) => {
      const { data, error } = await supabase
        .from('resource_assignments')
        .insert(assignment)
        .select(`
          *,
          resource:resources(*)
        `)
        .single();

      if (error) throw error;
      return data as ResourceAssignment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resource-assignments', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['all-resource-assignments'] });
      toast.success('Resource assigned');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign resource: ${error.message}`);
    },
  });
}

export function useUpdateResourceAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ResourceAssignment> & { id: string }) => {
      const { data, error } = await supabase
        .from('resource_assignments')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          resource:resources(*)
        `)
        .single();

      if (error) throw error;
      return data as ResourceAssignment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resource-assignments', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['all-resource-assignments'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update assignment: ${error.message}`);
    },
  });
}

export function useDeleteResourceAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase
        .from('resource_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, taskId };
    },
    onSuccess: ({ taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['resource-assignments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['all-resource-assignments'] });
      toast.success('Assignment removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove assignment: ${error.message}`);
    },
  });
}
