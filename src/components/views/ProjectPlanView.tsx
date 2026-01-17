import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Link2,
  Flag,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Diamond,
  Folder,
  CheckCircle2,
  Circle,
  Pause,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { mockTasks } from '@/data/mockData';
import type { Task, TaskStatus, TaskType, Priority } from '@/types/project';

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  'not-started': <Circle className="h-4 w-4 text-muted-foreground" />,
  'in-progress': <Clock className="h-4 w-4 text-primary" />,
  'completed': <CheckCircle2 className="h-4 w-4 text-success" />,
  'blocked': <XCircle className="h-4 w-4 text-destructive" />,
  'on-hold': <Pause className="h-4 w-4 text-warning" />,
};

const typeIcons: Record<TaskType, React.ReactNode> = {
  task: <CheckCircle2 className="h-3.5 w-3.5 text-primary" />,
  milestone: <Diamond className="h-3.5 w-3.5 text-purple-400" />,
  summary: <Folder className="h-3.5 w-3.5 text-info" />,
};

const priorityColors: Record<Priority, string> = {
  critical: 'bg-destructive',
  high: 'bg-orange-500',
  medium: 'bg-warning',
  low: 'bg-success',
};

interface TaskRowProps {
  task: Task;
  expanded: boolean;
  onToggle: () => void;
  selected: boolean;
  onSelect: (selected: boolean) => void;
}

function TaskRow({ task, expanded, onToggle, selected, onSelect }: TaskRowProps) {
  const hasChildren = task.children && task.children.length > 0;
  const indent = task.level * 24;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'group grid grid-cols-[40px_minmax(300px,2fr)_100px_100px_120px_120px_100px_80px_60px] items-center border-b border-border hover:bg-muted/30 transition-colors',
        selected && 'bg-primary/5',
        task.isCritical && 'border-l-2 border-l-destructive'
      )}
    >
      {/* Selection */}
      <div className="flex items-center justify-center h-10">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </div>

      {/* Task Name */}
      <div className="flex items-center gap-2 py-2 pr-4" style={{ paddingLeft: indent }}>
        {hasChildren ? (
          <button
            onClick={onToggle}
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
          <span className={cn(
            'text-sm truncate',
            task.type === 'summary' && 'font-semibold',
            task.type === 'milestone' && 'font-medium italic text-purple-400'
          )}>
            {task.name}
          </span>
          {task.isCritical && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
              Critical
            </Badge>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5">
        {statusIcons[task.status]}
        <span className="text-xs capitalize text-muted-foreground">
          {task.status.replace('-', ' ')}
        </span>
      </div>

      {/* Priority */}
      <div className="flex items-center gap-1.5">
        <div className={cn('h-2 w-2 rounded-full', priorityColors[task.priority])} />
        <span className="text-xs capitalize text-muted-foreground">{task.priority}</span>
      </div>

      {/* Start Date */}
      <div className="text-xs text-muted-foreground font-mono">
        {new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>

      {/* End Date */}
      <div className="text-xs text-muted-foreground font-mono">
        {new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>

      {/* Duration */}
      <div className="text-xs text-muted-foreground font-mono">
        {task.duration > 0 ? `${task.duration}d` : '—'}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
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
      <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="iconXs">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export function ProjectPlanView() {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(
    new Set(mockTasks.filter(t => t.expanded).map(t => t.id))
  );
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

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
      return next;
    });
  };

  const flattenTasks = (tasks: Task[]): Task[] => {
    const result: Task[] = [];
    for (const task of tasks) {
      result.push(task);
      if (task.children && expandedTasks.has(task.id)) {
        result.push(...flattenTasks(task.children));
      }
    }
    return result;
  };

  const visibleTasks = flattenTasks(mockTasks);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
          <Button variant="outline" size="sm">
            <Link2 className="h-4 w-4 mr-1" />
            Link
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="sm">
            Indent
          </Button>
          <Button variant="ghost" size="sm">
            Outdent
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Flag className="h-3 w-3 text-destructive" />
            Critical Path
          </Badge>
          <Button variant="outline" size="sm">
            Baseline
          </Button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[40px_minmax(300px,2fr)_100px_100px_120px_120px_100px_80px_60px] items-center border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
        <div className="flex items-center justify-center h-9">
          <Checkbox />
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
        {visibleTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            expanded={expandedTasks.has(task.id)}
            onToggle={() => toggleTask(task.id)}
            selected={selectedTasks.has(task.id)}
            onSelect={(selected) => toggleSelection(task.id, selected)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{visibleTasks.length} tasks</span>
          <span>{selectedTasks.size} selected</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span>Critical: {visibleTasks.filter(t => t.isCritical).length}</span>
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
