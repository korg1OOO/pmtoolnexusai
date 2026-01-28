import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Link2, 
  Plus, 
  Trash2, 
  ChevronDown,
  Loader2,
} from 'lucide-react';
import type { DbTask, DbDependency } from '@/hooks/useTasks';
import type { Database } from '@/integrations/supabase/types';

type DependencyType = Database['public']['Enums']['dependency_type'];

interface PredecessorColumnProps {
  task: DbTask;
  dependencies: DbDependency[];
  allTasks: DbTask[];
  onAddDependency: (predecessorId: string, type: DependencyType, lag: number) => Promise<void>;
  onRemoveDependency: (depId: string) => Promise<void>;
  isLoading?: boolean;
}

const dependencyLabels: Record<DependencyType, string> = {
  FS: 'Finish-to-Start',
  SS: 'Start-to-Start',
  FF: 'Finish-to-Finish',
  SF: 'Start-to-Finish',
};

export function PredecessorColumn({
  task,
  dependencies,
  allTasks,
  onAddDependency,
  onRemoveDependency,
  isLoading = false,
}: PredecessorColumnProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPredecessor, setSelectedPredecessor] = useState<string>('');
  const [depType, setDepType] = useState<DependencyType>('FS');
  const [lag, setLag] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const taskDeps = dependencies.filter(d => d.task_id === task.id);
  
  const availablePredecessors = allTasks.filter(t => 
    t.id !== task.id && !taskDeps.some(d => d.predecessor_id === t.id)
  );

  // Format dependencies as MS Project style string (e.g., "1FS, 3FS+2d")
  const formatDependencies = () => {
    if (taskDeps.length === 0) return '—';
    
    return taskDeps.map(dep => {
      const predTask = allTasks.find(t => t.id === dep.predecessor_id);
      if (!predTask) return null;
      
      // Use row number or WBS
      const taskNumber = predTask.wbs.replace(/\./g, '');
      const lagStr = dep.lag ? (dep.lag > 0 ? `+${dep.lag}d` : `${dep.lag}d`) : '';
      return `${taskNumber}${dep.type}${lagStr}`;
    }).filter(Boolean).join(', ');
  };

  const handleAddDependency = async () => {
    if (!selectedPredecessor) return;
    
    setIsSubmitting(true);
    try {
      await onAddDependency(selectedPredecessor, depType, lag);
      setShowAddDialog(false);
      setSelectedPredecessor('');
      setDepType('FS');
      setLag(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    await onRemoveDependency(depId);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className={cn(
              'text-xs font-mono px-2 py-1 rounded hover:bg-muted/50 text-left truncate max-w-full',
              taskDeps.length > 0 ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              formatDependencies()
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {taskDeps.length > 0 ? (
            <>
              {taskDeps.map(dep => {
                const predTask = allTasks.find(t => t.id === dep.predecessor_id);
                return (
                  <DropdownMenuItem 
                    key={dep.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Link2 className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-xs">{predTask?.wbs}</span>
                      <span className="text-sm truncate">{predTask?.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {dep.type}{dep.lag ? (dep.lag > 0 ? `+${dep.lag}d` : `${dep.lag}d`) : ''}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="iconXs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDependency(dep.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuItem 
                onClick={() => setShowAddDialog(true)}
                className="text-primary"
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Predecessor
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
              <Plus className="h-3 w-3 mr-2" />
              Add Predecessor
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Predecessor</DialogTitle>
            <DialogDescription>
              Link a predecessor task to "{task.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Predecessor Task</label>
              <Select value={selectedPredecessor} onValueChange={setSelectedPredecessor}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {availablePredecessors.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="font-mono text-xs mr-2">{t.wbs}</span>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={depType} onValueChange={(v) => setDepType(v as DependencyType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dependencyLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{value}</span>
                          <span className="text-muted-foreground">- {label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Lag (days)</label>
                <Input
                  type="number"
                  value={lag}
                  onChange={(e) => setLag(parseInt(e.target.value) || 0)}
                  className="mt-1"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddDependency} 
              disabled={!selectedPredecessor || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Dependency
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface SlackDisplayProps {
  freeSlack?: number | null;
  totalSlack?: number | null;
  isCritical?: boolean | null;
}

export function SlackDisplay({ freeSlack, totalSlack, isCritical }: SlackDisplayProps) {
  const free = freeSlack ?? 0;
  const total = totalSlack ?? 0;

  return (
    <div className={cn(
      'flex items-center gap-1 text-xs font-mono',
      isCritical ? 'text-destructive font-medium' : 'text-muted-foreground'
    )}>
      <span title="Total Slack">{total}d</span>
      <span className="text-muted-foreground/50">/</span>
      <span title="Free Slack" className="text-muted-foreground">{free}d</span>
    </div>
  );
}

interface ConstraintIndicatorProps {
  constraintType?: string | null;
  constraintDate?: string | null;
  deadline?: string | null;
}

export function ConstraintIndicator({ constraintType, constraintDate, deadline }: ConstraintIndicatorProps) {
  if (!constraintType || constraintType === 'ASAP') {
    if (!deadline) return null;
  }

  const getConstraintAbbrev = (type: string) => {
    switch (type) {
      case 'ASAP': return null;
      case 'ALAP': return '↓';
      case 'MSO': return 'MS';
      case 'MFO': return 'MF';
      case 'SNET': return 'S≥';
      case 'SNLT': return 'S≤';
      case 'FNET': return 'F≥';
      case 'FNLT': return 'F≤';
      default: return null;
    }
  };

  const abbrev = constraintType ? getConstraintAbbrev(constraintType) : null;

  return (
    <div className="flex items-center gap-1">
      {abbrev && (
        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-mono">
          {abbrev}
        </Badge>
      )}
      {deadline && (
        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-warning/10 text-warning border-warning/30">
          DL
        </Badge>
      )}
    </div>
  );
}
