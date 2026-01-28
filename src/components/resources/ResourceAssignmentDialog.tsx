import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useResources,
  useResourceAssignments,
  useCreateResourceAssignment,
  useUpdateResourceAssignment,
  useDeleteResourceAssignment,
  Resource,
  ResourceAssignment,
} from '@/hooks/useResources';
import { toast } from 'sonner';

interface ResourceAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskName: string;
  projectId: string;
}

export function ResourceAssignmentDialog({
  open,
  onOpenChange,
  taskId,
  taskName,
  projectId,
}: ResourceAssignmentDialogProps) {
  const { data: resources = [], isLoading: resourcesLoading } = useResources(projectId);
  const { data: assignments = [], isLoading: assignmentsLoading } = useResourceAssignments(taskId);
  const createAssignment = useCreateResourceAssignment();
  const updateAssignment = useUpdateResourceAssignment();
  const deleteAssignment = useDeleteResourceAssignment();

  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [units, setUnits] = useState(1);
  const [workHours, setWorkHours] = useState(8);

  // Get available resources (not already assigned)
  const assignedResourceIds = assignments.map((a) => a.resource_id);
  const availableResources = resources.filter((r) => !assignedResourceIds.includes(r.id));

  const handleAddAssignment = async () => {
    if (!selectedResourceId) {
      toast.error('Please select a resource');
      return;
    }

    await createAssignment.mutateAsync({
      task_id: taskId,
      resource_id: selectedResourceId,
      units,
      work_hours: workHours,
      actual_work_hours: 0,
      remaining_work_hours: workHours,
      start_date: null,
      end_date: null,
      cost: 0,
      actual_cost: 0,
    });

    setSelectedResourceId('');
    setUnits(1);
    setWorkHours(8);
  };

  const handleUpdateUnits = async (assignment: ResourceAssignment, newUnits: number) => {
    await updateAssignment.mutateAsync({
      id: assignment.id,
      units: newUnits,
    });
  };

  const handleUpdateWorkHours = async (assignment: ResourceAssignment, newHours: number) => {
    await updateAssignment.mutateAsync({
      id: assignment.id,
      work_hours: newHours,
      remaining_work_hours: newHours - assignment.actual_work_hours,
    });
  };

  const handleDeleteAssignment = async (assignment: ResourceAssignment) => {
    await deleteAssignment.mutateAsync({
      id: assignment.id,
      taskId,
    });
  };

  const isLoading = resourcesLoading || assignmentsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resource Assignments</DialogTitle>
          <DialogDescription>
            Assign resources to task: <strong>{taskName}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add new assignment */}
            {availableResources.length > 0 && (
              <div className="flex items-end gap-3 p-3 border rounded-lg bg-muted/30">
                <div className="flex-1">
                  <Label className="text-xs">Resource</Label>
                  <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableResources.map((resource) => (
                        <SelectItem key={resource.id} value={resource.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {resource.name}
                            <span className="text-muted-foreground">
                              (${resource.standard_rate}/hr)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label className="text-xs">Units (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="10"
                    value={units * 100}
                    onChange={(e) => setUnits(parseFloat(e.target.value) / 100)}
                  />
                </div>
                <div className="w-24">
                  <Label className="text-xs">Work (hrs)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={workHours}
                    onChange={(e) => setWorkHours(parseFloat(e.target.value))}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAddAssignment}
                  disabled={!selectedResourceId || createAssignment.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            )}

            {/* Current assignments */}
            {assignments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Work (hrs)</TableHead>
                    <TableHead className="text-right">Actual (hrs)</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => {
                    const resource = assignment.resource;
                    const estimatedCost = resource
                      ? assignment.work_hours * resource.standard_rate
                      : 0;

                    return (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {resource?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-muted-foreground capitalize">
                          {resource?.type || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            max="200"
                            step="10"
                            className="h-7 w-20 text-right"
                            value={(assignment.units * 100).toFixed(0)}
                            onChange={(e) =>
                              handleUpdateUnits(assignment, parseFloat(e.target.value) / 100)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            className="h-7 w-20 text-right"
                            value={assignment.work_hours}
                            onChange={(e) =>
                              handleUpdateWorkHours(assignment, parseFloat(e.target.value))
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {assignment.actual_work_hours}h
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ${resource?.standard_rate.toFixed(2)}/hr
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${estimatedCost.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAssignment(assignment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-8 border rounded-lg">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No resources assigned to this task.</p>
              </div>
            )}

            {availableResources.length === 0 && assignments.length > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                All resources have been assigned to this task.
              </p>
            )}

            {resources.length === 0 && (
              <p className="text-sm text-destructive text-center">
                No resources defined for this project. Create resources in the Resource Sheet first.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
