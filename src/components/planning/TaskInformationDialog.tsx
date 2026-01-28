import React, { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Calendar as CalendarIcon, Loader2, Link2, Users, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import type { DbTask, DbDependency } from '@/hooks/useTasks';
import type { Resource, ResourceAssignment } from '@/hooks/useResources';
import type { Database } from '@/integrations/supabase/types';

type TaskType = Database['public']['Enums']['task_type'];
type TaskStatus = Database['public']['Enums']['task_status'];
type PriorityLevel = Database['public']['Enums']['priority_level'];
type DependencyType = Database['public']['Enums']['dependency_type'];
type ConstraintType = Database['public']['Enums']['constraint_type'];

// Extended task type with new MS Project fields
interface ExtendedTask extends Omit<DbTask, 'constraint_type'> {
  constraint_type?: ConstraintType | string | null;
  fixed_cost_accrual?: string | null;
  manually_scheduled?: boolean | null;
}

interface TaskInformationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ExtendedTask;
  dependencies: DbDependency[];
  allTasks: DbTask[];
  resources: Resource[];
  assignments: ResourceAssignment[];
  onSave: (updates: Partial<ExtendedTask>) => Promise<void>;
  onAddDependency: (predecessorId: string, type: DependencyType, lag: number) => Promise<void>;
  onRemoveDependency: (depId: string) => Promise<void>;
  onAddAssignment: (resourceId: string, units: number) => Promise<void>;
  onRemoveAssignment: (assignmentId: string) => Promise<void>;
  isSaving?: boolean;
}

const constraintTypes = [
  { value: 'ASAP', label: 'As Soon As Possible' },
  { value: 'ALAP', label: 'As Late As Possible' },
  { value: 'MSO', label: 'Must Start On' },
  { value: 'MFO', label: 'Must Finish On' },
  { value: 'SNET', label: 'Start No Earlier Than' },
  { value: 'SNLT', label: 'Start No Later Than' },
  { value: 'FNET', label: 'Finish No Earlier Than' },
  { value: 'FNLT', label: 'Finish No Later Than' },
];

const statusLabels: Record<TaskStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'blocked': 'Blocked',
  'on-hold': 'On Hold',
};

const dependencyLabels: Record<DependencyType, string> = {
  FS: 'Finish-to-Start',
  SS: 'Start-to-Start',
  FF: 'Finish-to-Finish',
  SF: 'Start-to-Finish',
};

export function TaskInformationDialog({
  open,
  onOpenChange,
  task,
  dependencies,
  allTasks,
  resources,
  assignments,
  onSave,
  onAddDependency,
  onRemoveDependency,
  onAddAssignment,
  onRemoveAssignment,
  isSaving = false,
}: TaskInformationDialogProps) {
  const [formData, setFormData] = useState<Partial<ExtendedTask>>({});
  const [newPredecessor, setNewPredecessor] = useState<string>('');
  const [newDepType, setNewDepType] = useState<DependencyType>('FS');
  const [newDepLag, setNewDepLag] = useState<number>(0);
  const [newResourceId, setNewResourceId] = useState<string>('');
  const [newResourceUnits, setNewResourceUnits] = useState<number>(100);

  const mergedTask = { ...task, ...formData };

  const handleFieldChange = <K extends keyof ExtendedTask>(field: K, value: ExtendedTask[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await onSave(formData);
    setFormData({});
  };

  const predecessorDeps = dependencies.filter(d => d.task_id === task.id);
  const successorDeps = dependencies.filter(d => d.predecessor_id === task.id);

  const availablePredecessors = allTasks.filter(t => 
    t.id !== task.id && !predecessorDeps.some(d => d.predecessor_id === t.id)
  );

  const assignedResources = assignments.filter(a => a.task_id === task.id);
  const availableResources = resources.filter(r => 
    !assignedResources.some(a => a.resource_id === r.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Task Information
            {task.is_critical && (
              <Badge variant="destructive" className="text-xs">Critical Path</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Edit task properties, dependencies, and resource assignments.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="predecessors">Predecessors</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[50vh] mt-4">
            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Name</Label>
                  <Input
                    value={mergedTask.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={mergedTask.type}
                    onValueChange={(v) => handleFieldChange('type', v as TaskType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="summary">Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={mergedTask.status}
                    onValueChange={(v) => handleFieldChange('status', v as TaskStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={mergedTask.priority}
                    onValueChange={(v) => handleFieldChange('priority', v as PriorityLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Progress ({mergedTask.progress}%)</Label>
                  <Slider
                    value={[mergedTask.progress]}
                    max={100}
                    step={5}
                    onValueChange={([v]) => handleFieldChange('progress', v)}
                    className="mt-2"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={mergedTask.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(new Date(mergedTask.start_date), 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(mergedTask.start_date)}
                        onSelect={(date) => date && handleFieldChange('start_date', date.toISOString().split('T')[0])}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(new Date(mergedTask.end_date), 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(mergedTask.end_date)}
                        onSelect={(date) => date && handleFieldChange('end_date', date.toISOString().split('T')[0])}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Duration (days)</Label>
                  <Input
                    type="number"
                    value={mergedTask.duration}
                    onChange={(e) => handleFieldChange('duration', parseInt(e.target.value) || 1)}
                    min={1}
                  />
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {mergedTask.deadline ? format(new Date(mergedTask.deadline), 'PPP') : 'No deadline'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={mergedTask.deadline ? new Date(mergedTask.deadline) : undefined}
                        onSelect={(date) => handleFieldChange('deadline', date?.toISOString().split('T')[0] || null)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Constraint Type</Label>
                  <Select
                    value={mergedTask.constraint_type || 'ASAP'}
                    onValueChange={(v) => handleFieldChange('constraint_type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {constraintTypes.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Constraint Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {mergedTask.constraint_date ? format(new Date(mergedTask.constraint_date), 'PPP') : 'Not set'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={mergedTask.constraint_date ? new Date(mergedTask.constraint_date) : undefined}
                        onSelect={(date) => handleFieldChange('constraint_date', date?.toISOString().split('T')[0] || null)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Scheduling info */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-muted rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground">Early Start:</span>
                  <div className="font-mono">{mergedTask.early_start || '—'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Early Finish:</span>
                  <div className="font-mono">{mergedTask.early_finish || '—'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Late Start:</span>
                  <div className="font-mono">{mergedTask.late_start || '—'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Late Finish:</span>
                  <div className="font-mono">{mergedTask.late_finish || '—'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Free Slack:</span>
                  <div className="font-mono">{mergedTask.free_slack ?? 0}d</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Slack:</span>
                  <div className="font-mono">{mergedTask.total_slack ?? 0}d</div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={mergedTask.manually_scheduled || false}
                      onCheckedChange={(v) => handleFieldChange('manually_scheduled', v)}
                    />
                    <Label>Manually Scheduled</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Predecessors Tab */}
            <TabsContent value="predecessors" className="space-y-4">
              <div className="space-y-2">
                <Label>Predecessors</Label>
                {predecessorDeps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No predecessors</p>
                ) : (
                  <div className="space-y-2">
                    {predecessorDeps.map(dep => {
                      const predTask = allTasks.find(t => t.id === dep.predecessor_id);
                      return (
                        <div key={dep.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-xs">{predTask?.wbs}</span>
                            <span className="text-sm">{predTask?.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {dep.type}{dep.lag ? (dep.lag > 0 ? `+${dep.lag}d` : `${dep.lag}d`) : ''}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveDependency(dep.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Select value={newPredecessor} onValueChange={setNewPredecessor}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select predecessor" />
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
                  <Select value={newDepType} onValueChange={(v) => setNewDepType(v as DependencyType)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dependencyLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={newDepLag}
                    onChange={(e) => setNewDepLag(parseInt(e.target.value) || 0)}
                    className="w-20"
                    placeholder="Lag"
                  />
                  <Button
                    size="sm"
                    disabled={!newPredecessor}
                    onClick={async () => {
                      if (newPredecessor) {
                        await onAddDependency(newPredecessor, newDepType, newDepLag);
                        setNewPredecessor('');
                        setNewDepLag(0);
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label>Successors (read-only)</Label>
                {successorDeps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No successors</p>
                ) : (
                  <div className="space-y-2">
                    {successorDeps.map(dep => {
                      const succTask = allTasks.find(t => t.id === dep.task_id);
                      return (
                        <div key={dep.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{succTask?.wbs}</span>
                          <span className="text-sm">{succTask?.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {dep.type}{dep.lag ? (dep.lag > 0 ? `+${dep.lag}d` : `${dep.lag}d`) : ''}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-4">
              <div className="space-y-2">
                <Label>Assigned Resources</Label>
                {assignedResources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No resources assigned</p>
                ) : (
                  <div className="space-y-2">
                    {assignedResources.map(a => {
                      const resource = resources.find(r => r.id === a.resource_id);
                      return (
                        <div key={a.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{resource?.name}</span>
                            <Badge variant="secondary">{Math.round(a.units * 100)}%</Badge>
                            <span className="text-sm text-muted-foreground">
                              {a.work_hours}h planned
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveAssignment(a.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Select value={newResourceId} onValueChange={setNewResourceId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select resource" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableResources.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={newResourceUnits}
                      onChange={(e) => setNewResourceUnits(parseInt(e.target.value) || 100)}
                      className="w-20"
                      min={0}
                      max={100}
                    />
                    <span className="text-sm">%</span>
                  </div>
                  <Button
                    size="sm"
                    disabled={!newResourceId}
                    onClick={async () => {
                      if (newResourceId) {
                        await onAddAssignment(newResourceId, newResourceUnits / 100);
                        setNewResourceId('');
                        setNewResourceUnits(100);
                      }
                    }}
                  >
                    Assign
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div>
                  <Label>Work (hours)</Label>
                  <Input
                    type="number"
                    value={mergedTask.work_hours || 0}
                    onChange={(e) => handleFieldChange('work_hours', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Actual Work</Label>
                  <Input
                    type="number"
                    value={mergedTask.actual_work_hours || 0}
                    onChange={(e) => handleFieldChange('actual_work_hours', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Remaining Work</Label>
                  <Input
                    type="number"
                    value={mergedTask.remaining_work_hours || 0}
                    onChange={(e) => handleFieldChange('remaining_work_hours', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={mergedTask.effort_driven || false}
                  onCheckedChange={(v) => handleFieldChange('effort_driven', v)}
                />
                <Label>Effort Driven</Label>
              </div>
            </TabsContent>

            {/* Advanced/Costs Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Cost
                  </Label>
                  <Input
                    type="number"
                    value={mergedTask.cost || 0}
                    onChange={(e) => handleFieldChange('cost', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Actual Cost</Label>
                  <Input
                    type="number"
                    value={mergedTask.actual_cost || 0}
                    onChange={(e) => handleFieldChange('actual_cost', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Fixed Cost</Label>
                  <Input
                    type="number"
                    value={mergedTask.fixed_cost || 0}
                    onChange={(e) => handleFieldChange('fixed_cost', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Fixed Cost Accrual</Label>
                  <Select
                    value={mergedTask.fixed_cost_accrual || 'prorated'}
                    onValueChange={(v) => handleFieldChange('fixed_cost_accrual', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">At Start</SelectItem>
                      <SelectItem value="end">At End</SelectItem>
                      <SelectItem value="prorated">Prorated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Task Metadata
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">WBS:</span>
                    <span className="ml-2 font-mono">{task.wbs}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID:</span>
                    <span className="ml-2 font-mono text-xs">{task.id.slice(0, 8)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">{format(new Date(task.created_at), 'PPp')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="ml-2">{format(new Date(task.updated_at), 'PPp')}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
