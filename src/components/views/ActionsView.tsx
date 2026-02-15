import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';
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
                {new Date(action.due_date).toLocaleDateString()}
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
}

function ActionDetailPanel({ action, onClose, onUpdate, onDelete }: ActionDetailPanelProps) {
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
              <p className="text-sm">{action.due_date ? new Date(action.due_date).toLocaleDateString() : 'Not set'}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Created</span>
              <p className="text-sm">{new Date(action.created_at).toLocaleDateString()}</p>
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
          </div>

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

          {action.notes && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Notes</span>
              <p className="text-sm p-3 bg-muted/50 rounded-lg">{action.notes}</p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button variant="destructive" size="sm" onClick={() => onDelete(action.id)}>
              Delete Action
            </Button>
          </div>
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
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const contentRef = useRef<HTMLDivElement>(null);

  const pdfSections: PDFExportSection[] = [
    { id: 'kpis', name: 'KPI Summary', selector: '[data-section="kpis"]' },
    { id: 'list', name: 'Actions List', selector: '[data-section="list"]' },
  ];

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

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col" ref={contentRef}>
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold">Actions Tracker</h2>
            <Badge>{actions.length} Actions</Badge>
          </div>
          <div className="flex items-center gap-2">
            <PDFExporter
              title="Actions Tracker"
              filename="actions-tracker"
              contentRef={contentRef}
              sections={pdfSections}
              showSectionPicker
              variant="dropdown"
            />
            <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />Filter</Button>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />New Action</Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-5 gap-4" data-section="kpis">
              <KPICard title="Total Actions" value={actions.length.toString()} subtitle="All time" icon={CheckCircle2} status="neutral" />
              <KPICard title="Pending" value={pendingActions.length.toString()} subtitle="Not started" icon={CircleDot} status="neutral" />
              <KPICard title="In Progress" value={inProgressActions.length.toString()} subtitle="Active" icon={PlayCircle} status="success" />
              <KPICard title="SLA Breached" value={slaBreachedActions.length.toString()} subtitle="Overdue SLA" icon={Bell} status={slaBreachedActions.length > 0 ? 'warning' : 'success'} />
              <KPICard title="Overdue" value={overdueActions.length.toString()} subtitle="Past due date" icon={Clock} status={overdueActions.length > 0 ? 'warning' : 'success'} />
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All ({actions.length})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({pendingActions.length})</TabsTrigger>
                  <TabsTrigger value="in-progress">In Progress ({inProgressActions.length})</TabsTrigger>
                  <TabsTrigger value="sla-breached">SLA Breached ({slaBreachedActions.length})</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-3">
                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger className="w-40">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    {owners.map(owner => (
                      <SelectItem key={owner} value={owner!}>{owner}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search actions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Actions List */}
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
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAction && (
          <ActionDetailPanel
            action={selectedAction}
            onClose={() => setSelectedAction(null)}
            onUpdate={updateAction}
            onDelete={async (id) => {
              const result = await deleteAction(id);
              if (result) setSelectedAction(null);
              return result;
            }}
          />
        )}
      </AnimatePresence>

      <AddActionDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSubmit={createAction} />
    </div>
  );
}
