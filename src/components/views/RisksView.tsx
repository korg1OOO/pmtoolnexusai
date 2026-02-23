import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertTriangle, Shield, Plus, Filter, User, MoreHorizontal, X, Loader2, Calendar, Link2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { PDFExporter, PDFExportSection } from '@/components/common/PDFExporter';
import { useRisks, RiskInput, Risk, RiskLevel, RiskStatus } from '@/hooks/useRisks';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
import { DataRegisterPage } from '@/components/ui/DataRegisterPage';
import { toast } from 'sonner';

// Optional icon imports for table headers
import { Edit2, Save } from 'lucide-react';

const STANDARD_COLUMNS: DynamicColumnDef<Risk>[] = [
  { key: 'title', label: 'Title', width: 240, type: 'text', sticky: true },
  { key: 'description', label: 'Description', width: 300, type: 'text' },
  { key: 'category', label: 'Category', width: 150, type: 'text' },
  { key: 'impact', label: 'Impact', width: 120, type: 'select', options: ['low', 'medium', 'high', 'critical'] },
  { key: 'probability', label: 'Probability', width: 120, type: 'select', options: ['low', 'medium', 'high', 'critical'] },
  { key: 'owner_name', label: 'Owner', width: 140, type: 'text' },
  { key: 'due_date', label: 'Due Date', width: 130, type: 'date' },
  { key: 'status', label: 'Status', width: 130, type: 'select', options: ['identified', 'analyzing', 'mitigating', 'monitoring', 'closed'] },
  { key: 'mitigation_plan', label: 'Mitigation Plan', width: 250, type: 'text' },
  { key: 'contingency_plan', label: 'Contingency Plan', width: 250, type: 'text' },
];

const riskColors: Record<RiskLevel, string> = {
  low: 'bg-success',
  medium: 'bg-warning',
  high: 'bg-orange-500',
  critical: 'bg-destructive',
};

function RiskMatrix({ risks }: { risks: Risk[] }) {
  const matrix: Record<string, Risk[]> = {};
  ['critical', 'high', 'medium', 'low'].forEach(prob => {
    ['low', 'medium', 'high', 'critical'].forEach(impact => {
      matrix[`${prob}-${impact}`] = risks.filter(r => r.probability === prob && r.impact === impact);
    });
  });

  const getCellColor = (prob: string, impact: string) => {
    const probLevel = ['low', 'medium', 'high', 'critical'].indexOf(prob);
    const impactLevel = ['low', 'medium', 'high', 'critical'].indexOf(impact);
    const score = probLevel + impactLevel;
    if (score >= 5) return 'bg-destructive/20 border-destructive/30';
    if (score >= 3) return 'bg-warning/20 border-warning/30';
    return 'bg-success/20 border-success/30';
  };

  return (
    <div className="grid gap-1">
      <div className="grid grid-cols-5 gap-1 text-center">
        <div className="text-xs text-muted-foreground p-2">Probability ↓ / Impact →</div>
        {['Low', 'Medium', 'High', 'Critical'].map(label => (
          <div key={label} className="text-xs font-medium p-2">{label}</div>
        ))}
      </div>
      {['critical', 'high', 'medium', 'low'].map(prob => (
        <div key={prob} className="grid grid-cols-5 gap-1">
          <div className="text-xs font-medium p-2 capitalize flex items-center">{prob}</div>
          {['low', 'medium', 'high', 'critical'].map(impact => (
            <div key={`${prob}-${impact}`} className={cn('p-2 rounded border min-h-[60px] flex flex-wrap gap-1', getCellColor(prob, impact))}>
              {matrix[`${prob}-${impact}`].map(risk => (
                <motion.div key={risk.id} whileHover={{ scale: 1.1 }} className="h-6 w-6 rounded-full bg-foreground/80 flex items-center justify-center text-[10px] font-bold text-background cursor-pointer" title={risk.title}>
                  {risk.id.slice(-3)}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

interface RiskDetailPanelProps {
  risk: Risk;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<RiskInput>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

function RiskDetailPanel({ risk, onClose, onUpdate, onDelete }: RiskDetailPanelProps) {
  const handleStatusChange = async (status: RiskStatus) => {
    await onUpdate(risk.id, { status });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-[400px] border-l bg-card flex flex-col h-full"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="font-medium">Risk Details</span>
        </div>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={risk.impact as any}>{risk.impact} impact</Badge>
              <Badge variant={risk.probability as any}>{risk.probability} probability</Badge>
              <Badge variant={risk.status === 'mitigating' ? 'info' : risk.status === 'closed' ? 'success' : 'secondary'}>{risk.status}</Badge>
            </div>
            <h2 className="text-lg font-semibold mb-2">{risk.title}</h2>
            <p className="text-sm text-muted-foreground">{risk.description}</p>
          </div>

          {risk.category && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Category</span>
              <p className="text-sm">{risk.category}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Owner</span>
              <p className="text-sm">{risk.owner_name || 'Unassigned'}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Due Date</span>
              <p className="text-sm">{risk.due_date ? new Date(risk.due_date).toLocaleDateString() : 'Not set'}</p>
            </div>
          </div>

          {risk.mitigation_plan && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Mitigation Plan</span>
              <p className="text-sm p-3 bg-info/10 rounded-lg border border-info/20">{risk.mitigation_plan}</p>
            </div>
          )}

          {risk.contingency_plan && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Contingency Plan</span>
              <p className="text-sm p-3 bg-warning/10 rounded-lg border border-warning/20">{risk.contingency_plan}</p>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Status Actions</span>
            <div className="flex flex-wrap gap-2">
              {(['identified', 'analyzing', 'mitigating', 'monitoring', 'closed'] as RiskStatus[]).map(status => (
                <Button
                  key={status}
                  variant={risk.status === status ? 'default' : 'outline'}
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
            <Button variant="destructive" size="sm" onClick={() => onDelete(risk.id)}>
              Delete Risk
            </Button>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}

interface AddRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: RiskInput) => Promise<Risk | null>;
}

function AddRiskDialog({ open, onOpenChange, onSubmit }: AddRiskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<RiskInput>({
    title: '',
    description: '',
    category: '',
    probability: 'medium',
    impact: 'medium',
    status: 'identified',
    owner_name: '',
    mitigation_plan: '',
    contingency_plan: '',
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
      setForm({ title: '', description: '', category: '', probability: 'medium', impact: 'medium', status: 'identified', owner_name: '', mitigation_plan: '', contingency_plan: '' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Risk</DialogTitle>
          <DialogDescription>Create a new risk entry in the register.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Risk title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the risk" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Probability</Label>
              <Select value={form.probability} onValueChange={v => setForm(f => ({ ...f, probability: v as RiskLevel }))}>
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
              <Label>Impact</Label>
              <Select value={form.impact} onValueChange={v => setForm(f => ({ ...f, impact: v as RiskLevel }))}>
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
              <Label>Category</Label>
              <Input value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g., Technical, Schedule" />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Input value={form.owner_name || ''} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} placeholder="Risk owner name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mitigation Plan</Label>
            <Textarea value={form.mitigation_plan || ''} onChange={e => setForm(f => ({ ...f, mitigation_plan: e.target.value }))} placeholder="How will you mitigate this risk?" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Risk
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RisksView() {
  const { risks, loading, createRisk, updateRisk, deleteRisk, criticalRisks, openRisks } = useRisks();
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [customColumns, setCustomColumns] = useState<DynamicColumnDef<Risk>[]>([]);

  // Table View States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RiskInput>>({});

  const handleEditClick = (risk: Risk) => {
    setEditingId(risk.id);
    setEditForm({
      title: risk.title,
      description: risk.description || '',
      category: risk.category || '',
      probability: risk.probability,
      impact: risk.impact,
      status: risk.status,
      owner_name: risk.owner_name || '',
      due_date: risk.due_date,
    });
  };

  const handleSaveInline = async (id: string) => {
    if (editingId === id && editForm) {
      await updateRisk(id, editForm);
      setEditingId(null);
    }
  };

  const handleCellSave = async (rowId: string, key: string, value: string) => {
    const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
    const item = risks.find(i => i.id === rowId);
    if (!item) return;

    if (isCustom) {
      const cf = { ...(item.custom_fields ?? {}), [key]: value };
      await updateRisk(rowId, { custom_fields: cf });
    } else {
      await updateRisk(rowId, { [key]: value });
    }
  };

  const pdfSections: PDFExportSection[] = [
    { id: 'matrix', name: 'Risk Matrix', selector: '[data-section="matrix"]' },
    { id: 'summary', name: 'Risk Summary', selector: '[data-section="summary"]' },
    { id: 'list', name: 'All Risks', selector: '[data-section="list"]' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpiCards = (
    <>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Risk Summary</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total Risks</span><span className="font-semibold">{risks.length}</span></div>
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Critical</span><Badge variant="destructive">{criticalRisks.length}</Badge></div>
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Open</span><span className="font-semibold">{openRisks.length}</span></div>
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Being Mitigated</span><span className="font-semibold">{risks.filter(r => r.status === 'mitigating').length}</span></div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3 xl:col-span-4" data-section="matrix">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Risk Matrix</CardTitle></CardHeader>
        <CardContent><RiskMatrix risks={risks} /></CardContent>
      </Card>
    </>
  );

  const listContent = (
    <>
      <h3 className="text-lg font-semibold mt-4 mb-4" data-section="list">All Risks</h3>
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Risk ID</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Impact</th>
                <th className="px-4 py-3 font-medium">Probability</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {risks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No risks found. Add your first risk to get started.
                  </td>
                </tr>
              ) : (
                risks.map((risk) => {
                  const isEditing = editingId === risk.id;
                  return (
                    <tr key={risk.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {risk.id.slice(-6).toUpperCase()}
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
                            onClick={() => setSelectedRisk(risk)}
                          >
                            {risk.title}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            value={editForm.category || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        ) : (
                          <span className="text-muted-foreground">{risk.category || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <Select value={editForm.impact} onValueChange={(v) => setEditForm(prev => ({ ...prev, impact: v as RiskLevel }))}>
                            <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className={cn('h-2 w-2 rounded-full', riskColors[risk.impact])} />
                            <span className="capitalize">{risk.impact}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <Select value={editForm.probability} onValueChange={(v) => setEditForm(prev => ({ ...prev, probability: v as RiskLevel }))}>
                            <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="capitalize">{risk.probability}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            value={editForm.owner_name || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, owner_name: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            {risk.owner_name || 'Unassigned'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editForm.due_date ? new Date(editForm.due_date).toISOString().split('T')[0] : ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, due_date: e.target.value }))}
                            className="h-8 text-sm w-36"
                          />
                        ) : (
                          <span className="text-muted-foreground">{risk.due_date ? new Date(risk.due_date).toLocaleDateString() : '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <Select value={editForm.status} onValueChange={(v) => setEditForm(prev => ({ ...prev, status: v as RiskStatus }))}>
                            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="identified">Identified</SelectItem>
                              <SelectItem value="analyzing">Analyzing</SelectItem>
                              <SelectItem value="mitigating">Mitigating</SelectItem>
                              <SelectItem value="monitoring">Monitoring</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={risk.status === 'mitigating' ? 'info' : risk.status === 'closed' ? 'success' : 'secondary'}>
                            {risk.status}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="iconXs" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                            <Button size="iconXs" variant="default" onClick={() => handleSaveInline(risk.id)}><Save className="h-3.5 w-3.5" /></Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="iconXs" variant="ghost" onClick={() => handleEditClick(risk)}><Edit2 className="h-3.5 w-3.5" /></Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="iconXs"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedRisk(risk)}>View Details</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteRisk(risk.id)}>Delete</DropdownMenuItem>
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

      <AnimatePresence>
        {selectedRisk && (
          <div className="fixed inset-y-0 right-0 z-50 shadow-2xl">
            <RiskDetailPanel
              risk={selectedRisk}
              onClose={() => setSelectedRisk(null)}
              onUpdate={updateRisk}
              onDelete={async (id) => {
                const result = await deleteRisk(id);
                if (result) setSelectedRisk(null);
                return result;
              }}
            />
          </div>
        )}
      </AnimatePresence>

      <AddRiskDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSubmit={createRisk} />
    </>
  );

  return (
    <DataRegisterPage
      title="Risk Register"
      description="Identify and track project risks"
      icon={AlertTriangle}
      iconBgClass="bg-destructive/20"
      iconColorClass="text-destructive"
      toolbarFilters={
        <Button variant="outline" size="sm" className="h-8 text-xs border-border/60">
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Filter
        </Button>
      }
      onAddRow={() => setAddDialogOpen(true)}
      addLabel="Add Risk"
      pdfFilename="risk-register"
      pdfSections={pdfSections}
      data={risks}
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
      onDeleteRows={(ids) => Array.from(ids).forEach(id => deleteRisk(id))}
      emptyStateMessage={risks.length === 0 ? 'No risks added yet.' : 'No risks match.'}
      kpiCards={kpiCards}
      listContent={listContent}
    />
  );
}
