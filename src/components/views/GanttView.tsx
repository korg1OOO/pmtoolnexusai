
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useTasks, useDependencies, useCreateDependency, DbTask, DbDependency } from '@/hooks/useTasks';
import type { Task, TaskType, TaskStatus, Priority } from '@/types/project';
import { TaskInformationDialog } from '@/components/planning/TaskInformationDialog';
import { useResources, useTaskResourceAssignments, useCreateResourceAssignment, useDeleteResourceAssignment } from '@/hooks/useResources';
import { useUpdateTask, useDeleteDependency } from '@/hooks/useTasks';

type TimeScale = 'day' | 'week' | 'month' | 'quarter';

const timeScales: { value: TimeScale; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

export default function GanttView() {
  const { settings } = useProjectContext();
  const projectId = settings.id;

  // Data Fetching
  const { data: dbTasks = [], isLoading: isLoadingTasks } = useTasks(projectId);
  const { data: dbDependencies = [], isLoading: isLoadingDeps } = useDependencies(projectId);
  const { data: resources = [] } = useResources(projectId);
  const { data: assignments = [] } = useTaskResourceAssignments(projectId);

  const createDependency = useCreateDependency();
  const updateTask = useUpdateTask();
  const deleteDependency = useDeleteDependency();
  const createAssignment = useCreateResourceAssignment();
  const deleteAssignment = useDeleteResourceAssignment();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [timeScale, setTimeScale] = useState<TimeScale>('week');
  const [showBaseline, setShowBaseline] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag State for Dependencies
  const [dragStart, setDragStart] = useState<{ taskId: string; x: number; y: number; side: 'start' | 'end' } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);

  // Tree Transformation
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
        dependencies: [], // Populated separately if needed, but we use DbDependency list for drawing
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
    // Safety break
    const end = new Date(dateRange.end);

    // Limit to 5 years loop to prevent crash
    let loopCount = 0;

    while (current <= end && loopCount < 1000) {
      loopCount++;
      if (timeScale === 'week') {
        const month = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const weeks: string[] = [];
        const monthStart = new Date(current);

        while (current.getMonth() === monthStart.getMonth() && current <= end) {
          weeks.push(`W${Math.ceil(current.getDate() / 7)}`);
          current.setDate(current.getDate() + 7);
        }

        headers.push({ label: month, subHeaders: weeks, width: weeks.length * 60 });
      } else if (timeScale === 'month') {
        const year = current.getFullYear().toString();
        const months: string[] = [];
        const yearStart = current.getFullYear();

        while (current.getFullYear() === yearStart && current <= end) {
          months.push(current.toLocaleDateString('en-US', { month: 'short' }));
          current.setMonth(current.getMonth() + 1);
        }

        headers.push({ label: year, subHeaders: months, width: months.length * 80 });
      } else {
        // Fallback or other scales
        current.setMonth(current.getMonth() + 1);
      }
    }
    return headers;
  }, [dateRange, timeScale]);

  const totalWidth = timelineHeaders.reduce((sum, h) => sum + h.width, 0);

  // Flatten tasks for display with O(1) index lookup
  const { visibleTasks, taskYPositions } = useMemo(() => {
    const flatten = (tasks: Task[], expanded = true): Task[] => {
      const result: Task[] = [];
      tasks.forEach((task) => {
        result.push(task);
        if (task.children && task.children.length > 0 && expanded) {
          result.push(...flatten(task.children, task.expanded ?? true));
        }
      });
      return result;
    };
    const visible = flatten(taskTree);
    const yMap = new Map<string, number>();
    visible.forEach((t, i) => yMap.set(t.id, i * 40 + 20)); // Center of 40px row
    return { visibleTasks: visible, taskYPositions: yMap };
  }, [taskTree]);

  // Helper: Get X coord for a date
  const getXForDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const totalDays = Math.max(1, (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const offset = (date.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
    return (offset / totalDays) * totalWidth;
  }, [dateRange, totalWidth]);

  // Drag Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      // Calculate Scroll offsets correctly
      // The SVG is inside the scrollable container "flex-1 overflow-auto relative"
      // e.clientX is viewport. x should be relative to SVG origin.

      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      const y = e.clientY - rect.top + containerRef.current.scrollTop;

      setDragCurrent({ x, y });

      // Hit Testing
      // y is relative to container top. minus header height (64px)
      const relativeY = y - 64;
      const rowHeight = 40; // Hardcoded row height from CSS
      const rowIndex = Math.floor(relativeY / rowHeight);

      if (rowIndex >= 0 && rowIndex < visibleTasks.length) {
        setDragTargetId(visibleTasks[rowIndex].id);
      } else {
        setDragTargetId(null);
      }
    };

    const handleMouseUp = async () => {
      if (!dragStart) return;

      if (dragTargetId && dragTargetId !== dragStart.taskId) {
        // Create Dependency
        await createDependency.mutateAsync({
          projectId: projectId!,
          dependency: {
            task_id: dragTargetId, // Successor
            predecessor_id: dragStart.taskId, // Predecessor
            type: 'FS',
            lag: 0,
            scenario_id: null // Assuming global for now, or fetch from context
          }
        });
      }

      setDragStart(null);
      setDragCurrent(null);
      setDragTargetId(null);
    };

    if (dragStart) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragStart, dragTargetId, visibleTasks, projectId, createDependency]);


  const onConnectorMouseDown = (e: React.MouseEvent, taskId: string, side: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const y = e.clientY - rect.top + containerRef.current.scrollTop;

    setDragStart({ taskId, side, x, y });
    setDragCurrent({ x, y });
  };


  const getBarStyle = (task: Task) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const totalDays = Math.max(1, (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const startOffset = (start.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
  };

  if (isLoadingTasks || isLoadingDeps) {
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
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex min-w-max h-full">
          {/* Task List Panel */}
          <div className="w-80 shrink-0 border-r bg-card sticky left-0 z-20 shadow-sm flex flex-col h-full">
            {/* Header */}
            <div className="h-16 border-b bg-muted/30 flex items-end p-3 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Name</span>
            </div>
            {/* Task Names Scrollable */}
            <div className="overflow-hidden flex-1">
              {/* Note: This should sync scroll with main area or be static. 
                 Usually in complex/old Gantt they sync scroll. 
                 For simplified 'view' we might let generic row height do the job if aligned.
                 But here we have main container scrolling both. 
                 Let's put Task List Rows INSIDE the main Scroll View to ensure alignment 
                 OR sync logic.
                 Wait, standard layout: Left Panel sticky, Right Panel scrolls X. Both scroll Y.
             */}
              {/* Simpler Approach: Render Task Names absolute or sticky inside the main container? 
                  Current layout in Old view had fixed left panel.
                  Let's stick to the structure:
                  Flex Row
                    Left: Sticky, handles its own Y scroll? No, they must sync.
                    Right: Handles X and Y scroll.
                  Actually, New View (previous) had them separate. 
                  Let's use a single container for Y scroll to ensure sync. 
              */}
            </div>
            {/* Reverting to previous layout structure but ensuring correct scroll handling */}
          </div>

          {/* Combined Scroll Container */}
          <div className="flex-1 overflow-auto relative bg-muted/5" ref={containerRef}>
            <div className="flex">
              {/* Sticky Task List Column */}
              <div className="sticky left-0 w-80 z-30 bg-card border-r">
                <div className="h-16 border-b bg-muted/30 flex items-end p-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Name</span>
                </div>
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

              {/* Right Side Timeline */}
              <div className="flex-col min-w-0" style={{ width: totalWidth }}>
                {/* Timeline Header */}
                <div className="h-16 border-b bg-muted/30 sticky top-0 z-20 flex flex-col">
                  <div className="flex h-8 border-b bg-background/95 backdrop-blur">
                    {timelineHeaders.map((header, i) => (
                      <div
                        key={i}
                        className="border-r text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/80 flex items-center justify-center"
                        style={{ width: header.width }}
                      >
                        {header.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex h-8 bg-background/50">
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

                {/* Gantt Area */}
                <div className="relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex pointer-events-none h-full">
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

                  {/* Dependency Layer (New!) */}
                  <svg className="absolute inset-0 pointer-events-none z-10" style={{ width: '100%', height: visibleTasks.length * 40 }}>
                    <defs>
                      <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                        <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
                      </marker>
                    </defs>
                    {dbDependencies.map(dep => {
                      // Find coordinates
                      const predecessor = visibleTasks.find(t => t.id === dep.predecessor_id);
                      const successor = visibleTasks.find(t => t.id === dep.task_id);

                      if (!predecessor || !successor) return null;

                      const predY = (taskYPositions.get(predecessor.id) || 0); // Middle of row
                      const succY = (taskYPositions.get(successor.id) || 0);

                      const predEndX = getXForDate(predecessor.endDate);
                      const succStartX = getXForDate(successor.startDate);

                      // Orthogonal Path: 
                      // Start -> Right 10px -> Vertical to Target Y -> Right to Target
                      const startX = predEndX;
                      const startY = predY;
                      const targetX = succStartX;
                      const targetY = succY;

                      const gap = 10;
                      const d = `M ${startX} ${startY} L ${startX + gap} ${startY} L ${startX + gap} ${targetY} L ${targetX} ${targetY}`;

                      return (
                        <path
                          key={dep.id}
                          d={d}
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                          markerEnd="url(#arrowhead)"
                          className="opacity-50 hover:opacity-100 transition-opacity"
                        />
                      );
                    })}

                    {/* Drag Preview Line */}
                    {dragStart && dragCurrent && (
                      <path
                        d={`M ${dragStart.x} ${dragStart.y} L ${dragCurrent.x} ${dragCurrent.y}`}
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeDasharray="4"
                      />
                    )}
                  </svg>

                  {/* Task Bars */}
                  <div className="divide-y divide-border">
                    {visibleTasks.map((task) => {
                      const barStyle = getBarStyle(task);
                      return (
                        <div key={task.id} className="h-10 relative group">
                          {/* Connectors (New!) */}
                          <div
                            className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-background border border-primary rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair z-30 transition-opacity"
                            style={{ left: barStyle.left }}
                            onMouseDown={(e) => onConnectorMouseDown(e, task.id, 'start')}
                          />
                          <div
                            className="absolute top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-background border border-primary rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair z-30 transition-opacity"
                            // Use left + width for end position
                            style={{ left: `calc(${barStyle.left} + ${barStyle.width})` }}
                            onMouseDown={(e) => onConnectorMouseDown(e, task.id, 'end')}
                          />

                          {/* Main Bar Content */}
                          {task.type === 'milestone' ? (
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-45 bg-purple-500 border-2 border-purple-200 shadow-sm z-20"
                              style={{ left: barStyle.left, marginLeft: -7 }}
                            />
                          ) : task.type === 'summary' ? (
                            <div
                              className="absolute top-3.5 h-3 flex items-center z-20"
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
                                'absolute top-2.5 h-5 rounded flex items-center overflow-hidden z-20 transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer',
                                task.isCritical && showCriticalPath ? 'bg-destructive shadow-sm' : 'bg-primary/90'
                              )}
                              style={barStyle}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTaskId(task.id);
                              }}
                            >
                              {/* Progress */}
                              <div
                                className={cn(
                                  'absolute inset-y-0 left-0',
                                  task.isCritical && showCriticalPath
                                    ? 'bg-destructive-foreground/20'
                                    : 'bg-primary-foreground/30'
                                )}
                                style={{ width: `${task.progress}%` }}
                              />
                              <span className="relative z-10 px-2 text-[10px] font-bold text-white truncate drop-shadow-sm">
                                {task.name}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between p-3 border-t bg-muted/10 text-xs text-muted-foreground shrink-0">
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
        </div>
        <div className="flex items-center gap-3 font-medium bg-muted/20 px-3 py-1 rounded-full border border-border/50">
          <Calendar className="h-3 w-3 text-primary" />
          <span className="font-mono text-[10px]">
            {dateRange.start.toLocaleDateString()} — {dateRange.end.toLocaleDateString()}
          </span>
        </div>
      </div>

      {
        selectedTaskId && (() => {
          const task = dbTasks.find(t => t.id === selectedTaskId);
          if (!task) return null;

          return (
            <TaskInformationDialog
              open={!!selectedTaskId}
              onOpenChange={(open) => !open && setSelectedTaskId(null)}
              task={task}
              dependencies={dbDependencies}
              allTasks={dbTasks}
              resources={resources}
              assignments={assignments}
              onSave={async (updates) => {
                await updateTask.mutateAsync({ id: task.id, project_id: projectId!, ...updates } as any);
                setSelectedTaskId(null);
              }}
              onAddDependency={async (predecessorId, type, lag) => {
                await createDependency.mutateAsync({
                  projectId: projectId!,
                  dependency: {
                    task_id: task.id,
                    predecessor_id: predecessorId,
                    type,
                    lag
                  }
                });
              }}
              onRemoveDependency={async (depId) => {
                await deleteDependency.mutateAsync({ dependencyId: depId, projectId: projectId! });
              }}
              onAddAssignment={async (resourceId, units) => {
                await createAssignment.mutateAsync({
                  task_id: task.id,
                  resource_id: resourceId,
                  units,
                  work_hours: 0,
                  actual_work_hours: 0,
                  remaining_work_hours: 0,
                  cost: 0,
                  actual_cost: 0,
                  start_date: task.start_date,
                  end_date: task.end_date
                });
              }}
              onRemoveAssignment={async (assignmentId) => {
                await deleteAssignment.mutateAsync({ id: assignmentId, taskId: task.id });
              }}
            />
          );
        })()
      }
    </div >
  );
}
