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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockTasks } from '@/data/mockData';
import type { Task } from '@/types/project';

type TimeScale = 'day' | 'week' | 'month' | 'quarter';

const timeScales: { value: TimeScale; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

export function GanttView() {
  const [timeScale, setTimeScale] = useState<TimeScale>('week');
  const [showBaseline, setShowBaseline] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(true);

  // Calculate date range
  const dateRange = useMemo(() => {
    const allDates: Date[] = [];
    const collectDates = (tasks: Task[]) => {
      tasks.forEach((task) => {
        allDates.push(new Date(task.startDate));
        allDates.push(new Date(task.endDate));
        if (task.children) collectDates(task.children);
      });
    };
    collectDates(mockTasks);

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 14);

    return { start: minDate, end: maxDate };
  }, []);

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
  const flattenTasks = (tasks: Task[], expanded = true): Task[] => {
    const result: Task[] = [];
    tasks.forEach((task) => {
      result.push(task);
      if (task.children && expanded) {
        result.push(...flattenTasks(task.children, task.expanded ?? true));
      }
    });
    return result;
  };

  const visibleTasks = flattenTasks(mockTasks);

  // Calculate bar position
  const getBarStyle = (task: Task) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const startOffset = Math.ceil((start.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
  };

  return (
    <div className="flex flex-col h-full">
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
          <Button variant="ghost" size="iconSm">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="iconSm">
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
      <div className="flex-1 overflow-auto">
        <div className="flex min-w-max">
          {/* Task List Panel */}
          <div className="w-80 shrink-0 border-r bg-card sticky left-0 z-10">
            {/* Header */}
            <div className="h-16 border-b bg-muted/50 flex items-end p-2">
              <span className="text-xs font-medium text-muted-foreground">Task Name</span>
            </div>
            {/* Task Names */}
            {visibleTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'h-10 border-b flex items-center px-2 hover:bg-muted/30 transition-colors',
                  task.isCritical && showCriticalPath && 'border-l-2 border-l-destructive'
                )}
                style={{ paddingLeft: task.level * 16 + 8 }}
              >
                <span
                  className={cn(
                    'text-sm truncate',
                    task.type === 'summary' && 'font-semibold',
                    task.type === 'milestone' && 'italic text-purple-400'
                  )}
                >
                  {task.name}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline Panel */}
          <div className="flex-1">
            {/* Timeline Header */}
            <div className="h-16 border-b bg-muted/50">
              {/* Primary Headers */}
              <div className="flex h-8 border-b">
                {timelineHeaders.map((header, i) => (
                  <div
                    key={i}
                    className="border-r text-xs font-medium text-center flex items-center justify-center"
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
                      className="border-r text-[10px] text-muted-foreground text-center flex items-center justify-center"
                      style={{ width: header.width / header.subHeaders.length }}
                    >
                      {sub}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Gantt Bars */}
            <div className="relative" style={{ width: totalWidth }}>
              {/* Grid Lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {timelineHeaders.map((header, i) =>
                  header.subHeaders.map((_, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="border-r border-dashed border-border/30"
                      style={{ width: header.width / header.subHeaders.length }}
                    />
                  ))
                )}
              </div>

              {/* Task Bars */}
              {visibleTasks.map((task) => {
                const barStyle = getBarStyle(task);
                return (
                  <div key={task.id} className="h-10 border-b relative">
                    {/* Baseline Bar */}
                    {showBaseline && task.baselineStart && (
                      <div
                        className="absolute top-1 h-2 bg-muted-foreground/20 rounded"
                        style={getBarStyle({
                          ...task,
                          startDate: task.baselineStart,
                          endDate: task.baselineEnd || task.endDate,
                        })}
                      />
                    )}

                    {/* Main Bar */}
                    {task.type === 'milestone' ? (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-purple-500 border-2 border-purple-300"
                        style={{ left: barStyle.left, marginLeft: -8 }}
                      />
                    ) : task.type === 'summary' ? (
                      <div
                        className="absolute top-3 h-4 flex items-center"
                        style={barStyle}
                      >
                        <div className="w-full h-2 bg-info rounded relative">
                          <div className="absolute left-0 top-0 w-2 h-full bg-info rounded-l" />
                          <div className="absolute right-0 top-0 w-2 h-full bg-info rounded-r" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'absolute top-2.5 h-5 rounded flex items-center overflow-hidden group cursor-pointer transition-all hover:shadow-lg',
                          task.isCritical && showCriticalPath ? 'bg-destructive' : 'bg-primary'
                        )}
                        style={barStyle}
                      >
                        {/* Progress Fill */}
                        <div
                          className={cn(
                            'absolute inset-y-0 left-0',
                            task.isCritical && showCriticalPath
                              ? 'bg-destructive/70'
                              : 'bg-primary/70'
                          )}
                          style={{ width: `${task.progress}%` }}
                        />
                        {/* Label */}
                        <span className="relative z-10 px-2 text-[10px] font-medium text-white truncate">
                          {task.name}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Today Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10"
                style={{
                  left: `${
                    ((new Date().getTime() - dateRange.start.getTime()) /
                      (dateRange.end.getTime() - dateRange.start.getTime())) *
                    100
                  }%`,
                }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-[10px] px-1 rounded">
                  Today
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between p-3 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-6 h-3 bg-primary rounded" />
            <span>Task</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-2 bg-info rounded" />
            <span>Summary</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rotate-45 bg-purple-500" />
            <span>Milestone</span>
          </div>
          {showCriticalPath && (
            <div className="flex items-center gap-1">
              <div className="w-6 h-3 bg-destructive rounded" />
              <span>Critical Path</span>
            </div>
          )}
          {showBaseline && (
            <div className="flex items-center gap-1">
              <div className="w-6 h-2 bg-muted-foreground/30 rounded" />
              <span>Baseline</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3" />
          <span>
            {dateRange.start.toLocaleDateString()} — {dateRange.end.toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
