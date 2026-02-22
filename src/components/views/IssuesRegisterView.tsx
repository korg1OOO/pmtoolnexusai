import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  Bug,
  Clock,
  Filter,
  Plus,
  Search,
  X,
  User,
  Calendar,
  Link2,
  MoreHorizontal,
  Timer,
  Zap,
  CheckCircle2,
  History,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KPICard } from '@/components/enterprise/KPICard';
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
import { useIssues, Issue, IssueInput, IssueSeverity, IssuePriority, IssueStatus, IssueType } from '@/hooks/useIssues';
import { toast } from 'sonner';

const getSeverityColor = (severity: IssueSeverity) => {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'major': return 'warning';
    case 'moderate': return 'info';
    case 'minor': return 'secondary';
    default: return 'info';
  }
};

const getPriorityColor = (priority: IssuePriority) => {
  switch (priority) {
    case 'critical': return 'destructive';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'secondary';
  }
};

const getStatusColor = (status: IssueStatus): "secondary" | "info" | "warning" | "destructive" | "success" | "outline" => {
  switch (status) {
    case 'open': return 'secondary';
    case 'investigating': return 'info';
    case 'in-progress': return 'warning';
    case 'blocked': return 'destructive';
    case 'resolved': return 'success';
    case 'closed': return 'outline';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'bug': return Bug;
    case 'blocker': return AlertCircle;
    case 'impediment': return AlertTriangle;
    case 'defect': return AlertCircle;
    case 'incident': return Zap;
    default: return Bug;
  }
};

interface IssueCardProps {
  issue: Issue;
  isSelected: boolean;
  onClick: () => void;
}

function IssueCard({ issue, isSelected, onClick }: IssueCardProps) {
  const TypeIcon = getTypeIcon(issue.type);
  const hoursRemaining = issue.sla_target_resolution ?
    Math.round((issue.sla_target_resolution - Date.now() / 3600000)) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all group',
        isSelected ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
          issue.severity === 'critical' ? 'bg-destructive/10' : 'bg-muted'
        )}>
          <TypeIcon className={cn(
            'h-5 w-5',
            issue.severity === 'critical' ? 'text-destructive' : 'text-muted-foreground'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">{issue.key || issue.id.slice(0, 8)}</span>
            <Badge variant={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
            <Badge variant={getPriorityColor(issue.priority)}>{issue.priority.toUpperCase()}</Badge>
          </div>

          <h3 className="font-medium text-sm line-clamp-1 mb-1">{issue.title}</h3>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {issue.assignee_name || 'Unassigned'}
            </span>
            <Badge variant={getStatusColor(issue.status)} className="text-xs">
              {issue.status}
            </Badge>
          </div>

          {hoursRemaining !== null && (
            <div className={cn(
              'flex items-center gap-2 mt-2 text-xs',
              issue.sla_breached ? 'text-destructive' : hoursRemaining < 4 ? 'text-warning' : 'text-muted-foreground'
            )}>
              <Timer className="h-3 w-3" />
              {issue.sla_breached ? (
                <span className="font-medium">SLA BREACHED</span>
              ) : (
                <span>{hoursRemaining}h remaining</span>
              )}
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

interface IssueDetailPanelProps {
  issue: Issue;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<IssueInput>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

function IssueDetailPanel({ issue, onClose, onUpdate, onDelete }: IssueDetailPanelProps) {
  const TypeIcon = getTypeIcon(issue.type);

  const handleStatusChange = async (status: IssueStatus) => {
    await onUpdate(issue.id, { status });
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
          <TypeIcon className="h-5 w-5 text-muted-foreground" />
          <span className="font-mono text-sm">{issue.key || issue.id.slice(0, 8)}</span>
        </div>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
              <Badge variant={getPriorityColor(issue.priority)}>{issue.priority.toUpperCase()}</Badge>
              <Badge variant={getStatusColor(issue.status)}>{issue.status}</Badge>
            </div>
            <h2 className="text-xl font-semibold mb-2">{issue.title}</h2>
            <p className="text-sm text-muted-foreground">{issue.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Reporter</span>
              <p className="text-sm">{issue.reporter_name || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Assignee</span>
              <p className="text-sm">{issue.assignee_name || 'Unassigned'}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Created</span>
              <p className="text-sm">{new Date(issue.created_at).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Updated</span>
              <p className="text-sm">{new Date(issue.updated_at).toLocaleString()}</p>
            </div>
          </div>

          {issue.affected_areas.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Affected Areas</span>
              <div className="flex flex-wrap gap-1">
                {issue.affected_areas.map((area) => (
                  <Badge key={area} variant="outline">{area}</Badge>
                ))}
              </div>
            </div>
          )}

          {issue.root_cause && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Root Cause</span>
              <p className="text-sm p-3 bg-warning/10 rounded-lg border border-warning/20">{issue.root_cause}</p>
            </div>
          )}

          {issue.resolution && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Resolution</span>
              <p className="text-sm p-3 bg-success/10 rounded-lg border border-success/20">{issue.resolution}</p>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Status Actions</span>
            <div className="flex flex-wrap gap-2">
              {(['open', 'investigating', 'in-progress', 'blocked', 'resolved', 'closed'] as IssueStatus[]).map(status => (
                <Button
                  key={status}
                  variant={issue.status === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button variant="destructive" size="sm" onClick={() => onDelete(issue.id)}>
              Delete Issue
            </Button>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}

interface AddIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: IssueInput) => Promise<Issue | null>;
}

function AddIssueDialog({ open, onOpenChange, onSubmit }: AddIssueDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<IssueInput>({
    title: '',
    description: '',
    type: 'bug',
    severity: 'moderate',
    priority: 'medium',
    status: 'open',
    reporter_name: '',
    assignee_name: '',
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
      setForm({ title: '', description: '', type: 'bug', severity: 'moderate', priority: 'medium', status: 'open', reporter_name: '', assignee_name: '' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log New Issue</DialogTitle>
          <DialogDescription>Create a new issue in the register.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Issue title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the issue" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as IssueType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="blocker">Blocker</SelectItem>
                  <SelectItem value="impediment">Impediment</SelectItem>
                  <SelectItem value="defect">Defect</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v as IssueSeverity }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as IssuePriority }))}>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reporter</Label>
              <Input value={form.reporter_name || ''} onChange={e => setForm(f => ({ ...f, reporter_name: e.target.value }))} placeholder="Reporter name" />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Input value={form.assignee_name || ''} onChange={e => setForm(f => ({ ...f, assignee_name: e.target.value }))} placeholder="Assignee name" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function IssuesRegisterView() {
  const { issues, loading, createIssue, updateIssue, deleteIssue, openIssues, criticalIssues, slaBreachedIssues } = useIssues();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const contentRef = useRef<HTMLDivElement>(null);

  const pdfSections: PDFExportSection[] = [
    { id: 'kpis', name: 'KPI Summary', selector: '[data-section="kpis"]' },
    { id: 'list', name: 'Issues List', selector: '[data-section="list"]' },
  ];

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.description?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'open') return matchesSearch && ['open', 'investigating', 'in-progress'].includes(issue.status);
    if (activeTab === 'critical') return matchesSearch && issue.severity === 'critical';
    if (activeTab === 'sla-breached') return matchesSearch && issue.sla_breached;
    return matchesSearch;
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
            <AlertCircle className="h-6 w-6 text-destructive" />
            <h2 className="text-lg font-semibold">Issues Register</h2>
            <Badge variant="destructive">{issues.length} Issues</Badge>
          </div>
          <div className="flex items-center gap-2">
            <PDFExporter
              title="Issues Register"
              filename="issues-register"
              contentRef={contentRef}
              sections={pdfSections}
              showSectionPicker
              variant="dropdown"
            />
            <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />Filter</Button>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Log Issue</Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4" data-section="kpis">
              <KPICard title="Total Issues" value={issues.length.toString()} subtitle="All time" icon={AlertCircle} status="neutral" />
              <KPICard title="Open Issues" value={openIssues.length.toString()} subtitle="Need attention" icon={Clock} status={openIssues.length > 5 ? 'warning' : 'success'} />
              <KPICard title="Critical" value={criticalIssues.length.toString()} subtitle="High priority" icon={Zap} status={criticalIssues.length > 0 ? 'warning' : 'success'} />
              <KPICard title="SLA Breached" value={slaBreachedIssues.length.toString()} subtitle="Overdue" icon={Timer} status={slaBreachedIssues.length > 0 ? 'warning' : 'success'} />
            </div>

            {/* Search and Tabs */}
            <div className="flex items-center justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All ({issues.length})</TabsTrigger>
                  <TabsTrigger value="open">Open ({openIssues.length})</TabsTrigger>
                  <TabsTrigger value="critical">Critical ({criticalIssues.length})</TabsTrigger>
                  <TabsTrigger value="sla-breached">SLA Breached ({slaBreachedIssues.length})</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Issues List */}
            <div className="space-y-3" data-section="list">
              {filteredIssues.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No issues found. Log your first issue to get started.</p>
                </Card>
              ) : (
                filteredIssues.map(issue => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    isSelected={selectedIssue?.id === issue.id}
                    onClick={() => setSelectedIssue(issue)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailPanel
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onUpdate={updateIssue}
            onDelete={async (id) => {
              const result = await deleteIssue(id);
              if (result) setSelectedIssue(null);
              return result;
            }}
          />
        )}
      </AnimatePresence>

      <AddIssueDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSubmit={createIssue} />
    </div>
  );
}
