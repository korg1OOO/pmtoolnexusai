import { useState } from 'react';
import { formatDate, exportToCSV } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  Filter,
  Plus,
  ChevronRight,
  Flag,
  Shield,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileCheck,
  ArrowRight,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Edit2,
  Link2,
  Loader2,
  Trash2,
  Table,
  List,
  Download,
} from 'lucide-react';
import { DataRegisterPage } from '@/components/ui/DataRegisterPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
import { Progress } from '@/components/ui/progress';
import { KPICard } from '@/components/enterprise/KPICard';
import { StatusIndicator } from '@/components/enterprise/StatusIndicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useMilestones, Milestone } from '@/hooks/useMilestones';
import { useStageGates, StageGate, GateCriteria } from '@/hooks/useStageGates';
import { toast } from 'sonner';

const STANDARD_COLUMNS: DynamicColumnDef<Milestone>[] = [
  { key: 'name', label: 'Milestone Name', width: 300, type: 'text', sticky: true },
  { key: 'status', label: 'Status', width: 140, type: 'select', options: ['on-track', 'at-risk', 'overdue', 'completed'] },
  { key: 'due_date', label: 'Due Date', width: 140, type: 'date' },
  { key: 'progress', label: 'Progress (%)', width: 120, type: 'text' },
];

// Removed local interfaces in favor of hook types


// Mocks removed - using useStageGates hook


const getStatusColor = (status: Milestone['status']) => {
  switch (status) {
    case 'completed': return 'green';
    case 'on-track': return 'green';
    case 'at-risk': return 'amber';
    case 'overdue': return 'red';
  }
};

const getStatusBadgeVariant = (status: Milestone['status']) => {
  switch (status) {
    case 'completed': return 'completed' as const;
    case 'on-track': return 'active' as const;
    case 'at-risk': return 'warning' as const;
    case 'overdue': return 'critical' as const;
  }
};

const getGateStatusBadge = (status: StageGate['status']) => {
  switch (status) {
    case 'approved': return { variant: 'completed' as const, label: 'Approved', icon: CheckCircle2 };
    case 'rejected': return { variant: 'critical' as const, label: 'Rejected', icon: XCircle };
    case 'in-review': return { variant: 'warning' as const, label: 'In Review', icon: Clock };
    case 'deferred': return { variant: 'secondary' as const, label: 'Deferred', icon: Pause };
    case 'pending': return { variant: 'outline' as const, label: 'Pending', icon: Clock };
  }
};

const getCriteriaIcon = (status: GateCriteria['status']) => {
  switch (status) {
    case 'met': return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'not-met': return <XCircle className="h-4 w-4 text-destructive" />;
    case 'partial': return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'na': return <span className="text-muted-foreground text-xs">N/A</span>;
  }
};

export default function MilestonesView() {
  const { settings } = useProjectContext();
  const { data: milestones, isLoading: milestonesLoading, createMilestone, updateMilestone, deleteMilestone } = useMilestones(settings.id);
  const { gates, isLoading: gatesLoading, approveGate } = useStageGates(settings.id);
  const { can } = usePermissions(settings?.id);
  const canCreate = can('milestone.create');
  const canEdit = can('milestone.edit');
  const canDelete = can('milestone.delete');
  const isLoading = milestonesLoading || gatesLoading;

  const [subViewMode, setSubViewMode] = useState<'timeline' | 'list' | 'gates'>('timeline');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [customColumns, setCustomColumns] = useState<DynamicColumnDef<Milestone>[]>([]);
  const [selectedGate, setSelectedGate] = useState<StageGate | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Creation State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    name: '',
    status: 'on-track',
    due_date: new Date().toISOString().split('T')[0],
    progress: 0,
    project_id: settings.id
  });

  const filteredMilestones = milestones ? (filterStatus
    ? milestones.filter(m => m.status === filterStatus)
    : milestones) : [];

  const statusCounts = {
    completed: milestones?.filter(m => m.status === 'completed').length || 0,
    onTrack: milestones?.filter(m => m.status === 'on-track').length || 0,
    atRisk: milestones?.filter(m => m.status === 'at-risk').length || 0,
    overdue: milestones?.filter(m => m.status === 'overdue').length || 0,
  };

  const handleCellSave = async (rowId: string, key: string, value: string) => {
    const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
    const item = milestones?.find(i => i.id === rowId);
    if (!item) return;

    if (isCustom) {
      const cf = { ...(item.custom_fields ?? {}), [key]: value };
      await updateMilestone.mutateAsync({ id: rowId, updates: { custom_fields: cf } });
    } else {
      if (key === 'progress') {
        const numVal = parseInt(value, 10);
        await updateMilestone.mutateAsync({ id: rowId, updates: { [key]: isNaN(numVal) ? undefined : numVal } });
      } else {
        await updateMilestone.mutateAsync({ id: rowId, updates: { [key]: value } });
      }
    }
  };

  const handleCreate = async () => {
    try {
      await createMilestone.mutateAsync({ ...newMilestone, project_id: settings.id } as any);
      setIsCreateOpen(false);
      setNewMilestone({
        name: '',
        status: 'on-track',
        due_date: new Date().toISOString().split('T')[0],
        progress: 0,
        project_id: settings.id
      });
      toast.success('Milestone created');
    } catch (e) {
      // error handled in hook
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteMilestone.mutateAsync(deleteConfirmId);
    toast.success('Milestone deleted');
    setDeleteConfirmId(null);
  };

  const handleApprove = async (gate: StageGate) => {
    // Determine if we approve or start review
    if (gate.status === 'pending') {
      // Logic to start review could be added here
    }
    setSelectedGate(gate);
    setApprovalDialogOpen(true);
  };

  const confirmApproval = async (status: 'approved' | 'rejected') => {
    if (!selectedGate) return;
    try {
      await approveGate.mutateAsync({
        gateId: selectedGate.id,
        status,
        comments: approvalComment
      });
      setApprovalDialogOpen(false);
      setApprovalComment('');
    } catch (e) {
      // handled in hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'Status', 'Progress (%)', 'Due Date'];
    const rows = (milestones || []).map(m => [
      m.name,
      m.status,
      m.progress ?? 0,
      formatDate(m.due_date),
    ]);
    exportToCSV([headers, ...rows], 'milestones');
  };

  const toolbarFilters = (
    <div className="flex items-center gap-2 h-8">
      <Badge
        variant={filterStatus === null ? 'default' : 'outline'}
        className="cursor-pointer text-[10px] h-full flex items-center"
        onClick={() => setFilterStatus(null)}
      >
        All ({milestones?.length || 0})
      </Badge>
      <Badge
        variant={filterStatus === 'completed' ? 'completed' : 'outline'}
        className="cursor-pointer text-[10px] h-full flex items-center"
        onClick={() => setFilterStatus('completed')}
      >
        Completed ({statusCounts.completed})
      </Badge>
      <Badge
        variant={filterStatus === 'on-track' ? 'active' : 'outline'}
        className="cursor-pointer text-[10px] h-full flex items-center"
        onClick={() => setFilterStatus('on-track')}
      >
        On Track ({statusCounts.onTrack})
      </Badge>
      <Badge
        variant={filterStatus === 'at-risk' ? 'warning' : 'outline'}
        className="cursor-pointer text-[10px] h-full flex items-center"
        onClick={() => setFilterStatus('at-risk')}
      >
        At Risk ({statusCounts.atRisk})
      </Badge>
      <Badge
        variant={filterStatus === 'overdue' ? 'critical' : 'outline'}
        className="cursor-pointer text-[10px] h-full flex items-center"
        onClick={() => setFilterStatus('overdue')}
      >
        Overdue ({statusCounts.overdue})
      </Badge>
    </div>
  );

  const listModeControls = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCSV}>
        <Download className="h-3.5 w-3.5 mr-1.5" />Export CSV
      </Button>
      <div className="flex gap-1 p-1 bg-muted rounded-lg h-8 items-center border">
        {(['timeline', 'list', 'gates'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setSubViewMode(mode)}
            className={cn('px-3 py-1 rounded text-[10px] font-medium transition-all capitalize', subViewMode === mode ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            {mode === 'gates' ? 'Stage Gates' : mode}
          </button>
        ))}
      </div>
    </div>
  );

  const kpiCards = (
    <div className="grid grid-cols-4 gap-4">
      <KPICard
        title="Total Milestones"
        value={(milestones?.length || 0).toString()}
        subtitle="Project milestones"
        icon={Target}
        status="neutral"
      />
      <KPICard
        title="Completed"
        value={statusCounts.completed.toString()}
        subtitle={`${milestones?.length ? Math.round((statusCounts.completed / (milestones.length || 1)) * 100) : 0}% completion`}
        icon={CheckCircle2}
        status="success"
      />
      <KPICard
        title="Stage Gates"
        value={(gates?.length || 0).toString()}
        subtitle={`${gates?.filter(g => g.status === 'in-review').length || 0} awaiting approval`}
        icon={Shield}
        status="neutral"
      />
      <KPICard
        title="At Risk / Overdue"
        value={(statusCounts.atRisk + statusCounts.overdue).toString()}
        subtitle={`${statusCounts.overdue} overdue`}
        icon={AlertTriangle}
        status={statusCounts.overdue > 0 ? 'error' : 'warning'}
      />
    </div>
  );

  const listContent = (
    <div className="flex flex-col h-full space-y-6">
      {subViewMode === 'gates' && (
        <div className="space-y-6">
          {(gates || []).map((gate, index) => {
            const gateStatus = getGateStatusBadge(gate.status);
            const metCriteria = gate.criteria?.filter(c => c.status === 'met').length || 0;
            const approvedCount = gate.approvers?.filter(a => a.status === 'approved').length || 0;

            return (
              <motion.div
                key={gate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  'border-l-4',
                  gate.status === 'approved' && 'border-l-success',
                  gate.status === 'rejected' && 'border-l-destructive',
                  gate.status === 'in-review' && 'border-l-warning',
                  gate.status === 'pending' && 'border-l-muted-foreground'
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{gate.name}</CardTitle>
                          <Badge variant={gateStatus.variant}>
                            <gateStatus.icon className="h-3 w-3 mr-1" />
                            {gateStatus.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{gate.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedGate(gate)}>
                          <FileCheck className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        {gate.status === 'in-review' && (
                          <Button size="sm" onClick={() => handleApprove(gate)}>
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Gate Criteria */}
                    {gate.criteria && gate.criteria.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Criteria</p>
                        {gate.criteria.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            {getCriteriaIcon(c.status)}
                            <span className={c.status === 'met' ? 'line-through text-muted-foreground' : ''}>{c.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Approvers */}
                    {gate.approvers && gate.approvers.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Approvers</p>
                        <div className="flex flex-wrap gap-2">
                          {gate.approvers.map((a, i) => (
                            <span key={i} className={`text-xs px-2 py-1 rounded-full border ${a.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700' :
                              a.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' :
                                'bg-muted border-muted-foreground/20'
                              }`}>
                              {a.user?.full_name || a.user?.email || a.role || 'Approver'} · {a.status}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {((!gate.criteria || gate.criteria.length === 0) && (!gate.approvers || gate.approvers.length === 0)) && (
                      <p className="text-sm text-muted-foreground">No criteria or approvers defined for this gate.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Milestones List */}
      {subViewMode === 'list' && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr className="text-left text-xs text-muted-foreground uppercase">
                  <th className="p-3 font-medium">Milestone</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Progress</th>
                  <th className="p-3 font-medium">Due Date</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMilestones.map((milestone) => (
                  <motion.tr
                    key={milestone.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Flag className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{milestone.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={getStatusBadgeVariant(milestone.status)} className="capitalize">
                        {milestone.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Progress value={milestone.progress} className="h-1.5 w-20" />
                        <span className="text-xs font-mono">{milestone.progress}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs font-mono text-muted-foreground">{formatDate(milestone.due_date)}</td>
                    <td className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canDelete && <DropdownMenuItem onClick={() => handleDelete(milestone.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
                {filteredMilestones.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No milestones found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {subViewMode === 'timeline' && (
        <div className="space-y-4">
          {filteredMilestones.length === 0 && (
            <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/10 border-dashed">
              No milestones found. Create one to visualize not just a list, but a timeline.
            </div>
          )}
          {filteredMilestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-8"
            >
              {/* Timeline line */}
              {index < filteredMilestones.length - 1 && (
                <div className="absolute left-3 top-8 bottom-0 w-px bg-border -ml-px" />
              )}

              {/* Timeline dot */}
              <div className="absolute left-0 top-4">
                <StatusIndicator status={getStatusColor(milestone.status)} pulse={milestone.status !== 'completed'} />
              </div>

              <Card variant="interactive" className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground text-sm">{milestone.name}</h3>
                        <Badge variant={getStatusBadgeVariant(milestone.status)} className="capitalize text-[10px]">
                          {milestone.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right space-y-2 shrink-0">
                      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground font-mono">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(milestone.due_date)}</span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-end gap-2 mb-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase">Progress</span>
                          <span className="text-xs font-mono font-medium">{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-1.5 w-32" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Gate Review Dialog */}
      <Dialog open={!!selectedGate && approvalDialogOpen} onOpenChange={(open) => !open && setApprovalDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Gate: {selectedGate?.name}</DialogTitle>
            <DialogDescription>
              Provide your decision and comments for this stage gate.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Comments / Conditions</Label>
              <Textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Enter approval notes or rejection reasons..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmApproval('rejected')}>Reject</Button>
            <Button className="bg-success hover:bg-success/90" onClick={() => confirmApproval('approved')}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Milestone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this milestone? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMilestone.isPending}>
              {deleteMilestone.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Milestone</DialogTitle>
            <DialogDescription>Create a new key project milestone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newMilestone.name || ''}
                onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                placeholder="e.g. Phase 1 Completion"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newMilestone.due_date || ''}
                onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newMilestone.name || createMilestone.isPending}>
              {createMilestone.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <DataRegisterPage
      title="Milestones & Stage Gates"
      description="Track key deliverables and approval checkpoints"
      icon={Target}
      iconBgClass="bg-primary/20"
      iconColorClass="text-primary"
      toolbarFilters={toolbarFilters}
      listModeControls={listModeControls}
      onAddRow={canCreate ? () => setIsCreateOpen(true) : undefined}
      addLabel="Add Milestone"
      pdfFilename="milestones"
      data={filteredMilestones}
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
      onDeleteRows={canDelete ? (ids) => {
        ids.forEach(id => deleteMilestone.mutateAsync(id));
      } : undefined}
      emptyStateMessage={filteredMilestones.length === 0 ? 'No milestones found.' : 'No milestones match filters.'}
      kpiCards={kpiCards}
      listContent={listContent}
    />
  );
}
