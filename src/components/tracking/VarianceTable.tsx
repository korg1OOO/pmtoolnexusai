import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { type TaskWithBaseline } from '@/hooks/useBaselines';

interface VarianceTableProps {
  tasks: TaskWithBaseline[];
  showMilestones?: boolean;
  showSummaryTasks?: boolean;
}

export function VarianceTable({ 
  tasks, 
  showMilestones = true,
  showSummaryTasks = true 
}: VarianceTableProps) {
  const filteredTasks = tasks.filter(task => {
    if (!showMilestones && task.type === 'milestone') return false;
    if (!showSummaryTasks && task.type === 'summary') return false;
    return true;
  });

  const formatVariance = (days: number) => {
    if (days === 0) return '—';
    const prefix = days > 0 ? '+' : '';
    return `${prefix}${days}d`;
  };

  const getVarianceColor = (days: number) => {
    if (days > 0) return 'text-destructive';
    if (days < 0) return 'text-success';
    return 'text-muted-foreground';
  };

  const getStatusIcon = (status: TaskWithBaseline['status']) => {
    switch (status) {
      case 'behind':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'ahead':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'on-track':
        return <Clock className="h-4 w-4 text-primary" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TaskWithBaseline['status']) => {
    switch (status) {
      case 'behind':
        return <Badge variant="destructive">Behind</Badge>;
      case 'ahead':
        return <Badge variant="success">Ahead</Badge>;
      case 'on-track':
        return <Badge variant="secondary">On Track</Badge>;
      default:
        return <Badge variant="outline">No Baseline</Badge>;
    }
  };

  // Calculate summary stats
  const tasksWithBaseline = filteredTasks.filter(t => t.status !== 'no-baseline');
  const behindCount = tasksWithBaseline.filter(t => t.status === 'behind').length;
  const aheadCount = tasksWithBaseline.filter(t => t.status === 'ahead').length;
  const onTrackCount = tasksWithBaseline.filter(t => t.status === 'on-track').length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {tasksWithBaseline.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-muted-foreground">Ahead:</span>
            <span className="font-medium">{aheadCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">On Track:</span>
            <span className="font-medium">{onTrackCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-muted-foreground">Behind:</span>
            <span className="font-medium">{behindCount}</span>
          </div>
        </div>
      )}

      {/* Variance Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[60px]">WBS</TableHead>
              <TableHead>Task Name</TableHead>
              <TableHead className="w-[100px]">Progress</TableHead>
              <TableHead className="w-[100px] text-center">Start</TableHead>
              <TableHead className="w-[100px] text-center">Finish</TableHead>
              <TableHead className="w-[80px] text-center">Duration</TableHead>
              <TableHead className="w-[100px] text-center">Start Var</TableHead>
              <TableHead className="w-[100px] text-center">Finish Var</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No tasks to display
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow 
                  key={task.id}
                  className={cn(
                    task.type === 'summary' && 'bg-muted/30 font-medium',
                    task.is_critical && 'border-l-2 border-l-destructive'
                  )}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {task.wbs}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {task.type === 'milestone' && (
                        <Flag className="h-3 w-3 text-primary" />
                      )}
                      <span className={cn(
                        task.type === 'summary' && 'font-medium'
                      )}>
                        {task.name}
                      </span>
                      {task.is_critical && (
                        <Badge variant="destructive" className="text-[10px] px-1">
                          Critical
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={task.progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-8">
                        {task.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {format(new Date(task.start_date), 'MMM d')}
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div>Current: {format(new Date(task.start_date), 'MMM d, yyyy')}</div>
                            {task.baseline && (
                              <div>Baseline: {format(new Date(task.baseline.start), 'MMM d, yyyy')}</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {format(new Date(task.end_date), 'MMM d')}
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div>Current: {format(new Date(task.end_date), 'MMM d, yyyy')}</div>
                            {task.baseline && (
                              <div>Baseline: {format(new Date(task.baseline.end), 'MMM d, yyyy')}</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    <div className="flex items-center justify-center gap-1">
                      <span>{task.duration}d</span>
                      {task.baseline && task.variance.durationDays !== 0 && (
                        <span className={cn("text-xs", getVarianceColor(task.variance.durationDays))}>
                          ({formatVariance(task.variance.durationDays)})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {task.status === 'no-baseline' ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className={cn(
                        "flex items-center justify-center gap-1 text-sm font-medium",
                        getVarianceColor(task.variance.startDays)
                      )}>
                        {task.variance.startDays > 0 && <ArrowDown className="h-3 w-3" />}
                        {task.variance.startDays < 0 && <ArrowUp className="h-3 w-3" />}
                        {formatVariance(task.variance.startDays)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {task.status === 'no-baseline' ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className={cn(
                        "flex items-center justify-center gap-1 text-sm font-medium",
                        getVarianceColor(task.variance.finishDays)
                      )}>
                        {task.variance.finishDays > 0 && <ArrowDown className="h-3 w-3" />}
                        {task.variance.finishDays < 0 && <ArrowUp className="h-3 w-3" />}
                        {formatVariance(task.variance.finishDays)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(task.status)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
