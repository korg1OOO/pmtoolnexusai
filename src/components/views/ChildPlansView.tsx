import React, { useState } from 'react';
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

const mockParentTask = {
  id: 'T-009',
  wbs: '3',
  name: 'Phase 3: Implementation',
  type: 'summary' as const,
  status: 'in-progress' as const,
  priority: 'critical' as const,
  startDate: '2024-06-01',
  endDate: '2024-10-31',
  duration: 152,
  progress: 35,
  owner: 'John Doe',
};

const mockChildTasks: ChildTask[] = [
  {
    id: 'T-010',
    wbs: '3.1',
    name: 'Infrastructure Provisioning',
    type: 'summary',
    status: 'completed',
    priority: 'critical',
    startDate: '2024-06-01',
    endDate: '2024-07-15',
    duration: 44,
    progress: 100,
    assignee: 'David Wilson',
    sprintLink: { id: 'SP-010', name: 'Sprint 10' },
    level: 0,
    expanded: true,
    children: [
      {
        id: 'T-010-1',
        wbs: '3.1.1',
        name: 'VPC Configuration',
        type: 'task',
        status: 'completed',
        priority: 'high',
        startDate: '2024-06-01',
        endDate: '2024-06-15',
        duration: 14,
        progress: 100,
        assignee: 'David Wilson',
        sprintLink: { id: 'SP-010', name: 'Sprint 10' },
        level: 1,
      },
      {
        id: 'T-010-2',
        wbs: '3.1.2',
        name: 'Kubernetes Cluster Setup',
        type: 'task',
        status: 'completed',
        priority: 'critical',
        startDate: '2024-06-10',
        endDate: '2024-07-01',
        duration: 21,
        progress: 100,
        assignee: 'Mike Johnson',
        sprintLink: { id: 'SP-010', name: 'Sprint 10' },
        level: 1,
      },
      {
        id: 'T-010-3',
        wbs: '3.1.3',
        name: 'Infrastructure Complete',
        type: 'milestone',
        status: 'completed',
        priority: 'high',
        startDate: '2024-07-15',
        endDate: '2024-07-15',
        duration: 0,
        progress: 100,
        level: 1,
      },
    ],
  },
  {
    id: 'T-011',
    wbs: '3.2',
    name: 'Application Migration - Wave 1',
    type: 'summary',
    status: 'in-progress',
    priority: 'critical',
    startDate: '2024-07-01',
    endDate: '2024-08-31',
    duration: 61,
    progress: 65,
    assignee: 'John Doe',
    sprintLink: { id: 'SP-012', name: 'Sprint 12' },
    level: 0,
    expanded: true,
    children: [
      {
        id: 'T-011-1',
        wbs: '3.2.1',
        name: 'Containerize Core Services',
        type: 'task',
        status: 'completed',
        priority: 'critical',
        startDate: '2024-07-01',
        endDate: '2024-07-20',
        duration: 19,
        progress: 100,
        assignee: 'Jane Smith',
        sprintLink: { id: 'SP-011', name: 'Sprint 11' },
        level: 1,
      },
      {
        id: 'T-011-2',
        wbs: '3.2.2',
        name: 'API Migration',
        type: 'task',
        status: 'in-progress',
        priority: 'critical',
        startDate: '2024-07-15',
        endDate: '2024-08-15',
        duration: 31,
        progress: 60,
        assignee: 'Mike Johnson',
        sprintLink: { id: 'SP-012', name: 'Sprint 12' },
        level: 1,
      },
      {
        id: 'T-011-3',
        wbs: '3.2.3',
        name: 'Integration Testing',
        type: 'task',
        status: 'not-started',
        priority: 'high',
        startDate: '2024-08-10',
        endDate: '2024-08-31',
        duration: 21,
        progress: 0,
        assignee: 'Emily Brown',
        level: 1,
      },
    ],
  },
  {
    id: 'T-012',
    wbs: '3.3',
    name: 'Application Migration - Wave 2',
    type: 'summary',
    status: 'not-started',
    priority: 'high',
    startDate: '2024-08-15',
    endDate: '2024-10-15',
    duration: 61,
    progress: 0,
    assignee: 'Jane Smith',
    level: 0,
    expanded: false,
  },
  {
    id: 'T-013',
    wbs: '3.4',
    name: 'Data Migration',
    type: 'summary',
    status: 'in-progress',
    priority: 'high',
    startDate: '2024-07-15',
    endDate: '2024-09-30',
    duration: 77,
    progress: 40,
    assignee: 'Emily Brown',
    sprintLink: { id: 'SP-012', name: 'Sprint 12' },
    level: 0,
    expanded: true,
    children: [
      {
        id: 'T-013-1',
        wbs: '3.4.1',
        name: 'Data Profiling',
        type: 'task',
        status: 'completed',
        priority: 'high',
        startDate: '2024-07-15',
        endDate: '2024-07-31',
        duration: 16,
        progress: 100,
        assignee: 'Emily Brown',
        sprintLink: { id: 'SP-011', name: 'Sprint 11' },
        level: 1,
      },
      {
        id: 'T-013-2',
        wbs: '3.4.2',
        name: 'ETL Pipeline Development',
        type: 'task',
        status: 'in-progress',
        priority: 'critical',
        startDate: '2024-08-01',
        endDate: '2024-09-15',
        duration: 45,
        progress: 35,
        assignee: 'David Wilson',
        sprintLink: { id: 'SP-012', name: 'Sprint 12' },
        level: 1,
      },
    ],
  },
];

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

export function ChildPlansView() {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(
    new Set(mockChildTasks.filter(t => t.expanded).map(t => t.id))
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

  const flattenTasks = (tasks: ChildTask[]): ChildTask[] => {
    const result: ChildTask[] = [];
    for (const task of tasks) {
      result.push(task);
      if (task.children && expandedTasks.has(task.id)) {
        result.push(...flattenTasks(task.children));
      }
    }
    return result;
  };

  const visibleTasks = flattenTasks(mockChildTasks);
  const linkedSprintCount = visibleTasks.filter(t => t.sprintLink).length;

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
                <Badge variant="outline">{mockParentTask.wbs}</Badge>
                <Badge variant="destructive">{mockParentTask.priority}</Badge>
              </div>
              <h1 className="text-lg font-semibold">{mockParentTask.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progress</p>
              <div className="flex items-center gap-2">
                <Progress value={mockParentTask.progress} className="w-32 h-2" />
                <span className="font-medium">{mockParentTask.progress}%</span>
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
            onSprintClick={(sprint) => console.log('Navigate to sprint:', sprint)}
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
