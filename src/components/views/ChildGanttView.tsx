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
  Clock,
  Link2,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChildTask {
  id: string;
  wbs: string;
  name: string;
  type: 'task' | 'milestone' | 'summary';
  startDate: string;
  endDate: string;
  progress: number;
  isCritical?: boolean;
  sprintLink?: { id: string; name: string; startDate: string; endDate: string };
  children?: ChildTask[];
  level: number;
}

const mockChildTasks: ChildTask[] = [
  {
    id: 'T-010',
    wbs: '3.1',
    name: 'Infrastructure Provisioning',
    type: 'summary',
    startDate: '2024-06-01',
    endDate: '2024-07-15',
    progress: 100,
    isCritical: true,
    sprintLink: { id: 'SP-010', name: 'Sprint 10', startDate: '2024-06-03', endDate: '2024-06-16' },
    level: 0,
    children: [
      { id: 'T-010-1', wbs: '3.1.1', name: 'VPC Configuration', type: 'task', startDate: '2024-06-01', endDate: '2024-06-15', progress: 100, level: 1 },
      { id: 'T-010-2', wbs: '3.1.2', name: 'Kubernetes Cluster', type: 'task', startDate: '2024-06-10', endDate: '2024-07-01', progress: 100, isCritical: true, level: 1 },
      { id: 'T-010-3', wbs: '3.1.3', name: 'Infrastructure Complete', type: 'milestone', startDate: '2024-07-15', endDate: '2024-07-15', progress: 100, level: 1 },
    ],
  },
  {
    id: 'T-011',
    wbs: '3.2',
    name: 'Application Migration - Wave 1',
    type: 'summary',
    startDate: '2024-07-01',
    endDate: '2024-08-31',
    progress: 65,
    isCritical: true,
    sprintLink: { id: 'SP-012', name: 'Sprint 12', startDate: '2024-08-05', endDate: '2024-08-18' },
    level: 0,
    children: [
      { id: 'T-011-1', wbs: '3.2.1', name: 'Containerize Core Services', type: 'task', startDate: '2024-07-01', endDate: '2024-07-20', progress: 100, level: 1, sprintLink: { id: 'SP-011', name: 'Sprint 11', startDate: '2024-07-08', endDate: '2024-07-21' } },
      { id: 'T-011-2', wbs: '3.2.2', name: 'API Migration', type: 'task', startDate: '2024-07-15', endDate: '2024-08-15', progress: 60, isCritical: true, level: 1, sprintLink: { id: 'SP-012', name: 'Sprint 12', startDate: '2024-08-05', endDate: '2024-08-18' } },
      { id: 'T-011-3', wbs: '3.2.3', name: 'Integration Testing', type: 'task', startDate: '2024-08-10', endDate: '2024-08-31', progress: 0, level: 1 },
    ],
  },
  {
    id: 'T-012',
    wbs: '3.3',
    name: 'Application Migration - Wave 2',
    type: 'summary',
    startDate: '2024-08-15',
    endDate: '2024-10-15',
    progress: 0,
    level: 0,
  },
  {
    id: 'T-013',
    wbs: '3.4',
    name: 'Data Migration',
    type: 'summary',
    startDate: '2024-07-15',
    endDate: '2024-09-30',
    progress: 40,
    sprintLink: { id: 'SP-012', name: 'Sprint 12', startDate: '2024-08-05', endDate: '2024-08-18' },
    level: 0,
    children: [
      { id: 'T-013-1', wbs: '3.4.1', name: 'Data Profiling', type: 'task', startDate: '2024-07-15', endDate: '2024-07-31', progress: 100, level: 1 },
      { id: 'T-013-2', wbs: '3.4.2', name: 'ETL Pipeline', type: 'task', startDate: '2024-08-01', endDate: '2024-09-15', progress: 35, level: 1, sprintLink: { id: 'SP-012', name: 'Sprint 12', startDate: '2024-08-05', endDate: '2024-08-18' } },
    ],
  },
  {
    id: 'T-014',
    wbs: '3.5',
    name: 'Implementation Complete',
    type: 'milestone',
    startDate: '2024-10-31',
    endDate: '2024-10-31',
    progress: 0,
    isCritical: true,
    level: 0,
  },
];

type TimeScale = 'day' | 'week' | 'month';

export function ChildGanttView() {
  const [timeScale, setTimeScale] = useState<TimeScale>('week');
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [showSprintLinks, setShowSprintLinks] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set(['T-010', 'T-011', 'T-013']));

  const dateRange = useMemo(() => {
    const allDates: Date[] = [];
    const collectDates = (tasks: ChildTask[]) => {
      tasks.forEach((task) => {
        allDates.push(new Date(task.startDate));
        allDates.push(new Date(task.endDate));
        if (task.children) collectDates(task.children);
      });
    };
    collectDates(mockChildTasks);

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 14);

    return { start: minDate, end: maxDate };
  }, []);

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
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return headers;
  }, [dateRange, timeScale]);

  const totalWidth = timelineHeaders.reduce((sum, h) => sum + h.width, 0);

  const flattenTasks = (tasks: ChildTask[], expanded = true): ChildTask[] => {
    const result: ChildTask[] = [];
    tasks.forEach((task) => {
      result.push(task);
      if (task.children && expandedTasks.has(task.id)) {
        result.push(...flattenTasks(task.children, true));
      }
    });
    return result;
  };

  const visibleTasks = flattenTasks(mockChildTasks);

  const getBarStyle = (task: ChildTask) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const startOffset = Math.ceil((start.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
  };

  const getSprintIndicatorStyle = (sprint: { startDate: string; endDate: string }) => {
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const startOffset = Math.ceil((start.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
  };

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Child Plans Gantt</h1>
            <p className="text-sm text-muted-foreground">Phase 3: Implementation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['day', 'week', 'month'] as TimeScale[]).map((scale) => (
            <Button
              key={scale}
              variant={timeScale === scale ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeScale(scale)}
            >
              {scale.charAt(0).toUpperCase() + scale.slice(1)}
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
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
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
            variant={showSprintLinks ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowSprintLinks(!showSprintLinks)}
          >
            <GitBranch className="h-4 w-4 mr-1" />
            Sprint Links
          </Button>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>

      {/* Gantt Container */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-w-max">
          {/* Task List Panel */}
          <div className="w-80 shrink-0 border-r bg-card sticky left-0 z-10">
            <div className="h-16 border-b bg-muted/50 flex items-end p-2">
              <span className="text-xs font-medium text-muted-foreground">Task Name</span>
            </div>
            {visibleTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => task.children && toggleTask(task.id)}
                className={cn(
                  'h-12 border-b flex items-center px-2 hover:bg-muted/30 transition-colors',
                  task.isCritical && showCriticalPath && 'border-l-2 border-l-destructive',
                  task.children && 'cursor-pointer'
                )}
                style={{ paddingLeft: task.level * 16 + 8 }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-mono text-muted-foreground">{task.wbs}</span>
                  <span className={cn(
                    'text-sm truncate',
                    task.type === 'summary' && 'font-semibold',
                    task.type === 'milestone' && 'italic text-purple-400'
                  )}>
                    {task.name}
                  </span>
                </div>
                {task.sprintLink && showSprintLinks && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {task.sprintLink.name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Sprint: {task.sprintLink.name}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>

          {/* Timeline Panel */}
          <div className="flex-1">
            {/* Timeline Header */}
            <div className="h-16 border-b bg-muted/50">
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
                  <div key={task.id} className="h-12 border-b relative">
                    {/* Sprint Indicator */}
                    {showSprintLinks && task.sprintLink && (
                      <div
                        className="absolute top-1 h-2 bg-info/30 rounded border border-info/50"
                        style={getSprintIndicatorStyle(task.sprintLink)}
                      />
                    )}

                    {/* Main Bar */}
                    {task.type === 'milestone' ? (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-purple-500 border-2 border-purple-300"
                        style={{ left: barStyle.left, marginLeft: -8 }}
                      />
                    ) : task.type === 'summary' ? (
                      <div className="absolute top-4 h-4 flex items-center" style={barStyle}>
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
                              'absolute top-4 h-5 rounded flex items-center overflow-hidden group cursor-pointer transition-all hover:shadow-lg',
                              task.isCritical && showCriticalPath ? 'bg-destructive' : 'bg-primary'
                            )}
                            style={barStyle}
                          >
                            <div
                              className={cn(
                                'absolute inset-y-0 left-0',
                                task.isCritical && showCriticalPath ? 'bg-destructive/70' : 'bg-primary/70'
                              )}
                              style={{ width: `${task.progress}%` }}
                            />
                            <span className="relative z-10 px-2 text-[10px] font-medium text-white truncate">
                              {task.name}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p className="font-medium">{task.name}</p>
                            <p className="text-muted-foreground">Progress: {task.progress}%</p>
                            {task.sprintLink && (
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Link2 className="h-3 w-3" />
                                {task.sprintLink.name}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
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
          {showSprintLinks && (
            <div className="flex items-center gap-1">
              <div className="w-6 h-2 bg-info/30 border border-info/50 rounded" />
              <span>Sprint Period</span>
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
