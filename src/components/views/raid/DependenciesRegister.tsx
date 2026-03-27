import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Download, Link2, AlertTriangle } from 'lucide-react';
import { formatDate, exportToCSV } from '@/lib/utils';
import { toast } from 'sonner';

interface Dependency {
  id: string;
  project_id: string;
  description: string;
  type: 'internal' | 'external' | 'cross-project';
  depends_on: string | null;
  due_date: string | null;
  status: 'on_track' | 'at_risk' | 'blocked' | 'resolved';
  owner_name: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  on_track: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  at_risk: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  blocked: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  resolved: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  blocked: 'Blocked',
  resolved: 'Resolved',
};

const EMPTY_FORM = {
  description: '',
  type: 'internal' as const,
  depends_on: '',
  due_date: '',
  status: 'on_track' as const,
  owner_name: '',
  notes: '',
};

function isNearingDue(due_date: string | null, status: string) {
  if (!due_date || status === 'resolved') return false;
  const days = Math.ceil((new Date(due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return days < 7;
}

export default function DependenciesRegister() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');

  const { data: dependencies = [], isLoading } = useQuery({
    queryKey: ['dependencies', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dependencies')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Dependency[];
    },
    enabled: !!projectId,
  });

  const addMutation = useMutation({
    mutationFn: async (values: typeof EMPTY_FORM) => {
      const { error } = await supabase.from('dependencies').insert({
        ...values,
        project_id: projectId,
        due_date: values.due_date || null,
        depends_on: values.depends_on || null,
        notes: values.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dependencies', projectId] });
      toast.success('Dependency added');
      setOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error('Failed to add dependency'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('dependencies').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dependencies', projectId] });
      toast.success('Status updated');
    },
  });

  const filtered = dependencies.filter(d =>
    d.description.toLowerCase().includes(search.toLowerCase()) ||
    (d.depends_on || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.owner_name || '').toLowerCase().includes(search.toLowerCase())
  );

  // Auto-flag at-risk based on due date proximity
  const enriched = filtered.map(d => ({
    ...d,
    autoAtRisk: isNearingDue(d.due_date, d.status),
  }));

  const handleExport = () => {
    exportToCSV(
      filtered.map(d => ({
        Description: d.description,
        Type: d.type,
        'Depends On': d.depends_on || '',
        'Due Date': d.due_date ? formatDate(d.due_date) : '',
        Status: STATUS_LABELS[d.status],
        Owner: d.owner_name || '',
        Notes: d.notes || '',
      })),
      'dependencies'
    );
  };

  const byStatus = (s: string) => dependencies.filter(d => d.status === s).length;

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search dependencies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Dependency
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {(['on_track', 'at_risk', 'blocked', 'resolved'] as const).map(s => (
          <div key={s} className="rounded-lg border bg-card p-3">
            <div className="text-2xl font-bold">{byStatus(s)}</div>
            <div className="text-xs text-muted-foreground">{STATUS_LABELS[s]}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Link2 className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No dependencies tracked yet</p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add your first dependency
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Description</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Depends On</th>
                <th className="text-left p-3 font-medium">Due Date</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="p-3">
                    <div className="font-medium">{d.description}</div>
                    {d.autoAtRisk && d.status !== 'resolved' && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        Due within 7 days
                      </div>
                    )}
                    {d.notes && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.notes}</div>}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize text-xs">{d.type.replace('-', ' ')}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{d.depends_on || '—'}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {d.due_date ? formatDate(d.due_date) : '—'}
                  </td>
                  <td className="p-3">
                    <Select
                      value={d.status}
                      onValueChange={v => updateStatus.mutate({ id: d.id, status: v })}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-muted-foreground">{d.owner_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the dependency..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="cross-project">Cross-Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_track">On Track</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Depends On (team / party / system)</Label>
              <Input value={form.depends_on} onChange={e => setForm(f => ({ ...f, depends_on: e.target.value }))} placeholder="e.g. Infrastructure Team, Client Procurement" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} placeholder="Owner name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate(form)} disabled={!form.description.trim() || addMutation.isPending}>
              {addMutation.isPending ? 'Saving...' : 'Add Dependency'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
