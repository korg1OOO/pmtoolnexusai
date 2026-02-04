import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  CheckCircle2,
  Circle,
  Pause,
  XCircle,
  Clock,
  Diamond,
  Folder,
  Calendar,
  GripVertical,
  Link2,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  DbTask,
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useDependencies,
  useCreateDependency,
  useDeleteDependency,
} from '@/hooks/useTasks';
import { useScheduleTrigger } from '@/hooks/useScheduleTrigger';
import { Skeleton } from '@/components/ui/skeleton';
import type { Database } from '@/integrations/supabase/types';

type TaskType = Database['public']['Enums']['task_type'];
type TaskStatus = Database['public']['Enums']['task_status'];
type PriorityLevel = Database['public']['Enums']['priority_level'];

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  'not-started': <Circle className="h-4 w-4 text-muted-foreground" />,
  'in-progress': <Clock className="h-4 w-4 text-primary" />,
  'completed': <CheckCircle2 className="h-4 w-4 text-success" />,
  'blocked': <XCircle className="h-4 w-4 text-destructive" />,
  'on-hold': <Pause className="h-4 w-4 text-warning" />,
};

const statusLabels: Record<TaskStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'blocked': 'Blocked',
  'on-hold': 'On Hold',
};

const typeIcons: Record<TaskType, React.ReactNode> = {
  task: <CheckCircle2 className="h-3.5 w-3.5 text-primary" />,
  milestone: <Diamond className="h-3.5 w-3.5 text-purple-400" />,
  summary: <Folder className="h-3.5 w-3.5 text-info" />,
};

const priorityColors: Record<PriorityLevel, string> = {
  critical: 'bg-destructive',
  high: 'bg-orange-500',
  medium: 'bg-warning',
  low: 'bg-success',
};

interface EditableTaskRowProps {
  task: DbTask;
  expanded: boolean;
  onToggle: () => void;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  focused: boolean;
  onFocus: () => void;
  onTaskUpdate: (taskId: string, updates: Partial<DbTask>) => void;
  onTaskDelete: (taskId: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (taskId: string) => void;
  hasChildren: boolean;
  isSaving: boolean;
}

function EditableTaskRow({
  task,
  expanded,
  onToggle,
  selected,
  onSelect,
  focused,
  onFocus,
  onTaskUpdate,
  onTaskDelete,
  onAddChild,
  onAddSibling,
  hasChildren,
  isSaving,
}: EditableTaskRowProps) {
  const indent = task.level * 24;
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = (field: string, value: string) => {
    setIsEditing(field);
    setEditValue(value);
  };

  const commitEdit = (field: string) => {
    if (editValue.trim()) {
      onTaskUpdate(task.id, { [field]: editValue.trim() });
    }
    setIsEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      commitEdit(field);
    } else if (e.key === 'Escape') {
      setIsEditing(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      onClick={onFocus}
      className={cn(
        'group grid grid-cols-[40px_minmax(300px,2fr)_100px_100px_120px_120px_100px_80px_60px] items-center border-b border-border hover:bg-muted/30 transition-colors cursor-pointer',
        selected && 'bg-primary/5',
        focused && 'ring-1 ring-primary ring-inset',
        task.is_critical && 'border-l-2 border-l-destructive'
      )}
    >
      {/* Selection */}
      <div className="flex items-center justify-center h-10">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </div>

      {/* Task Name */}
      <div className="flex items-center gap-1 py-2 pr-4" style={{ paddingLeft: indent }}>
        <GripVertical className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab" />
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="p-0.5 rounded hover:bg-muted transition-colors"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {typeIcons[task.type]}
          <span className="text-xs text-muted-foreground font-mono shrink-0">{task.wbs}</span>
          {isEditing === 'name' ? (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit('name')}
              onKeyDown={(e) => handleKeyDown(e, 'name')}
              className="h-6 text-sm py-0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={cn(
                'text-sm truncate cursor-text hover:bg-muted/50 px-1 rounded',
                task.type === 'summary' && 'font-semibold',
                task.type === 'milestone' && 'font-medium italic text-purple-400'
              )}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditing('name', task.name);
              }}
            >
              {task.name}
            </span>
          )}
          {task.is_critical && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
              Critical
            </Badge>
          )}
          {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* Status - Editable */}
      <div className="flex items-center">
        <Select
          value={task.status}
          onValueChange={(value: TaskStatus) => onTaskUpdate(task.id, { status: value })}
        >
          <SelectTrigger className="h-7 text-xs border-0 bg-transparent hover:bg-muted/50 gap-1 px-1">
            {statusIcons[task.status]}
            <span className="sr-only">{statusLabels[task.status]}</span>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  {statusIcons[value as TaskStatus]}
                  <span>{label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority - Editable */}
      <div className="flex items-center">
        <Select
          value={task.priority}
          onValueChange={(value: PriorityLevel) => onTaskUpdate(task.id, { priority: value })}
        >
          <SelectTrigger className="h-7 text-xs border-0 bg-transparent hover:bg-muted/50 gap-1.5 px-1">
            <div className={cn('h-2 w-2 rounded-full', priorityColors[task.priority])} />
            <span className="capitalize">{task.priority}</span>
          </SelectTrigger>
          <SelectContent>
            {(['critical', 'high', 'medium', 'low'] as PriorityLevel[]).map((p) => (
              <SelectItem key={p} value={p}>
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', priorityColors[p])} />
                  <span className="capitalize">{p}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Start Date - Editable */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="text-xs text-muted-foreground font-mono hover:bg-muted/50 px-2 py-1 rounded text-left">
            {format(new Date(task.start_date), 'MMM d')}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={new Date(task.start_date)}
            onSelect={(date) => date && onTaskUpdate(task.id, { start_date: date.toISOString().split('T')[0] })}
          />
        </PopoverContent>
      </Popover>

      {/* End Date - Editable */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="text-xs text-muted-foreground font-mono hover:bg-muted/50 px-2 py-1 rounded text-left">
            {format(new Date(task.end_date), 'MMM d')}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={new Date(task.end_date)}
            onSelect={(date) => date && onTaskUpdate(task.id, { end_date: date.toISOString().split('T')[0] })}
          />
        </PopoverContent>
      </Popover>

      {/* Duration */}
      <div className="text-xs text-muted-foreground font-mono">
        {task.duration > 0 ? `${task.duration}d` : '—'}
      </div>

      {/* Progress - Editable slider */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
            onTaskUpdate(task.id, { progress: Math.max(0, Math.min(100, percent)) });
          }}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all',
              task.progress === 100 ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${task.progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono w-8">
          {task.progress}%
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="iconXs" className="opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAddSibling(task.id)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task Below
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddChild(task.id)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subtask
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link2 className="h-4 w-4 mr-2" />
              Add Dependency
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onTaskDelete(task.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

interface DatabaseTaskGridProps {
  projectId: string;
  scenarioId?: string | null;
  onSelectionChange?: (selectedTasks: DbTask[]) => void;
}

export function DatabaseTaskGrid({ projectId, scenarioId = null, onSelectionChange }: DatabaseTaskGridProps) {
  const { data: tasks = [], isLoading, error } = useTasks(projectId, scenarioId);
  const { data: dependencies = [] } = useDependencies(projectId, scenarioId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { triggerSchedule } = useScheduleTrigger(projectId);

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [savingTasks, setSavingTasks] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Build hierarchical structure
  const { visibleTasks, taskChildrenMap } = useMemo(() => {
    const childrenMap = new Map<string | null, DbTask[]>();

    tasks.forEach(task => {
      const parentId = task.parent_id;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(task);
    });

    const flatten = (parentId: string | null, level: number): DbTask[] => {
      const children = childrenMap.get(parentId) || [];
      const result: DbTask[] = [];

      children.forEach(task => {
        result.push({ ...task, level });
        if (expandedTasks.has(task.id) || task.expanded) {
          result.push(...flatten(task.id, level + 1));
        }
      });

      return result;
    };

    return {
      visibleTasks: flatten(null, 0),
      taskChildrenMap: childrenMap,
    };
  }, [tasks, expandedTasks]);

  // Auto-expand tasks based on their stored state
  useEffect(() => {
    const expanded = new Set<string>();
    tasks.forEach(task => {
      if (task.expanded) {
        expanded.add(task.id);
      }
    });
    setExpandedTasks(expanded);
  }, [tasks]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedTaskId) return;

      const currentIndex = visibleTasks.findIndex(t => t.id === focusedTaskId);
      if (currentIndex === -1) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setFocusedTaskId(visibleTasks[currentIndex - 1].id);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < visibleTasks.length - 1) {
            setFocusedTaskId(visibleTasks[currentIndex + 1].id);
          }
          break;
        case 'ArrowRight':
          if (!expandedTasks.has(focusedTaskId)) {
            const hasChildren = taskChildrenMap.has(focusedTaskId);
            if (hasChildren) {
              setExpandedTasks(prev => new Set([...prev, focusedTaskId]));
            }
          }
          break;
        case 'ArrowLeft':
          if (expandedTasks.has(focusedTaskId)) {
            setExpandedTasks(prev => {
              const next = new Set(prev);
              next.delete(focusedTaskId);
              return next;
            });
          }
          break;
        case ' ':
          e.preventDefault();
          setSelectedTasks(prev => {
            const next = new Set(prev);
            if (next.has(focusedTaskId)) {
              next.delete(focusedTaskId);
            } else {
              next.add(focusedTaskId);
            }
            return next;
          });
          break;
        case 'Delete':
        case 'Backspace':
          if (e.metaKey || e.ctrlKey) {
            handleTaskDelete(focusedTaskId);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedTaskId, visibleTasks, expandedTasks, taskChildrenMap]);

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

  const toggleSelection = (taskId: string, selected: boolean) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }

      // Notify parent
      const selectedTaskObjects = tasks.filter(t => next.has(t.id));
      onSelectionChange?.(selectedTaskObjects);

      return next;
    });
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<DbTask>) => {
    setSavingTasks(prev => new Set([...prev, taskId]));
    try {
      await updateTask.mutateAsync({ id: taskId, project_id: projectId, ...updates });

      // Trigger auto-scheduling when date-related fields change
      const schedulingFields = ['start_date', 'end_date', 'duration', 'constraint_type', 'constraint_date'];
      const shouldSchedule = schedulingFields.some(field => field in updates);
      if (shouldSchedule) {
        triggerSchedule(taskId);
      }
    } finally {
      setSavingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    await deleteTask.mutateAsync({ taskId, projectId });
    if (focusedTaskId === taskId) {
      setFocusedTaskId(null);
    }
  };

  const generateWBS = (parentId: string | null, existingChildren: DbTask[]): string => {
    const childCount = existingChildren.length;
    if (!parentId) {
      return `${childCount + 1}`;
    }
    const parent = tasks.find(t => t.id === parentId);
    if (parent) {
      return `${parent.wbs}.${childCount + 1}`;
    }
    return `${childCount + 1}`;
  };

  const handleAddTask = async (parentId: string | null = null, afterTaskId: string | null = null) => {
    const siblings = taskChildrenMap.get(parentId) || [];
    const wbs = generateWBS(parentId, siblings);
    const level = parentId ? (tasks.find(t => t.id === parentId)?.level ?? 0) + 1 : 0;

    let sortOrder = 0;
    if (afterTaskId) {
      const afterTask = tasks.find(t => t.id === afterTaskId);
      sortOrder = (afterTask?.sort_order ?? 0) + 1;
    } else {
      sortOrder = siblings.length;
    }

    await createTask.mutateAsync({
      project_id: projectId,
      parent_id: parentId,
      wbs,
      name: 'New Task',
      type: 'task',
      status: 'not-started',
      priority: 'medium',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      duration: 1,
      progress: 0,
      assignee_id: null,
      is_critical: false,
      notes: null,
      expanded: true,
      level,
      sort_order: sortOrder,
      scenario_id: scenarioId,
    });

    if (parentId) {
      setExpandedTasks(prev => new Set([...prev, parentId]));
    }
  };

  const handleAddChild = (parentId: string) => {
    handleAddTask(parentId, null);
  };

  const handleAddSibling = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    handleAddTask(task?.parent_id ?? null, taskId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="grid grid-cols-[40px_minmax(300px,2fr)_100px_100px_120px_120px_100px_80px_60px] items-center border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
          <div className="flex items-center justify-center h-9"><Skeleton className="h-4 w-4" /></div>
          <div className="py-2 px-2">Task Name</div>
          <div className="py-2">Status</div>
          <div className="py-2">Priority</div>
          <div className="py-2">Start</div>
          <div className="py-2">End</div>
          <div className="py-2">Duration</div>
          <div className="py-2">Progress</div>
          <div className="py-2"></div>
        </div>
        <div className="flex-1 p-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Error loading tasks: {error.message}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col flex-1 overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[40px_minmax(300px,2fr)_100px_100px_120px_120px_100px_80px_60px] items-center border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
        <div className="flex items-center justify-center h-9">
          <Checkbox
            checked={selectedTasks.size === visibleTasks.length && visibleTasks.length > 0}
            onCheckedChange={(checked) => {
              let newSet = new Set<string>();
              if (checked) {
                newSet = new Set(visibleTasks.map(t => t.id));
              }
              setSelectedTasks(newSet);

              const selectedTaskObjects = tasks.filter(t => newSet.has(t.id));
              onSelectionChange?.(selectedTaskObjects);
            }}
          />
        </div>
        <div className="py-2 px-2">Task Name</div>
        <div className="py-2">Status</div>
        <div className="py-2">Priority</div>
        <div className="py-2 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Start
        </div>
        <div className="py-2 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          End
        </div>
        <div className="py-2">Duration</div>
        <div className="py-2">Progress</div>
        <div className="py-2"></div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto">
        {visibleTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p className="mb-4">No tasks yet. Create your first task to get started.</p>
            <Button onClick={() => handleAddTask(null, null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {visibleTasks.map((task) => (
              <EditableTaskRow
                key={task.id}
                task={task}
                expanded={expandedTasks.has(task.id)}
                onToggle={() => toggleTask(task.id)}
                selected={selectedTasks.has(task.id)}
                onSelect={(selected) => toggleSelection(task.id, selected)}
                focused={focusedTaskId === task.id}
                onFocus={() => setFocusedTaskId(task.id)}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
                onAddChild={handleAddChild}
                onAddSibling={handleAddSibling}
                hasChildren={taskChildrenMap.has(task.id)}
                isSaving={savingTasks.has(task.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{visibleTasks.length} tasks</span>
          <span>{selectedTasks.size} selected</span>
          <span className="text-muted-foreground/60">
            ↑↓ navigate • ←→ expand/collapse • Space select • ⌘+Delete remove
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span>Critical: {visibleTasks.filter(t => t.is_critical).length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span>In Progress: {visibleTasks.filter(t => t.status === 'in-progress').length}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span>Complete: {visibleTasks.filter(t => t.status === 'completed').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
