import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Target, Plus, Filter, User, Calendar, Link2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDecisions, Decision, DecisionInput, DecisionStatus } from '@/hooks/useDecisions';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
import { List, Table } from 'lucide-react';
import { toast } from 'sonner';

const STANDARD_COLUMNS: DynamicColumnDef<Decision>[] = [
  { key: 'key', label: 'Decision ID', width: 120, type: 'text', sticky: true },
  { key: 'title', label: 'Title', width: 240, type: 'text' },
  { key: 'decision', label: 'Decision Statement', width: 300, type: 'text' },
  { key: 'status', label: 'Status', width: 130, type: 'select', options: ['pending', 'active', 'superseded', 'rejected'] },
  { key: 'owner_name', label: 'Owner', width: 140, type: 'text' },
  { key: 'date', label: 'Date', width: 130, type: 'date' },
  { key: 'context', label: 'Context', width: 250, type: 'text' },
  { key: 'impact', label: 'Impact', width: 250, type: 'text' },
];
import { LinkDialog, LinkableItem } from '@/components/linking/LinkDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface DecisionCardProps {
  decision: Decision;
  onSelect: () => void;
  isSelected: boolean;
}

function DecisionCard({ decision, onSelect, isSelected }: DecisionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onSelect}
      className={`p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <Badge variant={decision.status === 'active' ? 'success' : decision.status === 'pending' ? 'warning' : 'secondary'}>
          {decision.status}
        </Badge>
        <span className="text-xs text-muted-foreground font-mono">{decision.key}</span>
      </div>
      <h3 className="font-medium mb-2">{decision.title}</h3>
      <div className="p-3 bg-muted/50 rounded-lg mb-3">
        <p className="text-sm line-clamp-2">{decision.decision}</p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />{decision.owner_name || 'Unassigned'}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />{new Date(decision.date).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Link2 className="h-3 w-3" />
          {decision.linked_tasks.length + decision.linked_risks.length + decision.linked_meetings.length}
        </div>
      </div>
    </motion.div>
  );
}

interface DecisionDetailPanelProps {
  decision: Decision;
  onClose: () => void;
  onOpenLinkDialog: () => void;
  onUpdate: (id: string, updates: Partial<DecisionInput>) => Promise<boolean>;
}

function DecisionDetailPanel({ decision, onClose, onOpenLinkDialog, onUpdate }: DecisionDetailPanelProps) {
  const handleStatusChange = async (status: DecisionStatus) => {
    await onUpdate(decision.id, { status });
  };

  return (
    <Sheet open={true} onOpenChange={() => onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {decision.key}
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          <div className="space-y-6">
            {/* Status & Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Select value={decision.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="superseded">Superseded</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <h2 className="text-lg font-semibold mb-2">{decision.title}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User className="h-3 w-3" />{decision.owner_name || 'Unassigned'}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(decision.date).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="context">
              <TabsList className="w-full">
                <TabsTrigger value="context" className="flex-1">Context</TabsTrigger>
                <TabsTrigger value="alternatives" className="flex-1">Alternatives</TabsTrigger>
                <TabsTrigger value="links" className="flex-1">Links</TabsTrigger>
              </TabsList>

              <TabsContent value="context" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Decision Statement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{decision.decision}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{decision.context || 'No context provided'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{decision.impact || 'No impact documented'}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alternatives" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Alternatives Considered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {decision.alternatives.length > 0 ? (
                      <ul className="space-y-2">
                        {decision.alternatives.map((alt, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-muted-foreground">{i + 1}.</span>
                            <span>{alt}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No alternatives documented</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="links" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Linked Items</h4>
                  <Button size="sm" variant="outline" onClick={onOpenLinkDialog}>
                    <Link2 className="h-3 w-3 mr-1" />
                    Manage Links
                  </Button>
                </div>

                {/* Linked Tasks */}
                {decision.linked_tasks.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Tasks ({decision.linked_tasks.length})</span>
                    <div className="mt-2 space-y-1">
                      {decision.linked_tasks.map((taskId) => (
                        <div key={taskId} className="p-2 rounded bg-muted/50 text-sm flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{taskId}</Badge>
                          <span className="text-muted-foreground">Linked task</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Risks */}
                {decision.linked_risks.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Risks ({decision.linked_risks.length})</span>
                    <div className="mt-2 space-y-1">
                      {decision.linked_risks.map((riskId) => (
                        <div key={riskId} className="p-2 rounded bg-muted/50 text-sm flex items-center gap-2">
                          <Badge variant="warning" className="text-xs">{riskId}</Badge>
                          <span className="text-muted-foreground">Linked risk</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Meetings */}
                {decision.linked_meetings.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Meetings ({decision.linked_meetings.length})</span>
                    <div className="mt-2 space-y-1">
                      {decision.linked_meetings.map((meetingId) => (
                        <div key={meetingId} className="p-2 rounded bg-muted/50 text-sm flex items-center gap-2">
                          <Badge variant="info" className="text-xs">{meetingId}</Badge>
                          <span className="text-muted-foreground">Linked meeting</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {decision.linked_tasks.length === 0 && decision.linked_risks.length === 0 && decision.linked_meetings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Link2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No linked items yet</p>
                    <Button size="sm" variant="outline" className="mt-2" onClick={onOpenLinkDialog}>
                      Add Links
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface CreateDecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: DecisionInput) => Promise<Decision | null>;
}

function CreateDecisionDialog({ open, onOpenChange, onCreate }: CreateDecisionDialogProps) {
  const [title, setTitle] = useState('');
  const [decision, setDecision] = useState('');
  const [context, setContext] = useState('');
  const [impact, setImpact] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [status, setStatus] = useState<DecisionStatus>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !decision.trim()) return;

    setIsSubmitting(true);
    const result = await onCreate({
      title: title.trim(),
      decision: decision.trim(),
      context: context.trim() || undefined,
      impact: impact.trim() || undefined,
      owner_name: ownerName.trim() || undefined,
      status,
    });

    if (result) {
      setTitle('');
      setDecision('');
      setContext('');
      setImpact('');
      setOwnerName('');
      setStatus('pending');
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Decision</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Decision title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="decision">Decision Statement *</Label>
            <Textarea
              id="decision"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="What was decided?"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Decision owner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DecisionStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="superseded">Superseded</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="context">Context</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Why was this decision made?"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="impact">Impact</Label>
            <Textarea
              id="impact"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="What is the impact of this decision?"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !decision.trim() || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DecisionsView() {
  const { decisions, loading, createDecision, updateDecision, activeDecisions, pendingDecisions, supersededDecisions } = useDecisions();
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'spreadsheet'>('list');
  const [customColumns, setCustomColumns] = useState<DynamicColumnDef<Decision>[]>([]);

  const filteredDecisions = decisions.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !d.key?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleLinkItems = async (items: LinkableItem[]) => {
    if (!selectedDecision) return;

    const linked_tasks = items.filter(i => i.type === 'task').map(i => i.id);
    const linked_risks = items.filter(i => i.type === 'risk').map(i => i.id);
    const linked_meetings = items.filter(i => i.type === 'meeting').map(i => i.id);

    await updateDecision(selectedDecision.id, {
      linked_tasks,
      linked_risks,
      linked_meetings,
    });
  };

  const handleCellSave = async (rowId: string, key: string, value: string) => {
    const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
    const item = decisions.find(i => i.id === rowId);
    if (!item) return;

    if (isCustom) {
      const cf = { ...(item.custom_fields ?? {}), [key]: value };
      await updateDecision(rowId, { custom_fields: cf });
    } else {
      await updateDecision(rowId, { [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">Decision Register</h2>
          <Badge>{decisions.length} Decisions</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'spreadsheet')} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="list" className="h-6 px-2.5 text-xs"><List className="h-3.5 w-3.5 mr-1.5" /> Dashboard & List</TabsTrigger>
              <TabsTrigger value="spreadsheet" className="h-6 px-2.5 text-xs"><Table className="h-3.5 w-3.5 mr-1.5" /> Spreadsheet</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />Filter
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Decision
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'pending', 'superseded'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className={cn("flex-1 overflow-auto", viewMode === 'spreadsheet' ? 'p-0 bg-muted/10' : 'p-6')}>
        {viewMode === 'spreadsheet' ? (
          <div className="h-full p-6">
            <div className="h-full bg-background border rounded-md shadow-sm overflow-hidden">
              <DynamicDataGrid
                data={decisions}
                baseColumns={STANDARD_COLUMNS}
                customColumns={customColumns}
                idExtractor={(item) => item.id}
                customFieldExtractor={(item, key) => String(item.custom_fields?.[key] ?? '')}
                onCellSave={handleCellSave}
                onDeleteRows={() => {
                  toast.error("Bulk deletion not supported for decisions yet.");
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
                onAddRow={() => setCreateDialogOpen(true)}
                emptyStateMessage={decisions.length === 0 ? 'No decisions added yet.' : 'No decisions match.'}
                containerStyles="h-full border-0"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-primary">{decisions.length}</div>
                  <p className="text-sm text-muted-foreground">Total Decisions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-success">{activeDecisions.length}</div>
                  <p className="text-sm text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-warning">{pendingDecisions.length}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-3xl font-bold text-muted-foreground">{supersededDecisions.length}</div>
                  <p className="text-sm text-muted-foreground">Superseded</p>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-lg font-semibold mb-4">
              {statusFilter === 'all' ? 'All Decisions' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Decisions`}
              <span className="text-muted-foreground font-normal ml-2">({filteredDecisions.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDecisions.map(decision => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  onSelect={() => setSelectedDecision(decision)}
                  isSelected={selectedDecision?.id === decision.id}
                />
              ))}
            </div>

            {filteredDecisions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No decisions found</p>
                <Button size="sm" className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Decision
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Decision Detail Panel */}
      {selectedDecision && (
        <DecisionDetailPanel
          decision={selectedDecision}
          onClose={() => setSelectedDecision(null)}
          onOpenLinkDialog={() => setLinkDialogOpen(true)}
          onUpdate={updateDecision}
        />
      )}

      {/* Link Dialog */}
      {selectedDecision && (
        <LinkDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          sourceItem={{ id: selectedDecision.id, title: selectedDecision.title, type: 'decision' }}
          onLink={handleLinkItems}
          allowedTypes={['task', 'meeting', 'action', 'risk']}
          existingLinks={[
            ...selectedDecision.linked_tasks.map(id => ({ type: 'task' as const, id })),
            ...selectedDecision.linked_risks.map(id => ({ type: 'risk' as const, id })),
            ...selectedDecision.linked_meetings.map(id => ({ type: 'meeting' as const, id })),
          ]}
        />
      )}

      {/* Create Dialog */}
      <CreateDecisionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createDecision}
      />
    </div>
  );
}
