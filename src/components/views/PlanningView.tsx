import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus,
  Link2,
  Flag,
  Keyboard,
  FolderOpen,
  Loader2,
  User,
  LogOut,
  Calculator,
  CalendarDays,
  Users,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ViewSwitcher, PlanViewMode } from './ViewSwitcher';
import { DatabaseTaskGrid } from '@/components/planning/DatabaseTaskGrid';
import { DatabaseGantt } from '@/components/planning/DatabaseGantt';
import { SprintBoardView } from './SprintBoardView';

import { CalendarDialog } from '@/components/planning/CalendarDialog';
import { ResourceSheet } from '@/components/resources/ResourceSheet';
import { ResourceUsageView } from '@/components/resources/ResourceUsageView';
import { ProjectChat } from '@/components/collaboration/ProjectChat';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, useCreateProject, Project } from '@/hooks/useProjects';
import { useTasks, useCreateTask, DbTask } from '@/hooks/useTasks';
import { LinkChildProjectDialog } from '@/components/planning/LinkChildProjectDialog';
import { useCalculateCriticalPath } from '@/hooks/useCriticalPath';
import { useScheduleTrigger } from '@/hooks/useScheduleTrigger';
import { usePresenceContext } from '@/contexts/PresenceContext';
import {
  useProjectCalendars,
  useDefaultCalendar,
  useCalendarExceptions,
  useUpdateCalendar,
  useCreateCalendarException,
  useDeleteCalendarException,
} from '@/hooks/useCalendars';
import { useCreateCalendar, useDeleteCalendar } from '@/hooks/useCreateCalendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type ResourceViewMode = 'none' | 'sheet' | 'usage';


interface PlanningViewProps {
  demo?: boolean;
}

export function PlanningView({ demo = false }: PlanningViewProps) {
  const [viewMode, setViewMode] = useState<PlanViewMode>('grid');
  const [resourceView, setResourceView] = useState<ResourceViewMode>('none');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCode, setNewProjectCode] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [selectedTasks, setSelectedTasks] = useState<DbTask[]>([]);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkingTaskId, setLinkingTaskId] = useState<string | null>(null);
  const [currentChildProjectId, setCurrentChildProjectId] = useState<string | null>(null);

  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { setCurrentProjectId, startEditing, stopEditing } = usePresenceContext();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const calculateCriticalPath = useCalculateCriticalPath();
  const { triggerSchedule, recalculateAll, isScheduling } = useScheduleTrigger(selectedProjectId);
  // Calendar hooks
  const { data: calendars = [] } = useProjectCalendars(selectedProjectId);
  const { data: defaultCalendar } = useDefaultCalendar(selectedProjectId);
  const selectedCalendar = selectedCalendarId
    ? calendars.find(c => c.id === selectedCalendarId) || null
    : defaultCalendar;
  const { data: calendarExceptions = [] } = useCalendarExceptions(selectedCalendar?.id || null);
  const updateCalendar = useUpdateCalendar();
  const createCalendar = useCreateCalendar();
  const deleteCalendar = useDeleteCalendar();
  const createException = useCreateCalendarException();
  const deleteException = useDeleteCalendarException();

  // Auto-select first project and update presence
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Update presence when project changes
  useEffect(() => {
    setCurrentProjectId(selectedProjectId);
  }, [selectedProjectId, setCurrentProjectId]);

  // Auto-select default calendar when project changes
  useEffect(() => {
    if (defaultCalendar) {
      setSelectedCalendarId(defaultCalendar.id);
    } else {
      setSelectedCalendarId(null);
    }
  }, [defaultCalendar]);

  const handleChildPlanClick = () => {
    if (selectedTasks.length !== 1) return;
    const task = selectedTasks[0];

    if (task.child_project_id) {
      // Navigate to child project
      setSelectedProjectId(task.child_project_id);
      setCurrentProjectId(task.child_project_id);
      toast.success('Switched to child plan');
    } else {
      // Open link dialog
      setLinkingTaskId(task.id);
      setCurrentChildProjectId(null);
      setShowLinkDialog(true);
    }
  };

  const handleLinkSuccess = () => {
    // Refresh tasks logic if needed, but QueryClient handles it
  };

  const shortcuts = [
    { key: '↑ / ↓', description: 'Navigate between tasks' },
    { key: '← / →', description: 'Collapse / Expand task' },
    { key: 'Space', description: 'Select / Deselect task' },
    { key: 'Enter', description: 'Edit task name' },
    { key: '⌘ + Delete', description: 'Delete selected task' },
    { key: 'Tab', description: 'Indent task' },
    { key: 'Shift + Tab', description: 'Outdent task' },
  ];

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !newProjectCode.trim()) {
      toast.error('Please fill in project name and code');
      return;
    }

    try {
      const project = await createProject.mutateAsync({
        name: newProjectName,
        code: newProjectCode.toUpperCase(),
        description: newProjectDesc || null,
        methodology: 'hybrid',
        status: 'active',
        health: 'green',
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        budget: 0,
        spent: 0,
        progress: 0,
        owner_id: user?.id || null,
      });

      setSelectedProjectId(project.id);
      setShowNewProjectDialog(false);
      setNewProjectName('');
      setNewProjectCode('');
      setNewProjectDesc('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAddTask = async () => {
    if (!selectedProjectId) {
      toast.error('Please select or create a project first');
      return;
    }

    await createTask.mutateAsync({
      project_id: selectedProjectId,
      parent_id: null,
      wbs: '1',
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
      level: 0,
      sort_order: 0,
    });
  };

  const handleCalculateCriticalPath = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    await calculateCriticalPath.mutateAsync(selectedProjectId);
  };

  const handleAutoSchedule = () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    recalculateAll();
  };

  // Show loading state only while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">


          <div className="w-px h-6 bg-border" />

          <Button
            size="sm"
            onClick={handleChildPlanClick}
            disabled={selectedTasks.length !== 1}
            className={cn(
              selectedTasks.length === 1 && selectedTasks[0].child_project_id
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
            variant={selectedTasks.length !== 1 ? "outline" : "default"}
          >
            <Link2 className="h-4 w-4 mr-1" />
            Child Plan
          </Button>

          <Button size="sm" onClick={handleAddTask} disabled={!selectedProjectId}>
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
          <ViewSwitcher value={viewMode} onChange={(v) => { setViewMode(v); setResourceView('none'); }} />
          <div className="w-px h-6 bg-border" />

          {/* Resource Views Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={resourceView !== 'none' ? 'secondary' : 'outline'}
                size="sm"
              >
                <Users className="h-4 w-4 mr-1" />
                Resources
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setResourceView('sheet')}>
                <Users className="h-4 w-4 mr-2" />
                Resource Sheet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setResourceView('usage')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Resource Usage
              </DropdownMenuItem>
              {resourceView !== 'none' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setResourceView('none')}>
                    Back to Tasks
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCalendarDialog(true)}
            disabled={!selectedProjectId}
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Calendar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleAutoSchedule}
            disabled={!selectedProjectId || isScheduling}
          >
            {isScheduling ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Auto-Schedule
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCalculateCriticalPath}
            disabled={!selectedProjectId || calculateCriticalPath.isPending}
          >
            {calculateCriticalPath.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4 mr-1" />
            )}
            Calculate CPM
          </Button>

          {/* Chat Button */}
          {selectedProjectId && (
            <ProjectChat
              projectId={selectedProjectId}
              isOpen={showChat}
              onToggle={() => setShowChat(!showChat)}
            />
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      {(selectedProjectId || demo) ? (
        <>
          {/* Resource Views */}
          {resourceView === 'sheet' && (
            <ResourceSheet projectId={selectedProjectId || 'demo'} />
          )}
          {resourceView === 'usage' && (
            <ResourceUsageView projectId={selectedProjectId || 'demo'} />
          )}

          {/* Task Views (only show when not in resource view) */}
          {resourceView === 'none' && (
            <>
              {viewMode === 'grid' && (
                demo ? (
                  // Demo Grid Placeholder - Replace with actual Mock Grid if needed, or rely on DatabaseTaskGrid handling 'demo' ID gracefully?
                  // DatabaseTaskGrid likely fetches from DB. We need to mock that too or render a visual placeholder.
                  // For Landing Page, a visual placeholder is safer than hacking the query hooks deeply.
                  <div className="p-8">
                    <div className="border rounded-xl shadow-sm overflow-hidden bg-card/60 backdrop-blur-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border/50">
                          <tr>
                            <th className="p-4 text-left w-20 font-bold text-muted-foreground text-xs uppercase tracking-wider">WBS</th>
                            <th className="p-4 text-left font-bold text-muted-foreground text-xs uppercase tracking-wider">Task Name</th>
                            <th className="p-4 text-left w-40 font-bold text-muted-foreground text-xs uppercase tracking-wider">Assignee</th>
                            <th className="p-4 text-left w-32 font-bold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                            <th className="p-4 text-left w-32 font-bold text-muted-foreground text-xs uppercase tracking-wider">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { wbs: "1.0", name: "Program Initiation", assignee: "Project Office", status: "Completed", dur: "15d", indent: 0, statusColor: "text-emerald-500 bg-emerald-500/10" },
                            { wbs: "1.1", name: "Charter Approval", assignee: "Exec Comm", status: "Completed", dur: "5d", indent: 1, statusColor: "text-emerald-500 bg-emerald-500/10" },
                            { wbs: "1.2", name: "Resource Allocation", assignee: "Sarah K.", status: "Completed", dur: "10d", indent: 1, statusColor: "text-emerald-500 bg-emerald-500/10" },
                            { wbs: "2.0", name: "Planning Phase", assignee: "Core Team", status: "In Progress", dur: "45d", indent: 0, statusColor: "text-indigo-500 bg-indigo-500/10" },
                            { wbs: "2.1", name: "Requirements Analysis", assignee: "John D.", status: "In Progress", dur: "15d", indent: 1, statusColor: "text-indigo-500 bg-indigo-500/10" },
                            { wbs: "2.2", name: "Technical Architecture", assignee: "Mike R.", status: "Pending", dur: "20d", indent: 1, statusColor: "text-amber-500 bg-amber-500/10" },
                            { wbs: "2.3", name: "Risk Assessment", assignee: "Legal Team", status: "At Risk", dur: "10d", indent: 1, statusColor: "text-red-500 bg-red-500/10" },
                            { wbs: "3.0", name: "Execution", assignee: "Dev Team", status: "Not Started", dur: "90d", indent: 0, statusColor: "text-muted-foreground bg-muted" },
                            { wbs: "3.1", name: "Module A Development", assignee: "Backend Squad", status: "Not Started", dur: "30d", indent: 1, statusColor: "text-muted-foreground bg-muted" },
                          ].map((task, i) => (
                            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                              <td className="p-4 font-mono text-xs text-muted-foreground">{task.wbs}</td>
                              <td className="p-4 font-medium">
                                <span style={{ paddingLeft: `${task.indent * 20}px` }} className="flex items-center gap-2">
                                  {task.indent > 0 && <span className="text-muted-foreground/30">↳</span>}
                                  {task.name}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                                    {task.assignee.charAt(0)}
                                  </div>
                                  {task.assignee}
                                </div>
                              </td>
                              <td className="p-4"><Badge variant="outline" className={`border-0 ${task.statusColor} hover:${task.statusColor}`}>{task.status}</Badge></td>
                              <td className="p-4 text-xs tabular-nums text-muted-foreground">{task.dur}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden relative">
                    {viewMode === 'grid' && selectedProjectId && (
                      <DatabaseTaskGrid
                        projectId={selectedProjectId}
                        onSelectionChange={setSelectedTasks}
                      />
                    )}

                    {viewMode === 'gantt' && (
                      <DatabaseGantt
                        projectId={selectedProjectId || ''}
                        onSelectionChange={setSelectedTasks}
                      />
                    )}
                  </div>
                )}
              {viewMode === 'board' && <SprintBoardView />}
            </>
          )
          }
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-4">
            <FolderOpen className="h-12 w-12 mx-auto opacity-50" />
            <p>Select a project or create a new one to get started</p>
            <Button onClick={() => setShowNewProjectDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        </div>
      )}

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

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Set up a new project with its own tasks, timeline, and team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., Website Redesign"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="projectCode">Project Code</Label>
                <Input
                  id="projectCode"
                  placeholder="e.g., WEB-01"
                  value={newProjectCode}
                  onChange={(e) => setNewProjectCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="projectDesc">Description (optional)</Label>
              <Textarea
                id="projectDesc"
                placeholder="Brief description of the project..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={createProject.isPending}>
              {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {
        linkingTaskId && (
          <LinkChildProjectDialog
            open={showLinkDialog}
            onOpenChange={setShowLinkDialog}
            taskId={linkingTaskId}
            currentChildProjectId={currentChildProjectId}
            onLinkSuccess={handleLinkSuccess}
          />
        )
      }

      {/* Calendar Dialog */}
      {
        selectedProjectId && (
          <CalendarDialog
            open={showCalendarDialog}
            onOpenChange={setShowCalendarDialog}
            calendars={calendars}
            selectedCalendar={selectedCalendar}
            exceptions={calendarExceptions}
            projectId={selectedProjectId}
            onSelectCalendar={(id) => setSelectedCalendarId(id)}
            onSave={async (updates) => {
              if (selectedCalendar) {
                await updateCalendar.mutateAsync({ id: selectedCalendar.id, ...updates });
              }
            }}
            onCreateCalendar={async (calendar) => {
              const newCal = await createCalendar.mutateAsync(calendar);
              setSelectedCalendarId(newCal.id);
            }}
            onDeleteCalendar={async (id) => {
              await deleteCalendar.mutateAsync({ id, projectId: selectedProjectId });
              setSelectedCalendarId(null);
            }}
            onAddException={async (exception) => {
              await createException.mutateAsync(exception);
            }}
            onRemoveException={async (id) => {
              if (selectedCalendar) {
                await deleteException.mutateAsync({ id, calendarId: selectedCalendar.id });
              }
            }}
            isSaving={updateCalendar.isPending}
          />
        )
      }
    </div >
  );
}

// Keep ProjectPlanView for backwards compatibility
export function ProjectPlanView() {
  return <PlanningView />;
}
