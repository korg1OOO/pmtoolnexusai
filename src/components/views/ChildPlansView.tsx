import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Link2,
  Calendar,
  User,
  Clock,
  Diamond,
  Folder,
  CheckCircle2,
  Circle,
  Pause,
  XCircle,
  Layers,
  GitBranch,
  Target,
  ExternalLink,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChildTask {
  id: string;
  wbs: string;
  name: string;
  type: 'task' | 'milestone' | 'summary';
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'on-hold';
  priority: 'critical' | 'high' | 'medium' | 'low';
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  assignee?: string;
  sprintLink?: { id: string; name: string };
  children?: ChildTask[];
  level: number;
  expanded?: boolean;
}


import { useProjectContext } from '@/contexts/ProjectContext';
import { useTasks, DbTask } from '@/hooks/useTasks';

interface ChildTask {
  id: string;
  wbs: string;
  name: string;
  type: 'task' | 'milestone' | 'summary';
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'on-hold';
  priority: 'critical' | 'high' | 'medium' | 'low';
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  assignee?: string;
  sprintLink?: { id: string; name: string };
  children?: ChildTask[];
  level: number;
  expanded?: boolean;
}


const statusIcons: Record<string, React.ReactNode> = {
  'not-started': <Circle className="h-4 w-4 text-muted-foreground" />,
  'in-progress': <Clock className="h-4 w-4 text-primary" />,
  'completed': <CheckCircle2 className="h-4 w-4 text-success" />,
  'blocked': <XCircle className="h-4 w-4 text-destructive" />,
  'on-hold': <Pause className="h-4 w-4 text-warning" />,
};

const typeIcons: Record<string, React.ReactNode> = {
  task: <CheckCircle2 className="h-3.5 w-3.5 text-primary" />,
  milestone: <Diamond className="h-3.5 w-3.5 text-purple-400" />,
  summary: <Folder className="h-3.5 w-3.5 text-info" />,
};

const priorityColors: Record<string, string> = {
  critical: 'bg-destructive',
  high: 'bg-orange-500',
  medium: 'bg-warning',
  low: 'bg-success',
};

interface ChildTaskRowProps {
  task: ChildTask;
  expanded: boolean;
  onToggle: () => void;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onSprintClick: (sprint: { id: string; name: string }) => void;
}

function ChildTaskRow({ task, expanded, onToggle, selected, onSelect, onSprintClick }: ChildTaskRowProps) {
  const hasChildren = task.children && task.children.length > 0;
  const indent = task.level * 24;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'group grid grid-cols-[40px_minmax(300px,2fr)_100px_100px_100px_100px_120px_80px_60px] items-center border-b border-border hover:bg-muted/30 transition-colors',
        selected && 'bg-primary/5'
      )}
    >
      <div className="flex items-center justify-center h-10">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
      </div>

      <div className="flex items-center gap-2 py-2 pr-4" style={{ paddingLeft: indent }}>
        {hasChildren ? (
          <button onClick={onToggle} className="p-0.5 rounded hover:bg-muted transition-colors">
            {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
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
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {statusIcons[task.status]}
        <span className="text-xs capitalize text-muted-foreground">{task.status.replace('-', ' ')}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className={cn('h-2 w-2 rounded-full', priorityColors[task.priority])} />
        <span className="text-xs capitalize text-muted-foreground">{task.priority}</span>
      </div>

      <div className="text-xs text-muted-foreground font-mono">
        {new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>

      <div className="text-xs text-muted-foreground font-mono">
        {new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>

      {/* Sprint Link */}
      <div className="flex items-center">
        {task.sprintLink ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onSprintClick(task.sprintLink!)}
          >
            <Clock className="h-3 w-3 mr-1" />
            {task.sprintLink.name}
            <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
            <Plus className="h-3 w-3 mr-1" />
            Link Sprint
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', task.progress === 100 ? 'bg-success' : 'bg-primary')}
            style={{ width: `${task.progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono w-8">{task.progress}%</span>
      </div>

      <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="iconXs">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}



export default function ChildPlansView() {
  const { settings } = useProjectContext();
  const navigate = useNavigate();
  const { data: tasks = [], isLoading } = useTasks(settings?.id || null);

  // Transform flat tasks to hierarchy
  const hierarchy = React.useMemo(() => {
    if (!tasks.length) return [];

    const taskMap = new Map<string, ChildTask>();
    const rootTasks: ChildTask[] = [];

    // First pass: create nodes
    tasks.forEach(t => {
      taskMap.set(t.id, {
        id: t.id,
        wbs: t.wbs,
        name: t.name,
        type: t.type as any, // Cast to match interface or update interface
        status: t.status as any,
        priority: t.priority as any,
        startDate: t.start_date,
        endDate: t.end_date,
        duration: t.duration,
        progress: t.progress,
        assignee: t.assignee_id || 'Unassigned', // Using ID as name fallback for now
        level: t.level,
        children: [],
        expanded: t.expanded || false
      });
    });

    // Second pass: build tree
    tasks.forEach(t => {
      const node = taskMap.get(t.id)!;
      if (t.parent_id && taskMap.has(t.parent_id)) {
        const parent = taskMap.get(t.parent_id)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else if (t.parent_id !== null) { // Fallback if parent is missing but it's a child
        rootTasks.push(node);
      }
    });

    // We only want to display actual children (level > 0 or parent_id !== null)
    // So if the tree root Tasks has tasks that are top-level parents, we should instead
    // elevate their children to be the roots of this view.
    const childRoots: ChildTask[] = [];
    tasks.forEach(t => {
      if (t.parent_id === null) {
        // This is a phase / main project task, we only want its children
        const parentNode = taskMap.get(t.id);
        if (parentNode && parentNode.children) {
          childRoots.push(...parentNode.children);
        }
      }
    });

    return childRoots.sort((a, b) => a.wbs.localeCompare(b.wbs, undefined, { numeric: true }));
  }, [tasks]);

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  // Initialize expanded state on load
  useEffect(() => {
    if (hierarchy.length > 0 && expandedTasks.size === 0) {
      const initialExpanded = new Set<string>();
      const traverse = (nodes: ChildTask[]) => {
        nodes.forEach(n => {
          if (n.children?.length) {
            initialExpanded.add(n.id);
            traverse(n.children);
          }
        });
      };
      traverse(hierarchy);
      setExpandedTasks(initialExpanded);
    }
  }, [hierarchy.length]); // Run once when hierarchy loads

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

  const flattenTasks = (nodes: ChildTask[]): ChildTask[] => {
    const result: ChildTask[] = [];
    for (const task of nodes) {
      result.push(task);
      if (task.children && task.children.length > 0 && expandedTasks.has(task.id)) {
        result.push(...flattenTasks(task.children));
      }
    }
    return result;
  };

  const visibleTasks = React.useMemo(() => flattenTasks(hierarchy), [hierarchy, expandedTasks]);
  const linkedSprintCount = visibleTasks.filter(t => t.sprintLink).length;

  // Derive parent task / summary metrics from root tasks or project settings
  const parentSummary = {
    wbs: hierarchy[0]?.wbs?.split('.')[0] || (settings?.id ? `P-${settings.id.slice(0, 4)}` : 'P-1'),
    priority: 'high',
    name: settings?.name || 'Project Plan',
    progress: Math.round(visibleTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / (visibleTasks.length || 1))
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Parent Task Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Layers className="h-4 w-4" />
          <span>Child Plans for:</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Folder className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{parentSummary.wbs}</Badge>
                <Badge variant="destructive">{parentSummary.priority}</Badge>
              </div>
              <h1 className="text-lg font-semibold">{parentSummary.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progress</p>
              <div className="flex items-center gap-2">
                <Progress value={parentSummary.progress} className="w-32 h-2" />
                <span className="font-medium">{parentSummary.progress}%</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Sprint Links</p>
              <p className="font-medium">{linkedSprintCount} tasks linked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
          <Button variant="outline" size="sm">
            <Link2 className="h-4 w-4 mr-1" />
            Link to Sprint
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Sync Status
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Target className="h-3 w-3 text-destructive" />
            Critical Path
          </Badge>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[40px_minmax(300px,2fr)_100px_100px_100px_100px_120px_80px_60px] items-center border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
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
        <div className="py-2 flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          Sprint
        </div>
        <div className="py-2">Progress</div>
        <div className="py-2"></div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        {visibleTasks.map((task) => (
          <ChildTaskRow
            key={task.id}
            task={task}
            expanded={expandedTasks.has(task.id)}
            onToggle={() => toggleTask(task.id)}
            selected={selectedTasks.has(task.id)}
            onSelect={(selected) => toggleSelection(task.id, selected)}
            onSprintClick={(sprint) => {
              navigate(`/sprints/${sprint.id}`, { state: { sprint } });
            }}
          />
        ))}
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{visibleTasks.length} tasks</span>
          <span>{selectedTasks.size} selected</span>
        </div>
        <div className="flex items-center gap-4">
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
