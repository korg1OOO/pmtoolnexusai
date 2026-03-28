import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatDate, exportToCSV } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  X,
  User,
  Calendar,
  MoreHorizontal,
  AlertTriangle,
  Target,
  Users,
  PlayCircle,
  PauseCircle,
  CircleDot,
  Timer,
  Bell,
  Loader2,
  Table,
  List,
  Download,
} from 'lucide-react';
import { DataRegisterPage } from '@/components/ui/DataRegisterPage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KPICard } from '@/components/enterprise/KPICard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PDFExporter, PDFExportSection } from '@/components/common/PDFExporter';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useActions, Action, ActionInput, ActionPriority, ActionStatus } from '@/hooks/useActions';
import { toast } from 'sonner';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjectContext } from '@/contexts/ProjectContext';

const STANDARD_COLUMNS: DynamicColumnDef<Action>[] = [
  { key: 'title', label: 'Title', width: 240, type: 'text', sticky: true },
  { key: 'description', label: 'Description', width: 300, type: 'text' },
  { key: 'priority', label: 'Priority', width: 120, type: 'select', options: ['low', 'medium', 'high', 'critical'] },
  { key: 'status', label: 'Status', width: 130, type: 'select', options: ['pending', 'in-progress', 'completed', 'deferred', 'cancelled'] },
  { key: 'owner_name', label: 'Owner', width: 140, type: 'text' },
  { key: 'due_date', label: 'Due Date', width: 130, type: 'date' },
  { key: 'progress', label: 'Progress (%)', width: 120, type: 'text' },
  { key: 'sla_target_hours', label: 'SLA Target (h)', width: 130, type: 'text' },
  { key: 'created_by_name', label: 'Created By', width: 140, type: 'text' },
];

const getPriorityColor = (priority: ActionPriority) => {
  switch (priority) {
    case 'critical': return 'destructive';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'secondary';
  }
};

const getStatusColor = (status: ActionStatus): "secondary" | "info" | "warning" | "success" | "outline" => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'in-progress': return 'info';
    case 'completed': return 'success';
    case 'deferred': return 'warning';
    case 'cancelled': return 'outline';
  }
};

const getStatusIcon = (status: ActionStatus) => {
  switch (status) {
    case 'pending': return CircleDot;
    case 'in-progress': return PlayCircle;
    case 'completed': return CheckCircle2;
    case 'deferred': return PauseCircle;
    case 'cancelled': return X;
  }
};

function SLATimer({ action }: { action: Action }) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!action.sla_target_hours || !action.sla_started_at || action.status === 'completed' || action.status === 'cancelled') {
      setTimeRemaining(null);
      return;
    }

    const calculateRemaining = () => {
      const startTime = new Date(action.sla_started_at!).getTime();
      const targetTime = startTime + (action.sla_target_hours! * 3600000);
      return (targetTime - Date.now()) / 3600000;
    };

    setTimeRemaining(calculateRemaining());

    const timer = setInterval(() => {
      setTimeRemaining(calculateRemaining());
    }, 60000);

    return () => clearInterval(timer);
  }, [action]);

  if (timeRemaining === null) return null;

  const isBreached = action.sla_breached || timeRemaining <= 0;
  const isWarning = !isBreached && timeRemaining < action.sla_target_hours! * 0.25;
  const hours = Math.abs(Math.floor(timeRemaining));
  const minutes = Math.abs(Math.floor((timeRemaining % 1) * 60));

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
      isBreached ? 'bg-destructive/10 text-destructive' :
        isWarning ? 'bg-warning/10 text-warning' :
          'bg-muted text-muted-foreground'
    )}>
      <Timer className="h-3 w-3" />
      {isBreached ? (
        <span>SLA Breached ({hours}h {minutes}m over)</span>
      ) : (
        <span>{hours}h {minutes}m remaining</span>
      )}
    </div>
  );
}

interface ActionCardProps {
  action: Action;
  isSelected: boolean;
  onClick: () => void;
}

function ActionCard({ action, isSelected, onClick }: ActionCardProps) {
  const StatusIcon = getStatusIcon(action.status);
  const isOverdue = action.due_date && new Date(action.due_date) < new Date() && action.status !== 'completed' && action.status !== 'cancelled';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all group',
        isSelected ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50',
        isOverdue && 'border-destructive/50',
        action.sla_breached && 'ring-1 ring-destructive/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
          action.status === 'completed' ? 'bg-success/10' :
            action.status === 'deferred' ? 'bg-warning/10' :
              action.sla_breached ? 'bg-destructive/10' : 'bg-muted'
        )}>
          <StatusIcon className={cn(
            'h-5 w-5',
            action.status === 'completed' ? 'text-success' :
              action.status === 'deferred' ? 'text-warning' :
                action.sla_breached ? 'text-destructive' : 'text-muted-foreground'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant={getPriorityColor(action.priority)}>{action.priority}</Badge>
            <Badge variant={getStatusColor(action.status)}>{action.status}</Badge>
            {action.sla_breached && (
              <Badge variant="destructive" className="gap-1">
                <Bell className="h-3 w-3" />
                SLA Breach
              </Badge>
            )}
          </div>

          <h3 className="font-medium text-sm line-clamp-1 mb-1">{action.title}</h3>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {action.owner_name || 'Unassigned'}
            </span>
            {action.due_date && (
              <span className={cn(
                'flex items-center gap-1',
                isOverdue && 'text-destructive font-medium'
              )}>
                <Calendar className="h-3 w-3" />
                {isOverdue ? 'OVERDUE: ' : ''}
                {formatDate(action.due_date)}
              </span>
            )}
          </div>

          <SLATimer action={action} />

          {action.status !== 'completed' && action.status !== 'cancelled' && (
            <div className="flex items-center gap-2 mt-2">
              <Progress value={action.progress} className="flex-1 h-1.5" />
              <span className="text-xs text-muted-foreground">{action.progress}%</span>
            </div>
          )}
        </div>

        <Button variant="ghost" size="iconXs" className="opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

interface ActionDetailPanelProps {
  action: Action;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ActionInput & { blocked_by?: string }>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  canEdit: boolean;
  canDelete: boolean;
}

function ActionDetailPanel({ action, onClose, onUpdate, onDelete, canEdit, canDelete }: ActionDetailPanelProps) {
  const StatusIcon = getStatusIcon(action.status);
  const isOverdue = action.due_date && new Date(action.due_date) < new Date() && action.status !== 'completed' && action.status !== 'cancelled';

  const handleStatusChange = async (status: ActionStatus) => {
    await onUpdate(action.id, { status });
  };

  const handleProgressChange = async (progress: number) => {
    await onUpdate(action.id, { progress });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-[480px] border-l bg-card flex flex-col h-full"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="font-medium">Action Details</span>
        </div>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant={getPriorityColor(action.priority)}>{action.priority}</Badge>
              <Badge variant={getStatusColor(action.status)}>{action.status}</Badge>
              {isOverdue && <Badge variant="destructive">OVERDUE</Badge>}
              {action.sla_breached && (
                <Badge variant="destructive" className="gap-1">
                  <Bell className="h-3 w-3" />
                  SLA Breached
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">{action.title}</h2>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </div>

          {action.sla_target_hours && (
            <Card className={cn(
              'border-l-4',
              action.sla_breached ? 'border-l-destructive bg-destructive/5' : 'border-l-success bg-success/5'
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    <span className="text-sm font-medium">SLA Target</span>
                  </div>
                  <span className="text-lg font-bold">{action.sla_target_hours}h</span>
                </div>
                <SLATimer action={action} />
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Owner</span>
              <p className="text-sm">{action.owner_name || 'Unassigned'}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Created By</span>
              <p className="text-sm">{action.created_by_name || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Due Date</span>
              <p className="text-sm">{formatDate(action.due_date, 'Not set')}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Created</span>
              <p className="text-sm">{formatDate(action.created_at)}</p>
            </div>
          </div>

          {action.source_type && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Source</span>
              <Badge variant="outline" className="capitalize">{action.source_type}: {action.source_title || action.source_id}</Badge>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Progress</span>
            <div className="flex items-center gap-4">
              <Progress value={action.progress} className="flex-1" />
              <span className="text-sm font-medium">{action.progress}%</span>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                {[0, 25, 50, 75, 100].map(p => (
                  <Button
                    key={p}
                    variant={action.progress === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleProgressChange(p)}
                  >
                    {p}%
                  </Button>
                ))}
              </div>
            )}
          </div>

          {canEdit && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Status Actions</span>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'in-progress', 'completed', 'deferred', 'cancelled'] as ActionStatus[]).map(status => (
                  <Button
                    key={status}
                    variant={action.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    className="capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {action.notes && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Notes</span>
              <p className="text-sm p-3 bg-muted/50 rounded-lg">{action.notes}</p>
            </div>
          )}

          {canDelete && (
            <div className="pt-4 border-t">
              <Button variant="destructive" size="sm" onClick={() => onDelete(action.id)}>
                Delete Action
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}

interface AddActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ActionInput) => Promise<Action | null>;
}

function AddActionDialog({ open, onOpenChange, onSubmit }: AddActionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ActionInput>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    owner_name: '',
    due_date: '',
    sla_target_hours: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setLoading(true);
    const result = await onSubmit(form);
    setLoading(false);
    if (result) {
      setForm({ title: '', description: '', priority: 'medium', status: 'pending', owner_name: '', due_date: '', sla_target_hours: undefined });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Action</DialogTitle>
          <DialogDescription>Add a new action item to track.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Action title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the action" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as ActionPriority }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Input value={form.owner_name || ''} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} placeholder="Owner name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date || ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>SLA Target (hours)</Label>
              <Input type="number" value={form.sla_target_hours || ''} onChange={e => setForm(f => ({ ...f, sla_target_hours: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="e.g., 24" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Action
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ActionsView() {
  const { actions, loading, createAction, updateAction, deleteAction, pendingActions, inProgressActions, completedActions, slaBreachedActions, overdueActions } = useActions();
  const { settings } = useProjectContext();
  const { can } = usePermissions(settings.id);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [customColumns, setCustomColumns] = useState<DynamicColumnDef<Action>[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCellSave = async (rowId: string, key: string, value: string) => {
    const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
    const item = actions.find(i => i.id === rowId);
    if (!item) return;

    if (isCustom) {
      const cf = { ...(item.custom_fields ?? {}), [key]: value };
      await updateAction(rowId, { custom_fields: cf });
    } else {
      if (key === 'progress' || key === 'sla_target_hours') {
        const numVal = parseInt(value, 10);
        await updateAction(rowId, { [key]: isNaN(numVal) ? undefined : numVal });
      } else {
        await updateAction(rowId, { [key]: value });
      }
    }
  };

  const pdfSections: PDFExportSection[] = [
    { id: 'kpis', name: 'KPI Summary', selector: '[data-section="kpis"]' },
    { id: 'list', name: 'Actions List', selector: '[data-section="list"]' },
  ];

  const handleExportCSV = () => {
    const headers = ['Title', 'Priority', 'Status', 'Owner', 'Due Date', 'Progress (%)', 'Created'];
    const rows = filteredActions.map(a => [
      a.title, a.priority, a.status, a.owner_name || '',
      formatDate(a.due_date), a.progress ?? 0, formatDate(a.created_at),
    ]);
    exportToCSV([headers, ...rows], 'actions-tracker');
  };

  const owners = [...new Set(actions.map(a => a.owner_name).filter(Boolean))];

  const filteredActions = actions.filter(action => {
    const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (action.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesOwner = ownerFilter === 'all' || action.owner_name === ownerFilter;

    if (!matchesSearch || !matchesOwner) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return action.status === 'pending';
    if (activeTab === 'in-progress') return action.status === 'in-progress';
    if (activeTab === 'sla-breached') return action.sla_breached;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpiCards = (
    <>
      <KPICard title="Total Actions" value={actions.length.toString()} subtitle="All time" icon={CheckCircle2} status="neutral" />
      <KPICard title="Pending" value={pendingActions.length.toString()} subtitle="Not started" icon={CircleDot} status="neutral" />
      <KPICard title="In Progress" value={inProgressActions.length.toString()} subtitle="Active" icon={PlayCircle} status="success" />
      <KPICard title="SLA Breached" value={slaBreachedActions.length.toString()} subtitle="Overdue SLA" icon={Bell} status={slaBreachedActions.length > 0 ? 'warning' : 'success'} />
      <KPICard title="Overdue" value={overdueActions.length.toString()} subtitle="Past due date" icon={Clock} status={overdueActions.length > 0 ? 'warning' : 'success'} />
    </>
  );

  const toolbarFilters = (
    <Select value={ownerFilter} onValueChange={setOwnerFilter}>
      <SelectTrigger className="w-40 h-8 text-xs">
        <User className="h-3.5 w-3.5 mr-2" />
        <SelectValue placeholder="Filter by owner" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Owners</SelectItem>
        {owners.map(owner => (
          <SelectItem key={owner} value={owner!}>{owner}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const listModeControls = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCSV}>
        <Download className="h-3.5 w-3.5 mr-1.5" />Export CSV
      </Button>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
      <TabsList className="h-full bg-transparent p-0">
        <TabsTrigger value="all" className="h-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">All ({actions.length})</TabsTrigger>
        <TabsTrigger value="pending" className="h-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">Pending ({pendingActions.length})</TabsTrigger>
        <TabsTrigger value="in-progress" className="h-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">In Progress ({inProgressActions.length})</TabsTrigger>
        <TabsTrigger value="sla-breached" className="h-full text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">SLA Breached ({slaBreachedActions.length})</TabsTrigger>
      </TabsList>
    </Tabs>
  </div>
  );

  const listContent = (
    <>
      <div className="space-y-3" data-section="list">
        {filteredActions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No actions found. Create your first action to get started.</p>
          </Card>
        ) : (
          filteredActions.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              isSelected={selectedAction?.id === action.id}
              onClick={() => setSelectedAction(action)}
            />
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedAction && (
          <div className="fixed inset-y-0 right-0 z-50 shadow-2xl">
            <ActionDetailPanel
              action={selectedAction}
              onClose={() => setSelectedAction(null)}
              onUpdate={updateAction}
              onDelete={async (id) => {
                const result = await deleteAction(id);
                if (result) setSelectedAction(null);
                return result;
              }}
              canEdit={can('task.edit')}
              canDelete={can('task.delete')}
            />
          </div>
        )}
      </AnimatePresence>

      <AddActionDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSubmit={createAction} />
    </>
  );

  return (
    <DataRegisterPage
      title="Actions Tracker"
      description="Manage, track, and close project actions"
      icon={CheckCircle2}
      iconBgClass="bg-primary/20"
      iconColorClass="text-primary"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      toolbarFilters={toolbarFilters}
      listModeControls={listModeControls}
      onAddRow={can('task.create') ? () => setAddDialogOpen(true) : undefined}
      addLabel="New Action"
      pdfFilename="actions-tracker"
      pdfSections={pdfSections}
      data={filteredActions}
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
      onDeleteRows={can('task.delete') ? (ids) => Array.from(ids).forEach(id => deleteAction(id)) : undefined}
      emptyStateMessage={actions.length === 0 ? 'No actions added yet.' : 'No actions match filters.'}
      kpiCards={kpiCards}
      listContent={listContent}
    />
  );
}
