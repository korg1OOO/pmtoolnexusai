import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProjectResources } from '@/hooks/useProjectResources';
import { Plus, Trash2 } from 'lucide-react';
import type { Task } from '@/types/project';
import { format } from 'date-fns';
import { TaskComments } from './TaskComments';
import { useRealtime } from '@/hooks/useRealtime';

interface TaskInformationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task;
    projectId: string; // Add projectId explicitly
    onSave: (taskId: string, updates: Partial<Task>, assignments?: any[]) => Promise<void>;
}

export function TaskInformationDialog({ open, onOpenChange, task, projectId, onSave }: TaskInformationDialogProps) {
    const [activeTab, setActiveTab] = useState('general');
    const { resources } = useProjectResources();
    const [formData, setFormData] = useState<Partial<Task>>({
        name: task.name,
        progress: task.progress,
        notes: task.notes,
        priority: task.priority,
        constraintType: task.constraintType || 'ASAP',
        constraintDate: task.constraintDate,
        effortDriven: task.effortDriven || false,
        manuallyScheduled: task.manuallyScheduled || false,
        work: task.work || 0,
        cost: task.cost || 0
    });

    const [assignments, setAssignments] = useState<any[]>([]);

    useEffect(() => {
        // Initialize assignments from task if available
        if (task.assignments) {
            setAssignments(task.assignments.map((a: any) => ({
                resourceId: a.resourceId,
                units: a.units || a.allocationPercentage || 100
            })));
        } else {
            setAssignments([]);
        }
    }, [task]);


    // Lock task on open, unlock on close
    useEffect(() => {
        if (!task || !projectId) return;
        // Need access to send function of realtime. 
        // We can import useRealtime here or pass a lock function.
        // Importing useRealtime to get send capability:
    }, []);

    // Actually, TaskInformationDialog needs 'send' access. 
    // It's cleaner to handle this in ProjectPlanView but we need to know when it closes.
    // Let's implement useRealtime here.
    const { send } = useRealtime(projectId);

    useEffect(() => {
        if (open && send) {
            send({
                type: 'cell_lock',
                data: { cellId: `task-${task.id}:edit`, projectId }
            });
        }

        return () => {
            if (open && send) {
                send({
                    type: 'cell_unlock',
                    data: { cellId: `task-${task.id}:edit`, projectId }
                });
            }
        }
    }, [open, task.id, projectId, send]);

    const handleChange = (field: keyof Task, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAssignmentChange = (index: number, field: string, value: any) => {
        const newAssignments = [...assignments];
        newAssignments[index] = { ...newAssignments[index], [field]: value };
        setAssignments(newAssignments);
    };

    const addAssignment = () => {
        setAssignments([...assignments, { resourceId: '', units: 100 }]);
    };

    const removeAssignment = (index: number) => {
        const newAssignments = [...assignments];
        newAssignments.splice(index, 1);
        setAssignments(newAssignments);
    };

    const handleSave = async () => {
        // Filter out empty assignments
        const validAssignments = assignments.filter(a => a.resourceId);
        // Map to format expected by backend
        const mappedAssignments = validAssignments.map(a => ({
            resourceId: a.resourceId,
            allocationPercentage: Number(a.units)
        }));

        await onSave(task.id, formData, mappedAssignments);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Task Information - {task.name}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="resources">Resources</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                        <TabsTrigger value="comments">Comments</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto py-4 px-1">
                        <TabsContent value="general" className="mt-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => handleChange('name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (days)</Label>
                                    <Input
                                        type="number"
                                        value={task.duration}
                                        disabled // Calculated usually
                                        className="bg-muted"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Percent Complete</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={0} max={100}
                                            value={formData.progress}
                                            onChange={e => handleChange('progress', parseInt(e.target.value))}
                                        />
                                        <span>%</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(val: any) => handleChange('priority', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <div className="text-sm font-mono border rounded-md p-2 bg-muted">
                                        {task.startDate ? format(new Date(task.startDate), 'PPP p') : '-'}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Finish Date</Label>
                                    <div className="text-sm font-mono border rounded-md p-2 bg-muted">
                                        {task.endDate ? format(new Date(task.endDate), 'PPP p') : '-'}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="resources" className="mt-0 space-y-4 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <Label>Resource Assignments</Label>
                                <Button size="sm" variant="outline" onClick={addAssignment}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Resource
                                </Button>
                            </div>

                            <div className="border rounded-md bg-card flex-1 overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Resource Name</TableHead>
                                            <TableHead className="w-[100px] text-right">Units (%)</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assignments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    No resources assigned.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            assignments.map((assignment, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Select
                                                            value={assignment.resourceId}
                                                            onValueChange={(val) => handleAssignmentChange(index, 'resourceId', val)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Resource" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {resources.map(r => (
                                                                    <SelectItem key={r.id} value={r.id}>
                                                                        {r.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={assignment.units}
                                                            onChange={(e) => handleAssignmentChange(index, 'units', e.target.value)}
                                                            className="text-right"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => removeAssignment(index)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="advanced" className="mt-0 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Constraint Type</Label>
                                    <Select
                                        value={formData.constraintType}
                                        onValueChange={(val) => handleChange('constraintType', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ASAP">As Soon As Possible</SelectItem>
                                            <SelectItem value="ALAP">As Late As Possible</SelectItem>
                                            <SelectItem value="MSO">Must Start On</SelectItem>
                                            <SelectItem value="MFO">Must Finish On</SelectItem>
                                            <SelectItem value="SNET">Start No Earlier Than</SelectItem>
                                            <SelectItem value="SNLT">Start No Later Than</SelectItem>
                                            <SelectItem value="FNET">Finish No Earlier Than</SelectItem>
                                            <SelectItem value="FNLT">Finish No Later Than</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Constraint Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.constraintDate ? new Date(formData.constraintDate).toISOString().split('T')[0] : ''}
                                        onChange={e => handleChange('constraintDate', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="effortDriven"
                                        checked={formData.effortDriven}
                                        onCheckedChange={(c) => handleChange('effortDriven', !!c)}
                                    />
                                    <Label htmlFor="effortDriven">Effort driven</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="manuallyScheduled"
                                        checked={formData.manuallyScheduled}
                                        onCheckedChange={(c) => handleChange('manuallyScheduled', !!c)}
                                    />
                                    <Label htmlFor="manuallyScheduled">Manually Scheduled</Label>
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <Label>WBS Code</Label>
                                <Input value={task.wbs} disabled className="font-mono bg-muted" />
                            </div>
                        </TabsContent>

                        <TabsContent value="notes" className="mt-0 h-full">
                            <Textarea
                                className="h-full min-h-[300px]"
                                placeholder="Enter notes..."
                                value={formData.notes || ''}
                                onChange={e => handleChange('notes', e.target.value)}
                            />
                        </TabsContent>

                        <TabsContent value="comments" className="mt-0 h-full">
                            <TaskComments taskId={task.id} projectId={projectId} />
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>OK</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
