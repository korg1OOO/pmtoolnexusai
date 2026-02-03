import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Layers,
  Flag,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useTasks } from '@/hooks/useTasks';
import type { Task, TaskType, TaskStatus, Priority } from '@/types/project';

type TimeScale = 'day' | 'week' | 'month' | 'quarter';

const timeScales: { value: TimeScale; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

export function GanttView() {
  const { settings } = useProjectContext();
  const projectId = settings.id;

  const { data: dbTasks = [], isLoading } = useTasks(projectId);

  const [timeScale, setTimeScale] = useState<TimeScale>('week');
  const [showBaseline, setShowBaseline] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(true);

  const taskTree = useMemo(() => {
    const taskMap = new Map<string, Task>();
    const roots: Task[] = [];

    dbTasks.forEach(t => {
      taskMap.set(t.id, {
        id: t.id,
        wbs: t.wbs,
        name: t.name,
        type: t.type as TaskType,
        status: t.status as TaskStatus,
        priority: t.priority as Priority,
        startDate: t.start_date,
        endDate: t.end_date,
        duration: t.duration,
        progress: t.progress,
        assignee: t.assignee_id || undefined,
        dependencies: [],
        isCritical: t.is_critical || false,
        level: t.level,
        expanded: t.expanded || false,
        children: [],
        baselineStart: t.baseline_start || undefined,
        baselineEnd: t.baseline_end || undefined,
      });
    });

    dbTasks.forEach(t => {
      const task = taskMap.get(t.id)!;
      if (t.parent_id && taskMap.has(t.parent_id)) {
        taskMap.get(t.parent_id)!.children!.push(task);
      } else {
        roots.push(task);
      }
    });

    return roots;
  }, [dbTasks]);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (dbTasks.length === 0) {
      const now = new Date();
      return { start: new Date(now.setDate(now.getDate() - 7)), end: new Date(now.setDate(now.getDate() + 30)) };
    }

    const allDates: Date[] = [];
    dbTasks.forEach((task) => {
      if (task.start_date) allDates.push(new Date(task.start_date));
      if (task.end_date) allDates.push(new Date(task.end_date));
    });

    if (allDates.length === 0) {
      const now = new Date();
      return { start: new Date(now.setDate(now.getDate() - 7)), end: new Date(now.setDate(now.getDate() + 30)) };
    }

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 14);

    return { start: minDate, end: maxDate };
  }, [dbTasks]);

  // Generate timeline headers
  const timelineHeaders = useMemo(() => {
    const headers: { label: string; subHeaders: string[]; width: number }[] = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      if (timeScale === 'week') {
        const month = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const weeks: string[] = [];
        const monthStart = new Date(current);

        while (current.getMonth() === monthStart.getMonth() && current <= dateRange.end) {
          weeks.push(`W${Math.ceil(current.getDate() / 7)}`);
          current.setDate(current.getDate() + 7);
        }

        headers.push({ label: month, subHeaders: weeks, width: weeks.length * 60 });
      } else if (timeScale === 'month') {
        const year = current.getFullYear().toString();
        const months: string[] = [];
        const yearStart = current.getFullYear();

        while (current.getFullYear() === yearStart && current <= dateRange.end) {
          months.push(current.toLocaleDateString('en-US', { month: 'short' }));
          current.setMonth(current.getMonth() + 1);
        }

        headers.push({ label: year, subHeaders: months, width: months.length * 80 });
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return headers;
  }, [dateRange, timeScale]);

  const totalWidth = timelineHeaders.reduce((sum, h) => sum + h.width, 0);

  // Flatten tasks for display
  const flattenTasks = (tasks: Task[], parentExpanded = true): Task[] => {
    const result: Task[] = [];
    tasks.forEach((task) => {
      if (parentExpanded) {
        result.push(task);
        if (task.children && task.children.length > 0) {
          result.push(...flattenTasks(task.children, task.expanded ?? true));
        }
      }
    });
    return result;
  };

  const visibleTasks = useMemo(() => flattenTasks(taskTree), [taskTree]);

  // Calculate bar position
  const getBarStyle = (task: Task | { startDate: string; endDate: string }) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const totalDays = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)));
    const startOffset = Math.ceil((start.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          {timeScales.map((scale) => (
            <Button
              key={scale.value}
              variant={timeScale === scale.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeScale(scale.value)}
            >
              {scale.label}
            </Button>
          ))}
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="icon">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showCriticalPath ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCriticalPath(!showCriticalPath)}
          >
            <Flag className="h-4 w-4 mr-1" />
            Critical Path
          </Button>
          <Button
            variant={showBaseline ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowBaseline(!showBaseline)}
          >
            <Layers className="h-4 w-4 mr-1" />
            Baseline
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Gantt Container */}
      <div className="flex-1 overflow-auto bg-muted/5">
        <div className="flex min-w-max h-full">
          {/* Task List Panel */}
          <div className="w-80 shrink-0 border-r bg-card sticky left-0 z-20 shadow-sm">
            {/* Header */}
            <div className="h-16 border-b bg-muted/30 flex items-end p-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Name</span>
            </div>
            {/* Task Names */}
            <div className="divide-y divide-border">
              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'h-10 border-b flex items-center px-3 hover:bg-muted/30 transition-colors',
                    task.isCritical && showCriticalPath && 'border-l-4 border-l-destructive'
                  )}
                  style={{ paddingLeft: task.level * 16 + 12 }}
                >
                  <span
                    className={cn(
                      'text-sm truncate block w-full',
                      task.type === 'summary' && 'font-bold text-foreground',
                      task.type === 'milestone' && 'italic text-purple-500 font-medium'
                    )}
                  >
                    {task.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Timeline Header */}
            <div className="h-16 border-b bg-muted/30 sticky top-0 z-10">
              {/* Primary Headers */}
              <div className="flex h-8 border-b">
                {timelineHeaders.map((header, i) => (
                  <div
                    key={i}
                    className="border-r text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/80 flex items-center justify-center bg-muted/10"
                    style={{ width: header.width }}
                  >
                    {header.label}
                  </div>
                ))}
              </div>
              {/* Sub Headers */}
              <div className="flex h-8">
                {timelineHeaders.map((header, i) =>
                  header.subHeaders.map((sub, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="border-r text-[9px] font-medium text-muted-foreground/60 text-center flex items-center justify-center"
                      style={{ width: header.width / header.subHeaders.length }}
                    >
                      {sub}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Gantt Bars Area */}
            <div className="relative flex-1" style={{ width: totalWidth }}>
              {/* Grid Lines */}
              <div className="absolute inset-y-0 left-0 flex pointer-events-none w-full h-full">
                {timelineHeaders.map((header, i) =>
                  header.subHeaders.map((_, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="border-r border-border/20 h-full"
                      style={{ width: header.width / header.subHeaders.length }}
                    />
                  ))
                )}
              </div>

              {/* Task Bars Layer */}
              <div className="divide-y divide-border">
                {visibleTasks.length > 0 ? (
                  visibleTasks.map((task) => {
                    const barStyle = getBarStyle(task);
                    return (
                      <div key={task.id} className="h-10 relative group">
                        {/* Baseline Bar */}
                        {showBaseline && task.baselineStart && (
                          <div
                            className="absolute top-1 h-1.5 bg-muted-foreground/20 rounded-full opacity-60 z-0"
                            style={getBarStyle({
                              startDate: task.baselineStart,
                              endDate: task.baselineEnd || task.endDate,
                            })}
                          />
                        )}

                        {/* Main Bar */}
                        {task.type === 'milestone' ? (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-45 bg-purple-500 border-2 border-purple-200 shadow-sm z-10"
                            style={{ left: barStyle.left, marginLeft: -7 }}
                            title={`${task.name}: ${new Date(task.startDate).toLocaleDateString()}`}
                          />
                        ) : task.type === 'summary' ? (
                          <div
                            className="absolute top-3.5 h-3 flex items-center z-10"
                            style={barStyle}
                          >
                            <div className="w-full h-1.5 bg-foreground rounded-full relative">
                              <div className="absolute left-0 -top-1 w-0.5 h-3.5 bg-foreground" />
                              <div className="absolute right-0 -top-1 w-0.5 h-3.5 bg-foreground" />
                            </div>
                          </div>
                        ) : (
                          <div
                            className={cn(
                              'absolute top-2.5 h-5 rounded flex items-center overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md z-10',
                              task.isCritical && showCriticalPath ? 'bg-destructive shadow-sm' : 'bg-primary/90'
                            )}
                            style={barStyle}
                          >
                            {/* Progress Fill */}
                            <div
                              className={cn(
                                'absolute inset-y-0 left-0',
                                task.isCritical && showCriticalPath
                                  ? 'bg-destructive-foreground/20'
                                  : 'bg-primary-foreground/30'
                              )}
                              style={{ width: `${task.progress}%` }}
                            />
                            {/* Label */}
                            <span className="relative z-10 px-2 text-[10px] font-bold text-white truncate drop-shadow-sm">
                              {task.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center p-20 text-muted-foreground italic w-full">
                    No active tasks to display in timeline
                  </div>
                )}
              </div>

              {/* Today Line */}
              <div
                className="absolute top-0 bottom-0 w-[1.5px] bg-red-500 z-30 pointer-events-none"
                style={{
                  left: `${((new Date().getTime() - dateRange.start.getTime()) /
                      (dateRange.end.getTime() - dateRange.start.getTime())) *
                    100
                    }%`,
                }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-1 rounded shadow-sm">
                  NOW
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between p-3 border-t bg-muted/10 text-xs text-muted-foreground">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-2.5 bg-primary rounded-sm" />
            <span className="font-medium">Task</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-1.5 bg-foreground rounded-sm" />
            <span className="font-medium">Summary</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-purple-500" />
            <span className="font-medium">Milestone</span>
          </div>
          {showCriticalPath && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-2.5 bg-destructive rounded-sm" />
              <span className="font-medium text-destructive">Critical Path</span>
            </div>
          )}
          {showBaseline && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-1.5 bg-muted-foreground/30 rounded-sm" />
              <span className="font-medium">Baseline</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 font-medium bg-muted/20 px-3 py-1 rounded-full border border-border/50">
          <Calendar className="h-3 w-3 text-primary" />
          <span className="font-mono text-[10px]">
            {dateRange.start.toLocaleDateString()} — {dateRange.end.toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
