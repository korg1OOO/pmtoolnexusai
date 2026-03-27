import React, { useState } from 'react';
import { formatDate, exportToCSV } from '@/lib/utils';
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
} from 'lucide-react';
import { DataRegisterPage } from '@/components/ui/DataRegisterPage';
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
    if (await confirm('Are you sure you want to delete this deliverable?', { confirmLabel: 'Delete', variant: 'destructive' })) {
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

  const toolbarFilters = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-8" onClick={() => {
        const headers = ['Name', 'Type', 'Status', 'Phase', 'Owner', 'Due Date', 'Progress (%)'];
        const rows = (deliverables || []).map(d => [
          d.name, d.type || '', d.status, d.phase || '',
          d.owner?.full_name || '', formatDate(d.due_date), d.progress ?? 0,
        ]);
        exportToCSV([headers, ...rows], 'deliverables');
      }}>
        <Download className="h-3.5 w-3.5 mr-2" />Export CSV
      </Button>
      <Button variant="outline" size="sm" className="h-8" onClick={downloadTraceability}>
        <Download className="h-3.5 w-3.5 mr-2" />
        Export Traceability
      </Button>
    </div>
  );

  const kpiCards = (
    <div className="grid grid-cols-4 gap-4">
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
  );

  const listContent = (
    <div className="flex h-full min-h-0 space-x-6">
      <div className="flex-1 overflow-auto pr-2 pb-8">
        {!filteredDeliverables.length ? (
          <div className="text-center p-12 text-muted-foreground border rounded-lg bg-muted/10 border-dashed">
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
                  <div className="flex items-center gap-2 text-muted-foreground h-4">
                    <User className="h-4 w-4" />
                    {deliverable.owner?.full_name || 'Unassigned'}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground h-4">
                    <Calendar className="h-4 w-4" />
                    {deliverable.due_date ? `Due: ${formatDate(deliverable.due_date)}` : 'No due date'}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Progress value={deliverable.progress} className="flex-1 h-1.5" />
                  <span className="text-xs font-medium font-mono">{deliverable.progress}%</span>
                </div>

                {/* Acceptance Criteria Preview */}
                <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground font-medium">Acceptance Criteria:</span>
                  <span className="text-success font-medium">
                    {deliverable.acceptance_criteria?.filter(c => c.met).length || 0} met
                  </span>
                  <span className="text-muted-foreground font-medium">
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
        <div className="w-96 border rounded-lg p-5 overflow-auto bg-card shadow-sm h-fit max-h-full shrink-0 relative flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">{selectedDeliverable.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant={
                  selectedDeliverable.status === 'approved' ? 'success' :
                    selectedDeliverable.status === 'in-progress' ? 'info' :
                      selectedDeliverable.status === 'review' ? 'warning' : 'secondary'
                } className="h-5 px-1.5 text-[10px]">
                  {selectedDeliverable.status}
                </Badge>
                <span className="text-xs text-muted-foreground capitalize">{selectedDeliverable.type}</span>
              </div>
            </div>
            <Button variant="ghost" size="iconSm" onClick={() => setSelectedDeliverable(null)} className="-mr-1 -mt-1 h-7 w-7">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-2 w-full h-8 mb-4">
              <TabsTrigger value="overview" className="text-xs h-6">Overview</TabsTrigger>
              <TabsTrigger value="criteria" className="text-xs h-6">Criteria</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 overflow-auto space-y-4 m-0 pr-1">
              {selectedDeliverable.description && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Description</label>
                  <p className="text-sm leading-relaxed">{selectedDeliverable.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Owner</label>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedDeliverable.owner?.avatar_url || ''} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {(selectedDeliverable.owner?.full_name || 'U').split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{selectedDeliverable.owner?.full_name || 'Unassigned'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Phase</label>
                  <p className="text-sm font-medium">{selectedDeliverable.phase || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Due Date</label>
                  <p className="text-sm font-medium">{formatDate(selectedDeliverable.due_date, 'None')}</p>
                </div>
                {selectedDeliverable.completed_date && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Completed</label>
                    <p className="text-sm font-medium">{formatDate(selectedDeliverable.completed_date)}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="criteria" className="flex-1 overflow-auto space-y-2.5 m-0 pr-1">
              {(!selectedDeliverable.acceptance_criteria || selectedDeliverable.acceptance_criteria.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg bg-muted/30">
                  No acceptance criteria defined.
                </div>
              )}
              {selectedDeliverable.acceptance_criteria?.map((criteria, i) => (
                <div key={i} className={cn(
                  "p-3 rounded-lg border transition-colors",
                  criteria.met ? 'bg-success/10 border-success/30' : 'bg-muted/30 hover:bg-muted/50'
                )}>
                  <div className="flex items-start gap-3">
                    <button
                      className="mt-0.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full transition-transform hover:scale-110 active:scale-95"
                      onClick={() => {
                        const newCriteria = [...(selectedDeliverable.acceptance_criteria || [])];
                        newCriteria[i].met = !newCriteria[i].met;
                        updateDeliverable.mutate({
                          id: selectedDeliverable.id,
                          updates: { acceptance_criteria: newCriteria }
                        });
                        setSelectedDeliverable({ ...selectedDeliverable, acceptance_criteria: newCriteria });
                      }}
                    >
                      {criteria.met ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 hover:border-muted-foreground/80 transition-colors" />
                      )}
                    </button>
                    <span className={cn("text-sm leading-snug transition-colors", criteria.met && "line-through text-muted-foreground")}>{criteria.text}</span>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
  );

  return (
    <>
      <DataRegisterPage
        title="Deliverables"
        description="Track project outputs and acceptance criteria"
        icon={Package}
        iconBgClass="bg-primary/20"
        iconColorClass="text-primary"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        toolbarFilters={toolbarFilters}
        onAddRow={() => setIsCreateOpen(true)}
        addLabel="Add Deliverable"
        pdfFilename="deliverables"
        data={filteredDeliverables}
        baseColumns={STANDARD_COLUMNS}
        customColumns={customColumns}
        idExtractor={(item) => item.id}
        customFieldExtractor={(item, key) => String(item.custom_fields?.[key] ?? '')}
        onCellSave={handleCellSave}
        onAddColumn={(col) => {
          if (customColumns.find(c => c.key === col.key)) {
            toast.error('Column already exists');
            return;
          }
          setCustomColumns(prev => [...prev, col]);
          toast.success(`Column "${col.label}" added`);
        }}
        onRemoveColumn={(key) => setCustomColumns(prev => prev.filter(c => c.key !== key))}
        onDeleteRows={(ids) => {
          ids.forEach(id => deleteDeliverable.mutateAsync(id));
        }}
        emptyStateMessage={filteredDeliverables.length === 0 ? 'No deliverables found.' : 'No deliverables match filters.'}
        kpiCards={kpiCards}
        listContent={listContent}
      />
      <ConfirmDialog />
    </>
  );
}
