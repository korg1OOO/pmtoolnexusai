import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { type TaskWithBaseline } from '@/hooks/useBaselines';

interface TrackingGanttProps {
  tasks: TaskWithBaseline[];
  showBaseline: boolean;
}

export function TrackingGantt({ tasks, showBaseline }: TrackingGanttProps) {
  // Calculate date range
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        start: startOfWeek(today),
        end: endOfWeek(addDays(today, 30)),
      };
    }

    let minDate = new Date(tasks[0].start_date);
    let maxDate = new Date(tasks[0].end_date);

    for (const task of tasks) {
      const start = new Date(task.start_date);
      const end = new Date(task.end_date);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;

      if (task.baseline) {
        const blStart = new Date(task.baseline.start);
        const blEnd = new Date(task.baseline.end);
        if (blStart < minDate) minDate = blStart;
        if (blEnd > maxDate) maxDate = blEnd;
      }
    }

    return {
      start: startOfWeek(addDays(minDate, -7)),
      end: endOfWeek(addDays(maxDate, 7)),
    };
  }, [tasks]);

  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;
  const dayWidth = 24;

  // Generate week headers
  const weeks = useMemo(() => {
    const result: { start: Date; label: string }[] = [];
    let current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      result.push({
        start: new Date(current),
        label: format(current, 'MMM d'),
      });
      current = addDays(current, 7);
    }
    
    return result;
  }, [dateRange]);

  const getBarStyle = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startOffset = differenceInDays(start, dateRange.start);
    const duration = differenceInDays(end, start) + 1;

    return {
      left: startOffset * dayWidth,
      width: Math.max(duration * dayWidth - 2, 4),
    };
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: totalDays * dayWidth + 250 }}>
          {/* Header */}
          <div className="flex border-b bg-muted/50">
            <div className="w-[250px] flex-shrink-0 p-2 border-r font-medium text-sm">
              Task Name
            </div>
            <div className="flex-1 flex">
              {weeks.map((week, i) => (
                <div
                  key={i}
                  className="text-xs text-muted-foreground p-2 border-r"
                  style={{ width: 7 * dayWidth }}
                >
                  {week.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {tasks.map((task) => {
            const currentBar = getBarStyle(task.start_date, task.end_date);
            const baselineBar = task.baseline
              ? getBarStyle(task.baseline.start, task.baseline.end)
              : null;

            return (
              <div key={task.id} className="flex border-b hover:bg-muted/30">
                <div className="w-[250px] flex-shrink-0 p-2 border-r">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {task.wbs}
                    </span>
                    <span className={cn(
                      "text-sm truncate",
                      task.type === 'summary' && 'font-medium'
                    )}>
                      {task.name}
                    </span>
                  </div>
                </div>
                <div 
                  className="flex-1 relative"
                  style={{ height: showBaseline && task.baseline ? 40 : 32 }}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {weeks.map((_, i) => (
                      <div
                        key={i}
                        className="border-r border-dashed border-muted"
                        style={{ width: 7 * dayWidth }}
                      />
                    ))}
                  </div>

                  {/* Baseline bar (if showing) */}
                  {showBaseline && baselineBar && (
                    <div
                      className="absolute h-3 rounded-sm bg-muted-foreground/30"
                      style={{
                        left: baselineBar.left,
                        width: baselineBar.width,
                        top: 4,
                      }}
                    />
                  )}

                  {/* Current bar */}
                  <div
                    className={cn(
                      "absolute h-5 rounded-sm",
                      task.status === 'behind' && 'bg-destructive',
                      task.status === 'ahead' && 'bg-success',
                      task.status === 'on-track' && 'bg-primary',
                      task.status === 'no-baseline' && 'bg-primary',
                      task.type === 'milestone' && 'bg-gantt-milestone',
                      task.type === 'summary' && 'bg-gantt-summary',
                    )}
                    style={{
                      left: currentBar.left,
                      width: currentBar.width,
                      top: showBaseline && task.baseline ? 16 : 6,
                    }}
                  >
                    {/* Progress overlay */}
                    <div
                      className="absolute inset-y-0 left-0 bg-black/20 rounded-l-sm"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-3 border-t bg-muted/30 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded-sm bg-primary" />
          <span>On Track</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded-sm bg-success" />
          <span>Ahead</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded-sm bg-destructive" />
          <span>Behind</span>
        </div>
        {showBaseline && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm bg-muted-foreground/30" />
            <span>Baseline</span>
          </div>
        )}
      </div>
    </div>
  );
}
