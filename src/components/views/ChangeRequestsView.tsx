import React, { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FileEdit,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  DollarSign,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Loader2,
  List,
  Table,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useAuth } from '@/hooks/useAuth';
import { useChangeRequests, ChangeRequest, useUpdateChangeRequest, useCreateChangeRequest } from '@/hooks/useChangeRequests';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntityFormDialog } from '@/components/ui/EntityFormDialog';
import { toast } from 'sonner';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
import { DataRegisterPage } from '@/components/ui/DataRegisterPage';

const STANDARD_COLUMNS: DynamicColumnDef<ChangeRequest>[] = [
  { key: 'title', label: 'Title', width: 240, type: 'text', sticky: true },
  { key: 'description', label: 'Description', width: 300, type: 'text' },
  { key: 'type', label: 'Type', width: 130, type: 'select', options: ['scope', 'schedule', 'cost', 'resource', 'other'] },
  { key: 'priority', label: 'Priority', width: 120, type: 'select', options: ['low', 'medium', 'high', 'critical'] },
  { key: 'status', label: 'Status', width: 130, type: 'select', options: ['pending', 'approved', 'rejected', 'implemented'] },
  { key: 'requested_by_name', label: 'Requested By', width: 150, type: 'text' },
  { key: 'requested_at', label: 'Requested At', width: 140, type: 'date' },
  { key: 'justification', label: 'Justification', width: 250, type: 'text' },
];

export default function ChangeRequestsView() {
  const { settings } = useProjectContext();
  const { user } = useAuth();
  const { data: changeRequests = [], isLoading } = useChangeRequests(settings.id);
  const updateCR = useUpdateChangeRequest();
  const createCR = useCreateChangeRequest();
  const { can } = usePermissions(settings?.id);
  const canCreate = can('task.create');
  const canEdit = can('task.edit');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [customColumns, setCustomColumns] = useState<DynamicColumnDef<ChangeRequest>[]>([]);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'scope' as 'scope' | 'schedule' | 'cost' | 'resource' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    justification: '',
  });

  const handleCellSave = async (rowId: string, key: string, value: string) => {
    const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
    const item = changeRequests.find(i => i.id === rowId);
    if (!item) return;

    if (isCustom) {
      const cf = { ...(item.custom_fields ?? {}), [key]: value };
      await updateCR.mutateAsync({ id: rowId, custom_fields: cf });
    } else {
      await updateCR.mutateAsync({ id: rowId, [key]: value });
    }
  };

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedCR) return;
    await updateCR.mutateAsync({ id: selectedCR.id, status });
    setSelectedCR(prev => prev ? { ...prev, status } : null);
  };

  const handleCreateCR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.id || !form.title) return;

    await createCR.mutateAsync({
      project_id: settings.id,
      title: form.title,
      description: form.description,
      type: form.type,
      priority: form.priority,
      status: 'pending',
      requested_by_id: user?.id ?? '',
      requested_by_name: user?.user_metadata?.full_name || 'Project Manager',
      requested_at: new Date().toISOString(),
      justification: form.justification,
    });

    setAddDialogOpen(false);
    setForm({ title: '', description: '', type: 'scope', priority: 'medium', justification: '' });
  };

  const filteredCRs = changeRequests.filter(cr =>
    cr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cr.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Helper to safely get impact details
  const getImpactDetails = (cr: ChangeRequest) => {
    const details = cr.impact_details as Record<string, unknown> | null;
    return {
      cost: Number(details?.cost) || 0,
      schedule: Number(details?.schedule) || 0,
      risk: (details?.risk as string) || 'low',
      scope: (details?.scope as string) || '',
    };
  };

  const stats = {
    total: changeRequests.length,
    pending: changeRequests.filter(cr => cr.status === 'pending').length,
    approved: changeRequests.filter(cr => cr.status === 'approved').length,
    totalCostImpact: changeRequests
      .filter(cr => cr.status === 'approved')
      .reduce((sum, cr) => sum + getImpactDetails(cr).cost, 0),
    totalScheduleImpact: changeRequests
      .filter(cr => cr.status === 'approved')
      .reduce((sum, cr) => sum + getImpactDetails(cr).schedule, 0),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'implemented': return <CheckCircle2 className="h-4 w-4 text-primary" />;
      default: return <FileEdit className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scope': return 'bg-purple-500/20 text-purple-600';
      case 'schedule': return 'bg-blue-500/20 text-blue-600';
      case 'cost': return 'bg-amber-500/20 text-amber-600';
      case 'resource': return 'bg-green-500/20 text-green-600';
      default: return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpiCards = (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-sm text-muted-foreground">Total Requests</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          <p className="text-sm text-muted-foreground">Pending Approval</p>
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
          <div className={cn(
            "text-2xl font-bold",
            stats.totalCostImpact > 0 ? 'text-destructive' : 'text-success'
          )}>
            {stats.totalCostImpact > 0 ? '+' : ''}${(stats.totalCostImpact / 1000).toFixed(0)}K
          </div>
          <p className="text-sm text-muted-foreground">Cost Impact</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className={cn(
            "text-2xl font-bold",
            stats.totalScheduleImpact > 0 ? 'text-destructive' : 'text-success'
          )}>
            {stats.totalScheduleImpact > 0 ? '+' : ''}{stats.totalScheduleImpact} days
          </div>
          <p className="text-sm text-muted-foreground">Schedule Impact</p>
        </CardContent>
      </Card>
    </>
  );

  const listContent = (
    <div className="flex flex-col md:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-4 w-full">
        {filteredCRs.map((cr) => (
          <motion.div
            key={cr.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ x: 2 }}
            onClick={() => setSelectedCR(cr)}
            className={cn(
              "p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer",
              selectedCR?.id === cr.id && 'border-primary bg-primary/5'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                {getStatusIcon(cr.status || 'pending')}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{cr.id.slice(0, 8)}</span>
                    <h3 className="font-semibold">{cr.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{cr.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-2 py-1 rounded text-xs font-medium", getTypeColor(cr.type || 'scope'))}>
                  {cr.type}
                </span>
                <Badge variant={(cr.status === 'pending' ? 'warning' : cr.status === 'approved' ? 'success' : 'destructive') as any}>
                  {cr.status || 'pending'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                {cr.requested_by_name || 'Anonymous'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {cr.requested_at ? new Date(cr.requested_at).toLocaleDateString() : 'N/A'}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={cr.priority === 'critical' ? 'destructive' : cr.priority === 'high' ? 'warning' : 'secondary'}>
                  {cr.priority}
                </Badge>
              </div>
            </div>

            {/* Impact Preview */}
            <div className="mt-3 pt-3 border-t flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className={cn(
                  (Number((cr.impact_details as any)?.schedule) || 0) > 0 ? 'text-destructive' : (Number((cr.impact_details as any)?.schedule) || 0) < 0 ? 'text-success' : ''
                )}>
                  {(Number((cr.impact_details as any)?.schedule) || 0) > 0 ? '+' : ''}{Number((cr.impact_details as any)?.schedule) || 0} days
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className={cn(
                  (Number((cr.impact_details as any)?.cost) || 0) > 0 ? 'text-destructive' : (Number((cr.impact_details as any)?.cost) || 0) < 0 ? 'text-success' : ''
                )}>
                  {(Number((cr.impact_details as any)?.cost) || 0) > 0 ? '+' : ''}${Math.abs((Number((cr.impact_details as any)?.cost) || 0) / 1000).toFixed(0)}K
                </span>
              </div>
              <Badge variant={
                (cr.impact_details as any)?.risk === 'high' ? 'destructive' :
                  (cr.impact_details as any)?.risk === 'medium' ? 'warning' : 'success'
              }>
                {(cr.impact_details as any)?.risk || 'low'} risk
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedCR && (
        <div className="w-full md:w-96 border rounded-lg p-6 bg-card shrink-0 sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Change Request Details</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {selectedCR.type || 'General'}
              </Badge>
              <Button variant="ghost" size="iconSm" onClick={() => setSelectedCR(null)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="impact">Impact</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <p className="text-sm capitalize">{selectedCR.type}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Badge variant={(selectedCR.priority === 'critical' ? 'destructive' : selectedCR.priority === 'high' ? 'warning' : 'secondary') as any}>
                  {selectedCR.priority || 'medium'}
                </Badge>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Requested By</label>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {(selectedCR.requested_by_name || 'A').split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{selectedCR.requested_by_name || 'Anonymous'}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Justification</label>
                <p className="text-sm mt-1">{selectedCR.justification || 'No justification provided.'}</p>
              </div>
              {selectedCR.alternatives && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Alternatives Considered</label>
                  <p className="text-sm mt-1">{selectedCR.alternatives}</p>
                </div>
              )}
              {selectedCR.approved_by_name && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Approver</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {selectedCR.approved_by_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{selectedCR.approved_by_name}</span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="impact" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Schedule Impact</span>
                    <span className={cn(
                      "font-semibold",
                      (Number((selectedCR.impact_details as any)?.schedule) || 0) > 0 ? 'text-destructive' : 'text-success'
                    )}>
                      {(Number((selectedCR.impact_details as any)?.schedule) || 0) > 0 ? '+' : ''}{Number((selectedCR.impact_details as any)?.schedule) || 0} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cost Impact</span>
                    <span className={cn(
                      "font-semibold",
                      (Number((selectedCR.impact_details as any)?.cost) || 0) > 0 ? 'text-destructive' : 'text-success'
                    )}>
                      {(Number((selectedCR.impact_details as any)?.cost) || 0) > 0 ? '+' : ''}${(Number((selectedCR.impact_details as any)?.cost) || 0) / 1000}K
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Risk Level</span>
                    <Badge variant={
                      (selectedCR.impact_details as any)?.risk === 'high' ? 'destructive' :
                        (selectedCR.impact_details as any)?.risk === 'medium' ? 'warning' : 'success'
                    }>
                      {(selectedCR.impact_details as any)?.risk || 'low'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Scope Impact</label>
                <p className="text-sm mt-1">{(selectedCR.impact_details as any)?.scope || 'No scope impact described.'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Affected Tasks</label>
                <div className="mt-1 space-y-1">
                  {Array.isArray(selectedCR.affected_tasks) && selectedCR.affected_tasks.map((taskId: any) => (
                    <Badge key={taskId} variant="outline" className="mr-1">
                      {taskId}
                    </Badge>
                  ))}
                  {(!selectedCR.affected_tasks || (Array.isArray(selectedCR.affected_tasks) && selectedCR.affected_tasks.length === 0)) && (
                    <p className="text-xs text-muted-foreground italic">No tasks specified.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {selectedCR.status === 'pending' && canEdit && (
            <div className="mt-6 pt-4 border-t flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleUpdateStatus('rejected')}
                disabled={updateCR.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleUpdateStatus('approved')}
                disabled={updateCR.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <DataRegisterPage
        title="Change Requests"
        description="Manage scope, schedule, and cost change requests"
        icon={FileEdit}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        toolbarFilters={
          <Button variant="outline" size="sm" className="h-8 text-xs border-border/60">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filter
          </Button>
        }
        onAddRow={canCreate ? () => setAddDialogOpen(true) : undefined}
        addLabel="New Change Request"
        pdfFilename="change-requests"
        data={changeRequests}
        baseColumns={STANDARD_COLUMNS}
        customColumns={customColumns}
        idExtractor={(item) => item.id}
        customFieldExtractor={(item, key) => String(item.custom_fields?.[key] ?? '')}
        onCellSave={canEdit ? handleCellSave : undefined}
        onAddColumn={(col) => {
          if (customColumns.find(c => c.key === col.key)) {
            toast.error('Column already exists');
            return;
          }
          setCustomColumns(prev => [...prev, col]);
          toast.success(`Column "${col.label}" added`);
        }}
        onRemoveColumn={(key) => setCustomColumns(prev => prev.filter(c => c.key !== key))}
        onDeleteRows={() => toast.error("Bulk deletion not supported for change requests yet.")}
        emptyStateMessage={changeRequests.length === 0 ? "No change requests added yet." : "No requests match."}
        kpiCards={kpiCards}
        listContent={listContent}
      />

      <EntityFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title="Create Change Request"
        description="Submit a new change request for approval."
        onSubmit={handleCreateCR}
        loading={createCR.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g., Increase API rate limits"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scope">Scope</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="cost">Cost</SelectItem>
                  <SelectItem value="resource">Resource</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Detailed description of the proposed change"
            />
          </div>
          <div className="space-y-2">
            <Label>Justification</Label>
            <Textarea
              value={form.justification}
              onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
              placeholder="Why is this change necessary?"
            />
          </div>
        </div>
      </EntityFormDialog>
    </>
  );
}
