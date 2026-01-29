import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DbTask } from './useTasks';
import type { Resource, ResourceAssignment } from './useResources';

interface ResourceAllocationDay {
  date: string;
  resourceId: string;
  totalUnits: number;
  tasks: { taskId: string; units: number; priority: string }[];
}

interface LevelingResult {
  leveledTasks: { taskId: string; newStart: string; newEnd: string; reason: string }[];
  resolvedConflicts: number;
}

/**
 * Get priority weight for sorting (lower = higher priority)
 */
function getPriorityWeight(priority: string): number {
  switch (priority) {
    case 'critical': return 1;
    case 'high': return 2;
    case 'medium': return 3;
    case 'low': return 4;
    default: return 5;
  }
}

/**
 * Add days to a date string, skipping weekends
 */
function addWorkingDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  let added = 0;
  
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Get all dates between start and end (inclusive), excluding weekends
 */
function getWorkingDays(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Calculate resource allocations per day
 */
function calculateDailyAllocations(
  tasks: DbTask[],
  assignments: ResourceAssignment[],
  resources: Resource[]
): Map<string, ResourceAllocationDay[]> {
  const resourceDays = new Map<string, ResourceAllocationDay[]>();
  
  // Initialize resource map
  resources.forEach(r => {
    resourceDays.set(r.id, []);
  });
  
  // Build daily allocation for each task assignment
  for (const assignment of assignments) {
    const task = tasks.find(t => t.id === assignment.task_id);
    if (!task || task.type !== 'task') continue;
    
    const resource = resources.find(r => r.id === assignment.resource_id);
    if (!resource) continue;
    
    const workingDays = getWorkingDays(task.start_date, task.end_date);
    
    for (const day of workingDays) {
      const days = resourceDays.get(resource.id) || [];
      let dayEntry = days.find(d => d.date === day);
      
      if (!dayEntry) {
        dayEntry = {
          date: day,
          resourceId: resource.id,
          totalUnits: 0,
          tasks: [],
        };
        days.push(dayEntry);
      }
      
      dayEntry.totalUnits += assignment.units;
      dayEntry.tasks.push({
        taskId: task.id,
        units: assignment.units,
        priority: task.priority,
      });
      
      resourceDays.set(resource.id, days);
    }
  }
  
  return resourceDays;
}

/**
 * Find over-allocated days for each resource
 */
function findOverAllocations(
  resourceDays: Map<string, ResourceAllocationDay[]>,
  resources: Resource[]
): Map<string, ResourceAllocationDay[]> {
  const overAllocated = new Map<string, ResourceAllocationDay[]>();
  
  for (const [resourceId, days] of resourceDays) {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) continue;
    
    const maxUnits = resource.max_units;
    const overDays = days.filter(d => d.totalUnits > maxUnits);
    
    if (overDays.length > 0) {
      overAllocated.set(resourceId, overDays.sort((a, b) => a.date.localeCompare(b.date)));
    }
  }
  
  return overAllocated;
}

/**
 * Level resources by delaying lower-priority tasks
 */
function performLeveling(
  tasks: DbTask[],
  assignments: ResourceAssignment[],
  resources: Resource[]
): LevelingResult {
  const result: LevelingResult = {
    leveledTasks: [],
    resolvedConflicts: 0,
  };
  
  // Create mutable copies of task dates
  const taskDates = new Map<string, { start: string; end: string; duration: number }>();
  tasks.forEach(t => {
    taskDates.set(t.id, { start: t.start_date, end: t.end_date, duration: t.duration });
  });
  
  // Iterate until no over-allocations remain (max 100 iterations to prevent infinite loops)
  let iterations = 0;
  const maxIterations = 100;
  
  while (iterations < maxIterations) {
    iterations++;
    
    // Recalculate allocations with current task dates
    const currentTasks = tasks.map(t => {
      const dates = taskDates.get(t.id);
      return dates ? { ...t, start_date: dates.start, end_date: dates.end } : t;
    });
    
    const resourceDays = calculateDailyAllocations(currentTasks, assignments, resources);
    const overAllocated = findOverAllocations(resourceDays, resources);
    
    if (overAllocated.size === 0) {
      break; // No more conflicts
    }
    
    // Process the first over-allocation found
    let resolved = false;
    
    for (const [resourceId, overDays] of overAllocated) {
      if (resolved) break;
      
      const resource = resources.find(r => r.id === resourceId);
      if (!resource) continue;
      
      // Get the first over-allocated day
      const overDay = overDays[0];
      
      // Sort tasks by priority (lower priority gets delayed)
      const sortedTasks = [...overDay.tasks].sort((a, b) => 
        getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
      );
      
      // Delay the lowest priority task
      const taskToDelay = sortedTasks[0];
      const task = tasks.find(t => t.id === taskToDelay.taskId);
      
      if (task) {
        const dates = taskDates.get(task.id)!;
        const newStart = addWorkingDays(dates.start, 1);
        const newEnd = addWorkingDays(dates.end, 1);
        
        taskDates.set(task.id, { start: newStart, end: newEnd, duration: dates.duration });
        
        // Check if this task was already in our results
        const existingIndex = result.leveledTasks.findIndex(lt => lt.taskId === task.id);
        if (existingIndex >= 0) {
          result.leveledTasks[existingIndex].newStart = newStart;
          result.leveledTasks[existingIndex].newEnd = newEnd;
        } else {
          result.leveledTasks.push({
            taskId: task.id,
            newStart,
            newEnd,
            reason: `Delayed due to ${resource.name} over-allocation on ${overDay.date}`,
          });
        }
        
        result.resolvedConflicts++;
        resolved = true;
      }
    }
    
    if (!resolved) {
      break; // Couldn't resolve any conflicts
    }
  }
  
  return result;
}

/**
 * Hook for resource leveling operations
 */
export function useResourceLeveling(projectId: string | null) {
  const queryClient = useQueryClient();
  
  const levelingMutation = useMutation({
    mutationFn: async ({
      tasks,
      assignments,
      resources,
    }: {
      tasks: DbTask[];
      assignments: ResourceAssignment[];
      resources: Resource[];
    }) => {
      if (!projectId) throw new Error('No project selected');
      
      const result = performLeveling(tasks, assignments, resources);
      
      if (result.leveledTasks.length === 0) {
        return { ...result, message: 'No over-allocations found' };
      }
      
      // Apply the leveling results to the database
      for (const leveled of result.leveledTasks) {
        const { error } = await supabase
          .from('tasks')
          .update({
            start_date: leveled.newStart,
            end_date: leveled.newEnd,
          })
          .eq('id', leveled.taskId);
        
        if (error) throw error;
      }
      
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      
      if (result.leveledTasks.length > 0) {
        toast.success(`Leveled ${result.leveledTasks.length} tasks, resolved ${result.resolvedConflicts} conflicts`);
      } else {
        toast.info('No over-allocations found');
      }
    },
    onError: (error: Error) => {
      toast.error(`Resource leveling failed: ${error.message}`);
    },
  });
  
  /**
   * Preview leveling without applying changes
   */
  const previewLeveling = useCallback((
    tasks: DbTask[],
    assignments: ResourceAssignment[],
    resources: Resource[]
  ): LevelingResult => {
    return performLeveling(tasks, assignments, resources);
  }, []);
  
  return {
    levelResources: levelingMutation.mutate,
    levelResourcesAsync: levelingMutation.mutateAsync,
    previewLeveling,
    isLeveling: levelingMutation.isPending,
  };
}
