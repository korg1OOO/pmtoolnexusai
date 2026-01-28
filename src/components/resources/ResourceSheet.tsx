import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  useResources,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  Resource,
} from '@/hooks/useResources';
import { toast } from 'sonner';

interface ResourceSheetProps {
  projectId: string;
}

export function ResourceSheet({ projectId }: ResourceSheetProps) {
  const { data: resources = [], isLoading } = useResources(projectId);
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'work' as 'work' | 'material' | 'cost',
    max_units: 1,
    standard_rate: 0,
    overtime_rate: 0,
    cost_per_use: 0,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      type: 'work',
      max_units: 1,
      standard_rate: 0,
      overtime_rate: 0,
      cost_per_use: 0,
      notes: '',
    });
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('Resource name is required');
      return;
    }

    await createResource.mutateAsync({
      project_id: projectId,
      name: formData.name,
      email: formData.email || null,
      type: formData.type,
      max_units: formData.max_units,
      standard_rate: formData.standard_rate,
      overtime_rate: formData.overtime_rate,
      cost_per_use: formData.cost_per_use,
      notes: formData.notes || null,
      calendar_id: null,
    });

    resetForm();
    setShowAddDialog(false);
  };

  const handleEdit = (resource: Resource) => {
    setEditingId(resource.id);
    setFormData({
      name: resource.name,
      email: resource.email || '',
      type: resource.type,
      max_units: resource.max_units,
      standard_rate: resource.standard_rate,
      overtime_rate: resource.overtime_rate,
      cost_per_use: resource.cost_per_use,
      notes: resource.notes || '',
    });
  };

  const handleSaveEdit = async (resourceId: string) => {
    await updateResource.mutateAsync({
      id: resourceId,
      name: formData.name,
      email: formData.email || null,
      type: formData.type,
      max_units: formData.max_units,
      standard_rate: formData.standard_rate,
      overtime_rate: formData.overtime_rate,
      cost_per_use: formData.cost_per_use,
      notes: formData.notes || null,
    });

    setEditingId(null);
    resetForm();
  };

  const handleDelete = async (resource: Resource) => {
    if (confirm(`Delete resource "${resource.name}"?`)) {
      await deleteResource.mutateAsync({ id: resource.id, projectId });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'work':
        return 'bg-primary/20 text-primary';
      case 'material':
        return 'bg-amber-500/20 text-amber-600';
      case 'cost':
        return 'bg-green-500/20 text-green-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Resource Sheet</h2>
          <Badge variant="secondary">{resources.length} resources</Badge>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Resource
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Resource Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Max Units</TableHead>
              <TableHead className="text-right">Std. Rate ($/hr)</TableHead>
              <TableHead className="text-right">OT Rate ($/hr)</TableHead>
              <TableHead className="text-right">Cost/Use</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No resources yet. Click "Add Resource" to create one.
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>
                    {editingId === resource.id ? (
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <span className="font-medium">{resource.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === resource.id ? (
                      <Select
                        value={formData.type}
                        onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                      >
                        <SelectTrigger className="h-8 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="cost">Cost</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getTypeColor(resource.type)} variant="secondary">
                        {resource.type}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === resource.id ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <span className="text-muted-foreground">{resource.email || '—'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === resource.id ? (
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.max_units}
                        onChange={(e) => setFormData({ ...formData, max_units: parseFloat(e.target.value) })}
                        className="h-8 w-20 text-right"
                      />
                    ) : (
                      `${(resource.max_units * 100).toFixed(0)}%`
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === resource.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.standard_rate}
                        onChange={(e) => setFormData({ ...formData, standard_rate: parseFloat(e.target.value) })}
                        className="h-8 w-24 text-right"
                      />
                    ) : (
                      `$${resource.standard_rate.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === resource.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.overtime_rate}
                        onChange={(e) => setFormData({ ...formData, overtime_rate: parseFloat(e.target.value) })}
                        className="h-8 w-24 text-right"
                      />
                    ) : (
                      `$${resource.overtime_rate.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === resource.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cost_per_use}
                        onChange={(e) => setFormData({ ...formData, cost_per_use: parseFloat(e.target.value) })}
                        className="h-8 w-24 text-right"
                      />
                    ) : (
                      `$${resource.cost_per_use.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {editingId === resource.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleSaveEdit(resource.id)}
                          >
                            <Save className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingId(null);
                              resetForm();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(resource)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(resource)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Resource Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>
              Create a new resource for this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Resource Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="cost">Cost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="max_units">Max Units (%)</Label>
                <Input
                  id="max_units"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.max_units * 100}
                  onChange={(e) => setFormData({ ...formData, max_units: parseFloat(e.target.value) / 100 })}
                />
              </div>
              <div>
                <Label htmlFor="standard_rate">Std. Rate ($/hr)</Label>
                <Input
                  id="standard_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.standard_rate}
                  onChange={(e) => setFormData({ ...formData, standard_rate: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="overtime_rate">OT Rate ($/hr)</Label>
                <Input
                  id="overtime_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.overtime_rate}
                  onChange={(e) => setFormData({ ...formData, overtime_rate: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="cost_per_use">Cost/Use ($)</Label>
                <Input
                  id="cost_per_use"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_use}
                  onChange={(e) => setFormData({ ...formData, cost_per_use: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createResource.isPending}>
              Add Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
