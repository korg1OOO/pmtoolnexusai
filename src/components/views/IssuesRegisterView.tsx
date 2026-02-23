import React, { useState, useRef, useMemo, useCallback } from 'react';
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
  CheckCircle2,
  History,
  Loader2,
  TableProperties,
  Settings2,
  Edit2,
  Zap,
  Timer,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
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

const STANDARD_COLUMNS: DynamicColumnDef<Issue>[] = [
  { key: 'key', label: 'Issue ID', width: 100, type: 'text', sticky: true },
  { key: 'title', label: 'Title', width: 240, type: 'text' },
  { key: 'type', label: 'Type', width: 130, type: 'select', options: ['bug', 'blocker', 'impediment', 'defect', 'incident'] },
  { key: 'severity', label: 'Severity', width: 120, type: 'select', options: ['minor', 'moderate', 'major', 'critical'] },
  { key: 'priority', label: 'Priority', width: 120, type: 'select', options: ['low', 'medium', 'high', 'critical'] },
  { key: 'assignee_name', label: 'Assignee', width: 150, type: 'text' },
  { key: 'status', label: 'Status', width: 130, type: 'select', options: ['open', 'investigating', 'in-progress', 'blocked', 'resolved', 'closed'] },
];

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

  // Table View States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<IssueInput & { sla_target_resolution: number | null }>>({});

  // Spreadsheet View States
  const [viewMode, setViewMode] = useState<'list' | 'spreadsheet'>(() => {
    return (localStorage.getItem('projectoye_issues_view') as 'list' | 'spreadsheet') || 'list';
  });
  const [customColumns, setCustomColumns] = useState<DynamicColumnDef<Issue>[]>([]);

  const handleViewModeChange = (val: string) => {
    const mode = val as 'list' | 'spreadsheet';
    setViewMode(mode);
    localStorage.setItem('projectoye_issues_view', mode);
  };

  const handleCellSave = useCallback((rowId: string, key: string, value: string) => {
    const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
    if (isCustom) {
      updateIssue(rowId, { custom_fields: { [key]: value } });
    } else {
      updateIssue(rowId, { [key]: value } as any);
    }
  }, [updateIssue]);

  const handleEditClick = (issue: Issue) => {
    setEditingId(issue.id);
    setEditForm({
      title: issue.title,
      description: issue.description || '',
      type: issue.type,
      severity: issue.severity,
      priority: issue.priority,
      status: issue.status,
      reporter_name: issue.reporter_name || '',
      assignee_name: issue.assignee_name || '',
      sla_target_resolution: issue.sla_target_resolution,
    });
  };

  const handleSaveInline = async (id: string) => {
    if (editingId === id && editForm) {
      await updateIssue(id, editForm);
      setEditingId(null);
    }
  };

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
            <Tabs value={viewMode} onValueChange={(v) => v && handleViewModeChange(v)} className="mr-2">
              <TabsList className="grid w-[240px] grid-cols-2">
                <TabsTrigger value="list" className="text-xs">
                  <TableProperties className="h-4 w-4 mr-2" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="spreadsheet" className="h-7 text-xs px-3"><TableProperties className="h-3.5 w-3.5 mr-1" />Spreadsheet</TabsTrigger>
              </TabsList>
            </Tabs>
            <PDFExporter
              title="Issues Register"
              filename="issues-register"
              contentRef={contentRef}
              sections={pdfSections}
              showSectionPicker
              variant="dropdown"
            />
            {viewMode === 'list' && (
              <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />Filter</Button>
            )}
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Log Issue
            </Button>
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

            {/* Custom column pills (visible in spreadsheet mode) */}
            {viewMode === 'spreadsheet' && customColumns.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pb-2 border-b">
                <span className="text-xs text-muted-foreground mr-1">Custom Fields:</span>
                {customColumns.map(col => (
                  <Badge key={col.key} variant="secondary" className="gap-1 pr-1 text-xs">
                    {col.label}
                    <button
                      onClick={() => setCustomColumns(prev => prev.filter(c => c.key !== col.key))}
                      className="text-muted-foreground hover:text-destructive ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* View Switching */}
            {viewMode === 'spreadsheet' ? (
              <div className="mt-6">
                <DynamicDataGrid
                  data={filteredIssues}
                  baseColumns={STANDARD_COLUMNS}
                  customColumns={customColumns}
                  idExtractor={(issue) => issue.id}
                  customFieldExtractor={(issue, key) => String(issue.custom_fields?.[key] ?? '')}
                  onCellSave={handleCellSave}
                  onDeleteRows={(ids) => ids.forEach(id => deleteIssue(id))}
                  onAddColumn={(col) => {
                    if (customColumns.find(c => c.key === col.key)) {
                      toast.error('Column already exists');
                      return;
                    }
                    setCustomColumns(prev => [...prev, col]);
                    toast.success(`Column "${col.label}" added`);
                  }}
                  onRemoveColumn={(key) => setCustomColumns(prev => prev.filter(c => c.key !== key))}
                  onAddRow={() => createIssue({ title: `New Issue ${issues.length + 1}`, type: 'bug', severity: 'moderate', priority: 'medium', status: 'open' })}
                  emptyStateMessage={searchQuery || activeTab !== 'all' ? 'No issues match your filters.' : 'No issues yet. Click "Add Row" to start.'}
                />
              </div>
            ) : (
              <div data-section="list" className="bg-card rounded-lg border overflow-hidden mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Issue ID</th>
                        <th className="px-4 py-3 font-medium">Title</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Severity</th>
                        <th className="px-4 py-3 font-medium">Priority</th>
                        <th className="px-4 py-3 font-medium">Assignee</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredIssues.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                            No issues found. Log your first issue to get started.
                          </td>
                        </tr>
                      ) : (
                        filteredIssues.map((issue) => {
                          const isEditing = editingId === issue.id;
                          const TypeIcon = getTypeIcon(issue.type);

                          return (
                            <tr key={issue.id} className="hover:bg-muted/30 transition-colors group">
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                {issue.key || issue.id.slice(0, 8)}
                              </td>
                              <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                                {isEditing ? (
                                  <Input
                                    value={editForm.title || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="h-8 text-sm"
                                  />
                                ) : (
                                  <div
                                    className="cursor-pointer hover:underline truncate"
                                    onClick={() => setSelectedIssue(issue)}
                                  >
                                    {issue.title}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {isEditing ? (
                                  <Select value={editForm.type} onValueChange={(v) => setEditForm(prev => ({ ...prev, type: v as IssueType }))}>
                                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="bug">Bug</SelectItem>
                                      <SelectItem value="blocker">Blocker</SelectItem>
                                      <SelectItem value="impediment">Impediment</SelectItem>
                                      <SelectItem value="defect">Defect</SelectItem>
                                      <SelectItem value="incident">Incident</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-muted-foreground capitalize">
                                    <TypeIcon className="h-3.5 w-3.5" />
                                    {issue.type}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {isEditing ? (
                                  <Select value={editForm.severity} onValueChange={(v) => setEditForm(prev => ({ ...prev, severity: v as IssueSeverity }))}>
                                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="minor">Minor</SelectItem>
                                      <SelectItem value="moderate">Moderate</SelectItem>
                                      <SelectItem value="major">Major</SelectItem>
                                      <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant={getSeverityColor(issue.severity)} className="capitalize">
                                    {issue.severity}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {isEditing ? (
                                  <Select value={editForm.priority} onValueChange={(v) => setEditForm(prev => ({ ...prev, priority: v as IssuePriority }))}>
                                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant={getPriorityColor(issue.priority)} className="capitalize">
                                    {issue.priority}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {isEditing ? (
                                  <Input
                                    value={editForm.assignee_name || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, assignee_name: e.target.value }))}
                                    className="h-8 text-sm"
                                    placeholder="Assignee name"
                                  />
                                ) : (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <User className="h-3.5 w-3.5" />
                                    {issue.assignee_name || 'Unassigned'}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {isEditing ? (
                                  <Select value={editForm.status} onValueChange={(v) => setEditForm(prev => ({ ...prev, status: v as IssueStatus }))}>
                                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="open">Open</SelectItem>
                                      <SelectItem value="investigating">Investigating</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="blocked">Blocked</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                      <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant={getStatusColor(issue.status)} className="capitalize">
                                    {issue.status}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                {isEditing ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <Button size="iconXs" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                                    <Button size="iconXs" variant="default" onClick={() => handleSaveInline(issue.id)}><Save className="h-3.5 w-3.5" /></Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="iconXs" variant="ghost" onClick={() => handleEditClick(issue)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="iconXs"><MoreHorizontal className="h-4 w-4" /></Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setSelectedIssue(issue)}>View Details</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive" onClick={() => deleteIssue(issue.id)}>Delete</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
