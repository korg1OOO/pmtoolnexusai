import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DbTask, DbDependency } from './useTasks';
import type { ProjectCalendar, CalendarException, WorkingDays } from './useCalendars';

type ConstraintType = 'ASAP' | 'ALAP' | 'MSO' | 'MFO' | 'SNET' | 'SNLT' | 'FNET' | 'FNLT';
type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

interface ScheduleNode {
  task: DbTask;
  predecessors: { dep: DbDependency; node: ScheduleNode }[];
  successors: { dep: DbDependency; node: ScheduleNode }[];
  earlyStart: Date;
  earlyFinish: Date;
  lateStart: Date;
  lateFinish: Date;
  scheduledStart: Date;
  scheduledFinish: Date;
  isModified: boolean;
}

interface ScheduleResult {
  taskId: string;
  startDate: string;
  endDate: string;
  earlyStart: string;
  earlyFinish: string;
  lateStart: string;
  lateFinish: string;
  totalSlack: number;
  freeSlack: number;
  isCritical: boolean;
}

// Default calendar settings for when no calendar is provided
const defaultWorkingDays: WorkingDays = {
  mon: true, tue: true, wed: true, thu: true, fri: true,
  sat: false, sun: false
};

/**
 * Check if a date is a working day
 */
function isWorkingDay(
  date: Date,
  calendar: ProjectCalendar | null,
  exceptions: CalendarException[]
): boolean {
  const dateStr = date.toISOString().split('T')[0];
  
  // Check exceptions first
  const exception = exceptions.find(e => 
    dateStr >= e.start_date && dateStr <= e.end_date
  );
  
  if (exception) {
    return exception.exception_type === 'working';
  }
  
  // Check regular working days
  const dayNames: (keyof WorkingDays)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayOfWeek = dayNames[date.getDay()];
  const workingDays = calendar?.working_days || defaultWorkingDays;
  
  return workingDays[dayOfWeek];
}

/**
 * Add working days to a date
 */
function addWorkingDays(
  startDate: Date,
  days: number,
  calendar: ProjectCalendar | null,
  exceptions: CalendarException[]
): Date {
  if (days <= 0) return new Date(startDate);
  
  const result = new Date(startDate);
  result.setHours(0, 0, 0, 0);
  let addedDays = 0;
  
  // Start counting from the next day
  while (addedDays < days - 1) {
    result.setDate(result.getDate() + 1);
    if (isWorkingDay(result, calendar, exceptions)) {
      addedDays++;
    }
  }
  
  return result;
}

/**
 * Get the next working day (or same day if already working)
 */
function getNextWorkingDay(
  date: Date,
  calendar: ProjectCalendar | null,
  exceptions: CalendarException[]
): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  
  while (!isWorkingDay(result, calendar, exceptions)) {
    result.setDate(result.getDate() + 1);
  }
  
  return result;
}

/**
 * Calculate working days between two dates (inclusive)
 */
function calculateWorkingDaysBetween(
  startDate: Date,
  endDate: Date,
  calendar: ProjectCalendar | null,
  exceptions: CalendarException[]
): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  while (current <= end) {
    if (isWorkingDay(current, calendar, exceptions)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return Math.max(1, count);
}

/**
 * Calculate successor start date based on dependency type
 */
function calculateDependencyDate(
  predecessor: ScheduleNode,
  dependency: DbDependency,
  successorDuration: number,
  calendar: ProjectCalendar | null,
  exceptions: CalendarException[]
): Date {
  const lag = dependency.lag || 0;
  const type = dependency.type as DependencyType;
  let result: Date;
  
  switch (type) {
    case 'FS': // Finish-to-Start: successor starts after predecessor finishes
      result = new Date(predecessor.scheduledFinish);
      result.setDate(result.getDate() + 1 + lag);
      break;
      
    case 'SS': // Start-to-Start: successor starts when predecessor starts
      result = new Date(predecessor.scheduledStart);
      result.setDate(result.getDate() + lag);
      break;
      
    case 'FF': // Finish-to-Finish: successor finishes when predecessor finishes
      result = new Date(predecessor.scheduledFinish);
      result.setDate(result.getDate() + lag - successorDuration + 1);
      break;
      
    case 'SF': // Start-to-Finish: successor finishes when predecessor starts
      result = new Date(predecessor.scheduledStart);
      result.setDate(result.getDate() + lag - successorDuration + 1);
      break;
      
    default:
      result = new Date(predecessor.scheduledFinish);
      result.setDate(result.getDate() + 1);
  }
  
  // Ensure result lands on a working day
  return getNextWorkingDay(result, calendar, exceptions);
}

/**
 * Apply task constraint to calculated date
 */
function applyConstraint(
  calculatedStart: Date,
  calculatedFinish: Date,
  task: DbTask,
  calendar: ProjectCalendar | null,
  exceptions: CalendarException[]
): { start: Date; finish: Date } {
  const constraintType = (task.constraint_type || 'ASAP') as ConstraintType;
  const constraintDate = task.constraint_date ? new Date(task.constraint_date) : null;
  const duration = task.duration || 1;
  
  let start = new Date(calculatedStart);
  let finish = new Date(calculatedFinish);
  
  switch (constraintType) {
    case 'ASAP': // As Soon As Possible (default)
      // Use the calculated dates as-is
      break;
      
    case 'ALAP': // As Late As Possible
      // This will be handled in the backward pass
      break;
      
    case 'MSO': // Must Start On
      if (constraintDate) {
        start = getNextWorkingDay(constraintDate, calendar, exceptions);
        finish = addWorkingDays(start, duration, calendar, exceptions);
      }
      break;
      
    case 'MFO': // Must Finish On
      if (constraintDate) {
        finish = getNextWorkingDay(constraintDate, calendar, exceptions);
        // Work backwards to find start
        const tempStart = new Date(finish);
        tempStart.setDate(tempStart.getDate() - duration + 1);
        start = getNextWorkingDay(tempStart, calendar, exceptions);
      }
      break;
      
    case 'SNET': // Start No Earlier Than
      if (constraintDate && calculatedStart < constraintDate) {
        start = getNextWorkingDay(constraintDate, calendar, exceptions);
        finish = addWorkingDays(start, duration, calendar, exceptions);
      }
      break;
      
    case 'SNLT': // Start No Later Than
      if (constraintDate && calculatedStart > constraintDate) {
        start = getNextWorkingDay(constraintDate, calendar, exceptions);
        finish = addWorkingDays(start, duration, calendar, exceptions);
      }
      break;
      
    case 'FNET': // Finish No Earlier Than
      if (constraintDate && calculatedFinish < constraintDate) {
        finish = getNextWorkingDay(constraintDate, calendar, exceptions);
        const tempStart = new Date(finish);
        tempStart.setDate(tempStart.getDate() - duration + 1);
        start = getNextWorkingDay(tempStart, calendar, exceptions);
      }
      break;
      
    case 'FNLT': // Finish No Later Than
      if (constraintDate && calculatedFinish > constraintDate) {
        finish = getNextWorkingDay(constraintDate, calendar, exceptions);
        const tempStart = new Date(finish);
        tempStart.setDate(tempStart.getDate() - duration + 1);
        start = getNextWorkingDay(tempStart, calendar, exceptions);
      }
      break;
  }
  
  return { start, finish };
}

/**
 * Main auto-scheduling engine
 */
export function useAutoScheduler() {
  const queryClient = useQueryClient();
  
  const scheduleProject = useCallback(async (
    tasks: DbTask[],
    dependencies: DbDependency[],
    calendar: ProjectCalendar | null,
    exceptions: CalendarException[],
    projectId: string,
    changedTaskId?: string
  ): Promise<ScheduleResult[]> => {
    // Filter out summary tasks for scheduling
    const schedulableTasks = tasks.filter(t => t.type !== 'summary');
    
    if (schedulableTasks.length === 0) return [];
    
    // Build the task graph
    const nodeMap = new Map<string, ScheduleNode>();
    
    // Initialize nodes
    for (const task of schedulableTasks) {
      const startDate = new Date(task.start_date);
      const endDate = new Date(task.end_date);
      
      nodeMap.set(task.id, {
        task,
        predecessors: [],
        successors: [],
        earlyStart: startDate,
        earlyFinish: endDate,
        lateStart: new Date(9999, 11, 31),
        lateFinish: new Date(9999, 11, 31),
        scheduledStart: startDate,
        scheduledFinish: endDate,
        isModified: task.id === changedTaskId,
      });
    }
    
    // Build predecessor/successor relationships
    for (const dep of dependencies) {
      const taskNode = nodeMap.get(dep.task_id);
      const predNode = nodeMap.get(dep.predecessor_id);
      
      if (taskNode && predNode) {
        taskNode.predecessors.push({ dep, node: predNode });
        predNode.successors.push({ dep, node: taskNode });
      }
    }
    
    // Find start nodes (no predecessors or manual schedule)
    const startNodes = Array.from(nodeMap.values()).filter(
      n => n.predecessors.length === 0 || n.task.manually_scheduled
    );
    
    // ===== FORWARD PASS =====
    const visited = new Set<string>();
    const queue = [...startNodes];
    
    // Initialize start nodes
    for (const node of startNodes) {
      const startDate = getNextWorkingDay(
        new Date(node.task.start_date),
        calendar,
        exceptions
      );
      node.earlyStart = startDate;
      node.earlyFinish = addWorkingDays(startDate, node.task.duration, calendar, exceptions);
      node.scheduledStart = node.earlyStart;
      node.scheduledFinish = node.earlyFinish;
    }
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visited.has(current.task.id)) continue;
      
      // Check if all predecessors have been processed
      const allPredsVisited = current.predecessors.every(p => visited.has(p.node.task.id));
      if (!allPredsVisited && current.predecessors.length > 0) {
        queue.push(current);
        continue;
      }
      
      // Skip manually scheduled tasks
      if (current.task.manually_scheduled) {
        visited.add(current.task.id);
        for (const { node: succ } of current.successors) {
          if (!visited.has(succ.task.id)) queue.push(succ);
        }
        continue;
      }
      
      // Calculate early start based on predecessors
      if (current.predecessors.length > 0) {
        let maxEarlyStart = new Date(0);
        
        for (const { dep, node: pred } of current.predecessors) {
          const depDate = calculateDependencyDate(
            pred,
            dep,
            current.task.duration,
            calendar,
            exceptions
          );
          
          if (depDate > maxEarlyStart) {
            maxEarlyStart = depDate;
          }
        }
        
        current.earlyStart = maxEarlyStart;
        current.earlyFinish = addWorkingDays(
          maxEarlyStart,
          current.task.duration,
          calendar,
          exceptions
        );
        
        // Apply constraints
        const constrained = applyConstraint(
          current.earlyStart,
          current.earlyFinish,
          current.task,
          calendar,
          exceptions
        );
        
        current.scheduledStart = constrained.start;
        current.scheduledFinish = constrained.finish;
        current.isModified = true;
      }
      
      visited.add(current.task.id);
      
      // Add successors to queue
      for (const { node: succ } of current.successors) {
        if (!visited.has(succ.task.id)) {
          queue.push(succ);
        }
      }
    }
    
    // ===== BACKWARD PASS =====
    const endNodes = Array.from(nodeMap.values()).filter(n => n.successors.length === 0);
    
    // Find project end date
    let projectEnd = new Date(0);
    for (const node of nodeMap.values()) {
      if (node.scheduledFinish > projectEnd) {
        projectEnd = node.scheduledFinish;
      }
    }
    
    // Initialize end nodes
    for (const node of endNodes) {
      node.lateFinish = projectEnd;
      const tempStart = new Date(projectEnd);
      tempStart.setDate(tempStart.getDate() - node.task.duration + 1);
      node.lateStart = getNextWorkingDay(tempStart, calendar, exceptions);
    }
    
    // Process backward
    const visitedBackward = new Set<string>();
    const backwardQueue = [...endNodes];
    
    while (backwardQueue.length > 0) {
      const current = backwardQueue.shift()!;
      
      if (visitedBackward.has(current.task.id)) continue;
      
      // Check if all successors processed
      const allSuccsVisited = current.successors.every(s => visitedBackward.has(s.node.task.id));
      if (!allSuccsVisited && current.successors.length > 0) {
        backwardQueue.push(current);
        continue;
      }
      
      // Calculate late finish based on successors
      if (current.successors.length > 0) {
        let minLateStart = new Date(9999, 11, 31);
        
        for (const { dep, node: succ } of current.successors) {
          const type = dep.type as DependencyType;
          const lag = dep.lag || 0;
          let depLateFinish: Date;
          
          switch (type) {
            case 'FS':
              depLateFinish = new Date(succ.lateStart);
              depLateFinish.setDate(depLateFinish.getDate() - 1 - lag);
              break;
            case 'SS':
              depLateFinish = new Date(succ.lateStart);
              depLateFinish.setDate(depLateFinish.getDate() - lag + current.task.duration - 1);
              break;
            case 'FF':
              depLateFinish = new Date(succ.lateFinish);
              depLateFinish.setDate(depLateFinish.getDate() - lag);
              break;
            case 'SF':
              depLateFinish = new Date(succ.lateFinish);
              depLateFinish.setDate(depLateFinish.getDate() - lag);
              break;
            default:
              depLateFinish = new Date(succ.lateStart);
              depLateFinish.setDate(depLateFinish.getDate() - 1);
          }
          
          const tempStart = new Date(depLateFinish);
          tempStart.setDate(tempStart.getDate() - current.task.duration + 1);
          
          if (tempStart < minLateStart) {
            minLateStart = tempStart;
          }
        }
        
        current.lateStart = minLateStart;
        current.lateFinish = new Date(minLateStart);
        current.lateFinish.setDate(current.lateFinish.getDate() + current.task.duration - 1);
      }
      
      visitedBackward.add(current.task.id);
      
      // Add predecessors to queue
      for (const { node: pred } of current.predecessors) {
        if (!visitedBackward.has(pred.task.id)) {
          backwardQueue.push(pred);
        }
      }
    }
    
    // ===== CALCULATE RESULTS =====
    const results: ScheduleResult[] = [];
    
    for (const node of nodeMap.values()) {
      // Calculate total slack (in working days)
      const totalSlack = calculateWorkingDaysBetween(
        node.earlyStart,
        node.lateStart,
        calendar,
        exceptions
      ) - 1;
      
      // Calculate free slack
      let freeSlack = totalSlack;
      if (node.successors.length > 0) {
        let minSuccessorGap = Infinity;
        for (const { dep, node: succ } of node.successors) {
          const gap = calculateWorkingDaysBetween(
            node.scheduledFinish,
            succ.scheduledStart,
            calendar,
            exceptions
          ) - 1 - (dep.lag || 0);
          if (gap < minSuccessorGap) {
            minSuccessorGap = gap;
          }
        }
        freeSlack = Math.max(0, minSuccessorGap);
      }
      
      const isCritical = totalSlack <= 0;
      
      results.push({
        taskId: node.task.id,
        startDate: node.scheduledStart.toISOString().split('T')[0],
        endDate: node.scheduledFinish.toISOString().split('T')[0],
        earlyStart: node.earlyStart.toISOString().split('T')[0],
        earlyFinish: node.earlyFinish.toISOString().split('T')[0],
        lateStart: node.lateStart.toISOString().split('T')[0],
        lateFinish: node.lateFinish.toISOString().split('T')[0],
        totalSlack: Math.max(0, totalSlack),
        freeSlack: Math.max(0, freeSlack),
        isCritical,
      });
    }
    
    return results;
  }, []);
  
  // Mutation to apply schedule changes to database
  const applyScheduleMutation = useMutation({
    mutationFn: async ({ 
      results, 
      projectId 
    }: { 
      results: ScheduleResult[]; 
      projectId: string 
    }) => {
      const updates = results.map(async (result) => {
        const { error } = await supabase
          .from('tasks')
          .update({
            start_date: result.startDate,
            end_date: result.endDate,
            early_start: result.earlyStart,
            early_finish: result.earlyFinish,
            late_start: result.lateStart,
            late_finish: result.lateFinish,
            total_slack: result.totalSlack,
            free_slack: result.freeSlack,
            is_critical: result.isCritical,
          })
          .eq('id', result.taskId);
        
        if (error) throw error;
      });
      
      await Promise.all(updates);
      return { projectId, count: results.length };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: (error: Error) => {
      toast.error(`Auto-scheduling failed: ${error.message}`);
    },
  });
  
  return {
    scheduleProject,
    applySchedule: applyScheduleMutation.mutate,
    applyScheduleAsync: applyScheduleMutation.mutateAsync,
    isApplying: applyScheduleMutation.isPending,
  };
}

/**
 * Hook for triggering auto-schedule on task changes
 */
export function useScheduleOnChange(projectId: string | null) {
  const { scheduleProject, applyScheduleAsync } = useAutoScheduler();
  
  const triggerSchedule = useCallback(async (
    tasks: DbTask[],
    dependencies: DbDependency[],
    calendar: ProjectCalendar | null,
    exceptions: CalendarException[],
    changedTaskId?: string
  ) => {
    if (!projectId || tasks.length === 0) return;
    
    try {
      const results = await scheduleProject(
        tasks,
        dependencies,
        calendar,
        exceptions,
        projectId,
        changedTaskId
      );
      
      if (results.length > 0) {
        await applyScheduleAsync({ results, projectId });
      }
    } catch (error) {
      console.error('Auto-schedule error:', error);
    }
  }, [projectId, scheduleProject, applyScheduleAsync]);
  
  return { triggerSchedule };
}
