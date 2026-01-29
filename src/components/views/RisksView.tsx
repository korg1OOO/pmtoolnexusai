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
import { toast } from 'sonner';

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

export function RisksView() {
  const { risks, loading, createRisk, updateRisk, deleteRisk, criticalRisks, openRisks } = useRisks();
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col" ref={contentRef}>
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <h2 className="text-lg font-semibold">Risk Register</h2>
            <Badge variant="destructive">{risks.length} Risks</Badge>
          </div>
          <div className="flex items-center gap-2">
            <PDFExporter
              title="Risk Register"
              filename="risk-register"
              contentRef={contentRef}
              sections={pdfSections}
              showSectionPicker
              variant="dropdown"
            />
            <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />Filter</Button>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Risk</Button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2" data-section="matrix">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Risk Matrix</CardTitle></CardHeader>
                <CardContent><RiskMatrix risks={risks} /></CardContent>
              </Card>
            </div>
            <div className="space-y-4" data-section="summary">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Risk Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total Risks</span><span className="font-semibold">{risks.length}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Critical</span><Badge variant="destructive">{criticalRisks.length}</Badge></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Open</span><span className="font-semibold">{openRisks.length}</span></div>
                  <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Being Mitigated</span><span className="font-semibold">{risks.filter(r => r.status === 'mitigating').length}</span></div>
                </CardContent>
              </Card>
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-8 mb-4" data-section="list">All Risks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {risks.length === 0 ? (
              <Card className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No risks found. Add your first risk to get started.</p>
              </Card>
            ) : (
              risks.map(risk => (
                <motion.div
                  key={risk.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    'p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer',
                    selectedRisk?.id === risk.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => setSelectedRisk(risk)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2"><div className={cn('h-3 w-3 rounded-full', riskColors[risk.impact])} /><Badge variant={risk.impact as any}>{risk.impact} impact</Badge></div>
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
                  <h3 className="font-medium mb-2">{risk.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{risk.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground"><User className="h-3 w-3" />{risk.owner_name || 'Unassigned'}</div>
                    <Badge variant={risk.status === 'mitigating' ? 'info' : risk.status === 'closed' ? 'success' : 'secondary'}>{risk.status}</Badge>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedRisk && (
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
        )}
      </AnimatePresence>

      <AddRiskDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSubmit={createRisk} />
    </div>
  );
}
