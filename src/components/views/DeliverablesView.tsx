import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Package,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Link2,
  Calendar,
  User,
  MoreHorizontal,
  ArrowUpRight,
  Loader2,
  Trash2,
  Edit2,
  Download,
  List,
  Table
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { useProjectContext } from '@/contexts/ProjectContext';
import { useDeliverables, Deliverable } from '@/hooks/useDeliverables';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { toast } from 'sonner';

const STANDARD_COLUMNS: DynamicColumnDef<Deliverable>[] = [
  { key: 'name', label: 'Deliverable Name', width: 300, type: 'text', sticky: true },
  { key: 'description', label: 'Description', width: 300, type: 'text' },
  { key: 'type', label: 'Type', width: 140, type: 'select', options: ['document', 'system', 'process', 'training', 'other'] },
  { key: 'status', label: 'Status', width: 140, type: 'select', options: ['not-started', 'in-progress', 'review', 'approved'] },
  { key: 'phase', label: 'Phase', width: 140, type: 'text' },
  { key: 'due_date', label: 'Due Date', width: 140, type: 'date' },
  { key: 'progress', label: 'Progress (%)', width: 120, type: 'text' },
];

export default function DeliverablesView() {
  const { settings } = useProjectContext();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { data: deliverables, isLoading, createDeliverable, updateDeliverable, deleteDeliverable } = useDeliverables(settings.id);
  const { data: teamMembers } = useTeamMembers(settings.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'spreadsheet'>('list');
  const [customColumns, setCustomColumns] = useState<DynamicColumnDef<Deliverable>[]>([]);

  const handleCellSave = async (rowId: string, key: string, value: string) => {
    const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
    const item = deliverables?.find(i => i.id === rowId);
    if (!item) return;

    if (isCustom) {
      const cf = { ...(item.custom_fields ?? {}), [key]: value };
      await updateDeliverable.mutateAsync({ id: rowId, updates: { custom_fields: cf } });
    } else {
      if (key === 'progress') {
        const numVal = parseInt(value, 10);
        await updateDeliverable.mutateAsync({ id: rowId, updates: { [key]: isNaN(numVal) ? undefined : numVal } });
      } else {
        await updateDeliverable.mutateAsync({ id: rowId, updates: { [key]: value } });
      }
    }
  };

  const [newDeliverable, setNewDeliverable] = useState<Partial<Deliverable>>({
    name: '',
    description: '',
    status: 'not-started',
    type: 'document',
    progress: 0,
    acceptance_criteria: []
  });

  const filteredDeliverables = deliverables?.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const stats = {
    total: filteredDeliverables.length,
    approved: filteredDeliverables.filter(d => d.status === 'approved').length,
    inProgress: filteredDeliverables.filter(d => d.status === 'in-progress').length,
    review: filteredDeliverables.filter(d => d.status === 'review').length,
  };

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'system': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const handleCreate = async () => {
    try {
      await createDeliverable.mutateAsync(newDeliverable);
      setIsCreateOpen(false);
      setNewDeliverable({
        name: '',
        description: '',
        status: 'not-started',
        type: 'document',
        progress: 0,
        acceptance_criteria: []
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await confirm('Are you sure you want to delete this deliverable?', { confirmText: 'Delete', destructive: true })) {
      await deleteDeliverable.mutateAsync(id);
      if (selectedDeliverable?.id === id) setSelectedDeliverable(null);
    }
  }

  const downloadTraceability = () => {
    if (!deliverables) return;

    const headers = ['ID', 'Name', 'Type', 'Status', 'Owner', 'Due Date', 'Criteria Total', 'Criteria Met', 'Criteria Pending'];
    const rows = deliverables.map(d => [
      d.id,
      `"${d.name.replace(/"/g, '""')}"`,
      d.type,
      d.status,
      d.owner?.full_name || 'Unassigned',
      d.due_date,
      d.acceptance_criteria?.length || 0,
      d.acceptance_criteria?.filter(c => c.met).length || 0,
      d.acceptance_criteria?.filter(c => !c.met).length || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "deliverables_traceability_matrix.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Deliverables</h1>
              <p className="text-muted-foreground">Track project outputs and acceptance criteria</p>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Deliverable
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Deliverable</DialogTitle>
                <DialogDescription>Define a new output for this project.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newDeliverable.name}
                    onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
                    placeholder="e.g. Architecture Design"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newDeliverable.type || 'document'}
                    onValueChange={(v: any) => setNewDeliverable({ ...newDeliverable, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="process">Process</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <Select
                    value={newDeliverable.owner_id || ''}
                    onValueChange={(v) => setNewDeliverable({ ...newDeliverable, owner_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers?.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newDeliverable.description || ''}
                    onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newDeliverable.name || createDeliverable.isPending}>
                  {createDeliverable.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 border-b grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Deliverables</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{stats.review}</div>
            <p className="text-sm text-muted-foreground">In Review</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border-b flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'spreadsheet')} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="list" className="h-6 px-2.5 text-xs"><List className="h-3.5 w-3.5 mr-1.5" /> List</TabsTrigger>
              <TabsTrigger value="spreadsheet" className="h-6 px-2.5 text-xs"><Table className="h-3.5 w-3.5 mr-1.5" /> Spreadsheet</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative flex-1 w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deliverables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline" onClick={downloadTraceability}>
          <Download className="h-4 w-4 mr-2" />
          Export Traceability
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'spreadsheet' ? (
          <div className="flex-1 p-6 h-full overflow-hidden">
            <div className="h-full bg-background border rounded-md shadow-sm overflow-hidden min-h-[500px]">
              <DynamicDataGrid
                data={filteredDeliverables}
                baseColumns={STANDARD_COLUMNS}
                customColumns={customColumns}
                idExtractor={(item) => item.id}
                customFieldExtractor={(item, key) => String(item.custom_fields?.[key] ?? '')}
                onCellSave={handleCellSave}
                onDeleteRows={(ids) => {
                  ids.forEach(id => deleteDeliverable.mutateAsync(id));
                }}
                onAddColumn={(col) => {
                  if (customColumns.find(c => c.key === col.key)) {
                    toast.error('Column already exists');
                    return;
                  }
                  setCustomColumns(prev => [...prev, col]);
                  toast.success(`Column "${col.label}" added`);
                }}
                onRemoveColumn={(key) => setCustomColumns(prev => prev.filter(c => c.key !== key))}
                onAddRow={() => setIsCreateOpen(true)}
                emptyStateMessage={filteredDeliverables.length === 0 ? 'No deliverables found.' : 'No deliverables match your filters.'}
                containerStyles="h-full border-0"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Deliverables List */}
            <div className="flex-1 overflow-auto p-6">
              {!filteredDeliverables.length ? (
                <div className="text-center p-12 text-muted-foreground">
                  No deliverables found. Create one to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDeliverables.map((deliverable) => (
                    <motion.div
                      key={deliverable.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ x: 2 }}
                      onClick={() => setSelectedDeliverable(deliverable)}
                      className={cn(
                        "p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer group relative",
                        selectedDeliverable?.id === deliverable.id && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            deliverable.status === 'approved' ? 'bg-success/20' :
                              deliverable.status === 'in-progress' ? 'bg-primary/20' :
                                deliverable.status === 'review' ? 'bg-warning/20' : 'bg-muted'
                          )}>
                            {getTypeIcon(deliverable.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{deliverable.name}</h3>
                              <Badge variant={
                                deliverable.status === 'approved' ? 'success' :
                                  deliverable.status === 'in-progress' ? 'info' :
                                    deliverable.status === 'review' ? 'warning' : 'secondary'
                              }>
                                {deliverable.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{deliverable.description}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDelete(deliverable.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          {deliverable.owner?.full_name || 'Unassigned'}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {deliverable.due_date ? `Due: ${new Date(deliverable.due_date).toLocaleDateString()}` : 'No due date'}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <Progress value={deliverable.progress} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{deliverable.progress}%</span>
                      </div>

                      {/* Acceptance Criteria Preview */}
                      <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">Acceptance Criteria:</span>
                        <span className="text-success">
                          {deliverable.acceptance_criteria?.filter(c => c.met).length || 0} met
                        </span>
                        <span className="text-muted-foreground">
                          {deliverable.acceptance_criteria?.filter(c => !c.met).length || 0} pending
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Detail Panel */}
            {selectedDeliverable && (
              <div className="w-96 border-l p-6 overflow-auto bg-muted/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Details</h2>
                  <div className="flex items-center gap-2">
                    {/* Future: Edit button logic */}
                    <Button variant="ghost" size="iconSm" onClick={() => setSelectedDeliverable(null)}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="criteria">Criteria</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Phase</label>
                      <p className="text-sm">{selectedDeliverable.phase || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Type</label>
                      <p className="text-sm capitalize">{selectedDeliverable.type || 'Other'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Owner</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedDeliverable.owner?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {(selectedDeliverable.owner?.full_name || 'U').split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{selectedDeliverable.owner?.full_name || 'Unassigned'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                      <p className="text-sm">{selectedDeliverable.due_date ? new Date(selectedDeliverable.due_date).toLocaleDateString() : 'None'}</p>
                    </div>
                    {selectedDeliverable.completed_date && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Completed</label>
                        <p className="text-sm">{new Date(selectedDeliverable.completed_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="criteria" className="space-y-3">
                    {selectedDeliverable.acceptance_criteria?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No acceptance criteria defined.</p>
                    )}
                    {selectedDeliverable.acceptance_criteria?.map((criteria, i) => (
                      <div key={i} className={cn(
                        "p-3 rounded-lg border",
                        criteria.met ? 'bg-success/10 border-success/30' : 'bg-muted/50'
                      )}>
                        <div className="flex items-start gap-2">
                          <div
                            className="cursor-pointer mt-0.5"
                            onClick={() => {
                              const newCriteria = [...selectedDeliverable.acceptance_criteria];
                              newCriteria[i].met = !newCriteria[i].met;
                              updateDeliverable.mutate({
                                id: selectedDeliverable.id,
                                updates: { acceptance_criteria: newCriteria }
                              });
                              // Optimistic UI update in local state for smoothness
                              setSelectedDeliverable({ ...selectedDeliverable, acceptance_criteria: newCriteria });
                            }}
                          >
                            {criteria.met ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                            )}
                          </div>
                          <span className={cn("text-sm", criteria.met && "line-through text-muted-foreground")}>{criteria.text}</span>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </>
        )}
      </div>
      <ConfirmDialog />
    </div>
  );
}
