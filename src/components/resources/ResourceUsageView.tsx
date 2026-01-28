import React, { useMemo, useState } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, BarChart3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  useResources,
  useTaskResourceAssignments,
  Resource,
  ResourceAssignment,
} from '@/hooks/useResources';
import { useTasks } from '@/hooks/useTasks';

interface ResourceUsageViewProps {
  projectId: string;
}

interface DayWorkload {
  date: Date;
  hours: number;
  maxHours: number;
  isOverallocated: boolean;
}

interface ResourceWorkload {
  resource: Resource;
  days: DayWorkload[];
  totalHours: number;
  peakUtilization: number;
}

export function ResourceUsageView({ projectId }: ResourceUsageViewProps) {
  const { data: resources = [] } = useResources(projectId);
  const { data: assignments = [] } = useTaskResourceAssignments(projectId);
  const { data: tasks = [] } = useTasks(projectId);

  const [weekOffset, setWeekOffset] = useState(0);
  const hoursPerDay = 8;

  // Calculate the current week range
  const currentWeekStart = useMemo(() => {
    const today = new Date();
    return startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 });
  }, [weekOffset]);

  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });

  // Calculate workload for each resource
  const resourceWorkloads = useMemo((): ResourceWorkload[] => {
    return resources.map((resource) => {
      const resourceAssignments = assignments.filter((a) => a.resource_id === resource.id);
      
      const days: DayWorkload[] = weekDays.map((day) => {
        // Calculate hours for this day based on task assignments
        let hoursForDay = 0;
        
        resourceAssignments.forEach((assignment) => {
          const task = tasks.find((t) => t.id === assignment.task_id);
          if (!task) return;
          
          const taskStart = parseISO(task.start_date);
          const taskEnd = parseISO(task.end_date);
          
          // Check if this day falls within the task duration
          if (day >= taskStart && day <= taskEnd && !isWeekend(day)) {
            // Calculate working days in task
            const taskDays = eachDayOfInterval({ start: taskStart, end: taskEnd })
              .filter((d) => !isWeekend(d));
            
            if (taskDays.length > 0) {
              // Distribute work hours evenly across working days
              const hoursPerTaskDay = assignment.work_hours / taskDays.length;
              hoursForDay += hoursPerTaskDay * assignment.units;
            }
          }
        });

        const maxHours = hoursPerDay * resource.max_units;
        
        return {
          date: day,
          hours: hoursForDay,
          maxHours,
          isOverallocated: hoursForDay > maxHours,
        };
      });

      const totalHours = days.reduce((sum, d) => sum + d.hours, 0);
      const peakUtilization = Math.max(...days.map((d) => d.maxHours > 0 ? d.hours / d.maxHours : 0));

      return {
        resource,
        days,
        totalHours,
        peakUtilization,
      };
    });
  }, [resources, assignments, tasks, weekDays]);

  // Find overallocated resources
  const overallocatedCount = resourceWorkloads.filter((rw) => rw.peakUtilization > 1).length;

  const getBarHeight = (hours: number, maxHours: number) => {
    if (maxHours === 0) return 0;
    return Math.min((hours / maxHours) * 100, 150); // Cap at 150% for visual
  };

  const getBarColor = (hours: number, maxHours: number) => {
    const utilization = maxHours > 0 ? hours / maxHours : 0;
    if (utilization > 1) return 'bg-destructive';
    if (utilization > 0.8) return 'bg-accent';
    if (utilization > 0) return 'bg-primary';
    return 'bg-muted';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Resource Usage</h2>
          {overallocatedCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overallocatedCount} overallocated
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {resources.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No resources defined yet.</p>
              <p className="text-sm">Add resources in the Resource Sheet to see usage.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {resourceWorkloads.map((rw) => (
                <div key={rw.resource.id} className="border rounded-lg p-4 bg-card">
                  {/* Resource Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                        {rw.resource.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{rw.resource.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(rw.resource.max_units * 100).toFixed(0)}% capacity • ${rw.resource.standard_rate}/hr
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{rw.totalHours.toFixed(1)}h</div>
                        <div className="text-xs text-muted-foreground">This week</div>
                      </div>
                      {rw.peakUtilization > 1 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {(rw.peakUtilization * 100).toFixed(0)}% peak
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Histogram */}
                  <div className="flex gap-1">
                    {rw.days.map((day, idx) => {
                      const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      const weekend = isWeekend(day.date);
                      
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'flex-1 flex flex-col items-center',
                            weekend && 'opacity-50'
                          )}
                        >
                          {/* Bar container */}
                          <div className="relative w-full h-24 flex items-end justify-center">
                            {/* 100% line */}
                            <div className="absolute left-0 right-0 bottom-[64px] border-t border-dashed border-muted-foreground/30" />
                            
                            {/* Bar */}
                            <div
                              className={cn(
                                'w-8 rounded-t transition-all',
                                getBarColor(day.hours, day.maxHours)
                              )}
                              style={{
                                height: `${getBarHeight(day.hours, day.maxHours)}%`,
                                minHeight: day.hours > 0 ? '4px' : '0',
                              }}
                            />
                          </div>
                          
                          {/* Hours label */}
                          <div className="text-xs font-mono text-muted-foreground mt-1">
                            {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '—'}
                          </div>
                          
                          {/* Day label */}
                          <div
                            className={cn(
                              'text-xs mt-1',
                              isToday ? 'font-bold text-primary' : 'text-muted-foreground'
                            )}
                          >
                            {format(day.date, 'EEE')}
                          </div>
                          <div
                            className={cn(
                              'text-xs',
                              isToday ? 'font-bold text-primary' : 'text-muted-foreground'
                            )}
                          >
                            {format(day.date, 'd')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-primary" />
                      <span>Normal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-accent" />
                      <span>&gt;80%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-destructive" />
                      <span>Overallocated</span>
                    </div>
                    <div className="ml-auto text-muted-foreground/60">
                      Dashed line = 100% capacity ({hoursPerDay * rw.resource.max_units}h/day)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
