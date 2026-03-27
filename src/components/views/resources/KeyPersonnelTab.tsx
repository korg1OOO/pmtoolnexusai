import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Download, AlertTriangle, DollarSign, Shield } from 'lucide-react';
import { formatDate, formatCurrency, exportToCSV } from '@/lib/utils';
import { toast } from 'sonner';

interface KeyPerson {
  id: string;
  project_id: string;
  name: string;
  role: string;
  organisation: 'client' | 'si' | 'other';
  contract_start_date: string | null;
  status: 'active' | 'replaced' | 'exited';
  created_at: string;
}

interface Replacement {
  id: string;
  key_person_id: string;
  date_notified: string;
  reason: string;
  replacement_name: string | null;
  review_period_days: number;
  review_deadline: string | null;
  outcome: 'accepted' | 'rejected' | 'pending';
  notes: string | null;
}

const ORG_LABELS: Record<string, string> = { client: 'Client', si: 'SI / Vendor', other: 'Other' };
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/15 text-green-700 dark:text-green-400',
  replaced: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  exited: 'bg-slate-500/15 text-slate-600',
};

const EMPTY_PERSON_FORM = {
  name: '',
  role: '',
  organisation: 'client' as const,
  contract_start_date: '',
  status: 'active' as const,
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function KeyPersonnelTab() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const qc = useQueryClient();

  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_PERSON_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: personnel = [], isLoading } = useQuery({
    queryKey: ['key_personnel', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_personnel')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as KeyPerson[];
    },
    enabled: !!projectId,
  });

  const { data: allReplacements = [] } = useQuery({
    queryKey: ['key_personnel_replacements', projectId],
    queryFn: async () => {
      if (personnel.length === 0) return [];
      const ids = personnel.map(p => p.id);
      const { data, error } = await supabase
        .from('key_personnel_replacements')
        .select('*')
        .in('key_person_id', ids)
        .order('date_notified', { ascending: false });
      if (error) throw error;
      return data as Replacement[];
    },
    enabled: personnel.length > 0,
  });

  const addPerson = useMutation({
    mutationFn: async (values: typeof EMPTY_PERSON_FORM) => {
      const { error } = await supabase.from('key_personnel').insert({
        ...values,
        project_id: projectId,
        contract_start_date: values.contract_start_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['key_personnel', projectId] });
      toast.success('Key person added');
      setAddPersonOpen(false);
      setForm(EMPTY_PERSON_FORM);
    },
    onError: () => toast.error('Failed to add person'),
  });

  const reviewRequired = allReplacements.filter(r => {
    const days = daysUntil(r.review_deadline);
    return r.outcome === 'pending' && days !== null && days < 3;
  });

  const handleExport = () => {
    exportToCSV(
      personnel.map(p => ({
        Name: p.name,
        Role: p.role,
        Organisation: ORG_LABELS[p.organisation],
        Status: p.status,
        'Contract Start': p.contract_start_date ? formatDate(p.contract_start_date) : '',
      })),
      'key_personnel'
    );
  };

  return (
    <div className="p-6 space-y-4">
      {/* Review alerts */}
      {reviewRequired.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{reviewRequired.length}</strong> replacement review{reviewRequired.length > 1 ? 's' : ''} due within 3 days
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="grid grid-cols-3 gap-3 flex-1">
          {(['active', 'replaced', 'exited'] as const).map(s => (
            <div key={s} className="rounded-lg border bg-card p-3">
              <div className="text-2xl font-bold">{personnel.filter(p => p.status === s).length}</div>
              <div className="text-xs text-muted-foreground capitalize">{s}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setAddPersonOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Person
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : personnel.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Shield className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No key personnel tracked yet</p>
          <Button size="sm" onClick={() => setAddPersonOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add your first key person
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Organisation</th>
                <th className="text-left p-3 font-medium">Contract Start</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Replacements</th>
              </tr>
            </thead>
            <tbody>
              {personnel.map((p, i) => {
                const replacements = allReplacements.filter(r => r.key_person_id === p.id);
                const pendingReview = replacements.find(r => {
                  const days = daysUntil(r.review_deadline);
                  return r.outcome === 'pending' && days !== null && days < 3;
                });
                const isExpanded = expandedId === p.id;

                return (
                  <React.Fragment key={p.id}>
                    <tr
                      className={`cursor-pointer hover:bg-muted/10 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <td className="p-3 font-medium">
                        {p.name}
                        {pendingReview && (
                          <Badge className="ml-2 text-xs bg-red-500/15 text-red-700 dark:text-red-400">Review Required</Badge>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{p.role}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">{ORG_LABELS[p.organisation]}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {p.contract_start_date ? formatDate(p.contract_start_date) : '—'}
                      </td>
                      <td className="p-3">
                        <Badge className={`text-xs ${STATUS_COLORS[p.status]}`}>{p.status}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{replacements.length}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-muted/5">
                        <td colSpan={6} className="p-4">
                          <div className="text-xs font-semibold text-muted-foreground mb-2">Replacement History</div>
                          {replacements.length === 0 ? (
                            <div className="text-sm text-muted-foreground italic">No replacement events recorded</div>
                          ) : (
                            <table className="w-full text-xs border rounded">
                              <thead className="bg-muted/30">
                                <tr>
                                  <th className="p-2 text-left">Date Notified</th>
                                  <th className="p-2 text-left">Reason</th>
                                  <th className="p-2 text-left">Replacement</th>
                                  <th className="p-2 text-left">Review Deadline</th>
                                  <th className="p-2 text-left">Outcome</th>
                                </tr>
                              </thead>
                              <tbody>
                                {replacements.map(r => {
                                  const days = daysUntil(r.review_deadline);
                                  return (
                                    <tr key={r.id}>
                                      <td className="p-2">{formatDate(r.date_notified)}</td>
                                      <td className="p-2">{r.reason}</td>
                                      <td className="p-2">{r.replacement_name || '—'}</td>
                                      <td className="p-2">
                                        {r.review_deadline ? (
                                          <span className={days !== null && days < 3 ? 'text-red-600 font-semibold' : ''}>
                                            {formatDate(r.review_deadline)}
                                            {days !== null && ` (${days}d)`}
                                          </span>
                                        ) : '—'}
                                      </td>
                                      <td className="p-2 capitalize">{r.outcome}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addPersonOpen} onOpenChange={setAddPersonOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Key Person</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Project Manager, Lead Consultant" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Organisation</Label>
                <Select value={form.organisation} onValueChange={v => setForm(f => ({ ...f, organisation: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="si">SI / Vendor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="replaced">Replaced</SelectItem>
                    <SelectItem value="exited">Exited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Contract Start Date</Label>
              <Input type="date" value={form.contract_start_date} onChange={e => setForm(f => ({ ...f, contract_start_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPersonOpen(false)}>Cancel</Button>
            <Button onClick={() => addPerson.mutate(form)} disabled={!form.name.trim() || !form.role.trim() || addPerson.isPending}>
              {addPerson.isPending ? 'Saving...' : 'Add Person'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
