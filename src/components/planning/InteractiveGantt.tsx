import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ZoomIn,
  ZoomOut,
  Layers,
  Flag,
  Calendar,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Task } from '@/types/project';

type TimeScale = 'day' | 'week' | 'month' | 'quarter';

const timeScales: { value: TimeScale; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

interface DraggingState {
  taskId: string;
  type: 'move' | 'resize-start' | 'resize-end';
  startX: number;
  originalStart: Date;
  originalEnd: Date;
}

interface InteractiveGanttProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export function InteractiveGantt({ tasks, onTasksChange }: InteractiveGanttProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>('week');
  const [showBaseline, setShowBaseline] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [showDependencies, setShowDependencies] = useState(true);
  const [dragging, setDragging] = useState<DraggingState | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const ganttRef = useRef<HTMLDivElement>(null);

  // Calculate date range
  const dateRange = useMemo(() => {
    const allDates: Date[] = [];
    const collectDates = (taskList: Task[]) => {
      taskList.forEach((task) => {
        allDates.push(new Date(task.startDate));
        allDates.push(new Date(task.endDate));
        if (task.children) collectDates(task.children);
      });
    };
    collectDates(tasks);

    if (allDates.length === 0) {
      return { start: new Date(), end: new Date() };
    }

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 14);

    return { start: minDate, end: maxDate };
  }, [tasks]);

  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

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
      } else if (timeScale === 'day') {
        const month = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const days: string[] = [];
        const monthStart = new Date(current);

        while (current.getMonth() === monthStart.getMonth() && current <= dateRange.end) {
          days.push(current.getDate().toString());
          current.setDate(current.getDate() + 1);
        }

        headers.push({ label: month, subHeaders: days, width: days.length * 30 });
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return headers;
  }, [dateRange, timeScale]);

  const totalWidth = timelineHeaders.reduce((sum, h) => sum + h.width, 0);

  // Flatten tasks for display
  const flattenTasks = useCallback((taskList: Task[], expanded = true): Task[] => {
    const result: Task[] = [];
    taskList.forEach((task) => {
      result.push(task);
      if (task.children && expanded) {
        result.push(...flattenTasks(task.children, task.expanded ?? true));
      }
    });
    return result;
  }, []);

  const visibleTasks = flattenTasks(tasks);

  // Calculate bar position
  const getBarStyle = useCallback((task: Task) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const startOffset = Math.ceil((start.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
  }, [dateRange.start, totalDays]);

  // Drag handlers for rescheduling
  const handleMouseDown = (e: React.MouseEvent, task: Task, type: DraggingState['type']) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging({
      taskId: task.id,
      type,
      startX: e.clientX,
      originalStart: new Date(task.startDate),
      originalEnd: new Date(task.endDate),
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !ganttRef.current) return;

    const dx = e.clientX - dragging.startX;
    const pxPerDay = totalWidth / totalDays;
    const daysDelta = Math.round(dx / pxPerDay);

    const updateTaskDates = (taskList: Task[]): Task[] => {
      return taskList.map(task => {
        if (task.id === dragging.taskId) {
          const newStart = new Date(dragging.originalStart);
          const newEnd = new Date(dragging.originalEnd);

          if (dragging.type === 'move') {
            newStart.setDate(newStart.getDate() + daysDelta);
            newEnd.setDate(newEnd.getDate() + daysDelta);
          } else if (dragging.type === 'resize-start') {
            newStart.setDate(newStart.getDate() + daysDelta);
          } else if (dragging.type === 'resize-end') {
            newEnd.setDate(newEnd.getDate() + daysDelta);
          }

          return {
            ...task,
            startDate: newStart.toISOString().split('T')[0],
            endDate: newEnd.toISOString().split('T')[0],
            duration: Math.max(1, Math.ceil((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24))),
          };
        }
        if (task.children) {
          return { ...task, children: updateTaskDates(task.children) };
        }
        return task;
      });
    };

    onTasksChange(updateTaskDates(tasks));
  }, [dragging, totalWidth, totalDays, tasks, onTasksChange]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  React.useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Calculate dependency lines
  const dependencyLines = useMemo(() => {
    if (!showDependencies) return [];
    
    const lines: { from: Task; to: Task; fromIndex: number; toIndex: number }[] = [];
    
    visibleTasks.forEach((task, toIndex) => {
      task.dependencies?.forEach(dep => {
        const fromTask = visibleTasks.find(t => t.id === dep.taskId);
        if (fromTask) {
          const fromIndex = visibleTasks.indexOf(fromTask);
          lines.push({ from: fromTask, to: task, fromIndex, toIndex });
        }
      });
    });
    
    return lines;
  }, [visibleTasks, showDependencies]);

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
            variant={showDependencies ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDependencies(!showDependencies)}
          >
            Dependencies
          </Button>
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
      <div className="flex-1 overflow-auto" ref={ganttRef}>
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
                  task.isCritical && showCriticalPath && 'border-l-2 border-l-destructive',
                  hoveredTask === task.id && 'bg-muted/50'
                )}
                style={{ paddingLeft: task.level * 16 + 8 }}
                onMouseEnter={() => setHoveredTask(task.id)}
                onMouseLeave={() => setHoveredTask(null)}
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
            <div className="h-16 border-b bg-muted/50 sticky top-0 z-10">
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

              {/* Dependency Lines SVG */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: totalWidth, height: visibleTasks.length * 40 }}
              >
                {dependencyLines.map((line, i) => {
                  const fromStyle = getBarStyle(line.from);
                  const toStyle = getBarStyle(line.to);
                  const fromX = parseFloat(fromStyle.left) + parseFloat(fromStyle.width);
                  const toX = parseFloat(toStyle.left);
                  const fromY = line.fromIndex * 40 + 20;
                  const toY = line.toIndex * 40 + 20;
                  
                  const midX = Math.min(fromX + 2, toX - 2);
                  
                  return (
                    <g key={i}>
                      <path
                        d={`M ${(fromX / 100) * totalWidth} ${fromY} 
                            L ${(midX / 100) * totalWidth + 10} ${fromY}
                            L ${(midX / 100) * totalWidth + 10} ${toY}
                            L ${(toX / 100) * totalWidth} ${toY}`}
                        fill="none"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                        opacity="0.5"
                      />
                      <circle
                        cx={(toX / 100) * totalWidth}
                        cy={toY}
                        r="3"
                        fill="hsl(var(--muted-foreground))"
                        opacity="0.5"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Task Bars */}
              <TooltipProvider>
                {visibleTasks.map((task) => {
                  const barStyle = getBarStyle(task);
                  const isDragging = dragging?.taskId === task.id;
                  
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'h-10 border-b relative',
                        hoveredTask === task.id && 'bg-muted/20'
                      )}
                      onMouseEnter={() => setHoveredTask(task.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                    >
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-purple-500 border-2 border-purple-300 cursor-pointer hover:scale-110 transition-transform"
                              style={{ left: barStyle.left, marginLeft: -8 }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{task.name}</p>
                            <p className="text-xs text-muted-foreground">{task.startDate}</p>
                          </TooltipContent>
                        </Tooltip>
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute top-2.5 h-5 rounded flex items-center overflow-hidden group transition-all',
                                task.isCritical && showCriticalPath ? 'bg-destructive' : 'bg-primary',
                                isDragging ? 'cursor-grabbing shadow-lg ring-2 ring-primary' : 'cursor-grab hover:shadow-lg'
                              )}
                              style={barStyle}
                              onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                            >
                              {/* Left resize handle */}
                              <div
                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 opacity-0 group-hover:opacity-100"
                                onMouseDown={(e) => handleMouseDown(e, task, 'resize-start')}
                              />
                              
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
                              
                              {/* Right resize handle */}
                              <div
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 opacity-0 group-hover:opacity-100"
                                onMouseDown={(e) => handleMouseDown(e, task, 'resize-end')}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{task.name}</p>
                            <p className="text-xs">{task.startDate} → {task.endDate}</p>
                            <p className="text-xs text-muted-foreground">{task.progress}% complete</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </TooltipProvider>

              {/* Today Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10 pointer-events-none"
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
          <span className="text-muted-foreground/60">Drag bars to reschedule • Drag edges to resize</span>
          <div className="w-px h-4 bg-border" />
          <Calendar className="h-3 w-3" />
          <span>
            {dateRange.start.toLocaleDateString()} — {dateRange.end.toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
