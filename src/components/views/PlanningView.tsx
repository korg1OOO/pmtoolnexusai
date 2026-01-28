import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus,
  Link2,
  Flag,
  Keyboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockTasks } from '@/data/mockData';
import type { Task } from '@/types/project';
import { ViewSwitcher, PlanViewMode } from './ViewSwitcher';
import { TaskGrid } from '@/components/planning/TaskGrid';
import { InteractiveGantt } from '@/components/planning/InteractiveGantt';
import { SprintBoardView } from './SprintBoardView';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function PlanningView() {
  const [viewMode, setViewMode] = useState<PlanViewMode>('grid');
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const shortcuts = [
    { key: '↑ / ↓', description: 'Navigate between tasks' },
    { key: '← / →', description: 'Collapse / Expand task' },
    { key: 'Space', description: 'Select / Deselect task' },
    { key: 'Enter', description: 'Edit task name' },
    { key: '⌘ + Delete', description: 'Delete selected task' },
    { key: 'Tab', description: 'Indent task' },
    { key: 'Shift + Tab', description: 'Outdent task' },
  ];

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
        <div className="flex items-center gap-4">
          <ViewSwitcher value={viewMode} onChange={setViewMode} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            className="text-muted-foreground"
          >
            <Keyboard className="h-4 w-4 mr-1" />
            Shortcuts
          </Button>
          <Badge variant="outline" className="gap-1">
            <Flag className="h-3 w-3 text-destructive" />
            Critical Path
          </Badge>
          <Button variant="outline" size="sm">
            Baseline
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' && (
        <TaskGrid tasks={tasks} onTasksChange={setTasks} />
      )}
      {viewMode === 'gantt' && (
        <InteractiveGantt tasks={tasks} onTasksChange={setTasks} />
      )}
      {viewMode === 'board' && <SprintBoardView />}

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Use these shortcuts to work faster in the planning view.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Keep ProjectPlanView for backwards compatibility
export function ProjectPlanView() {
  return <PlanningView />;
}
