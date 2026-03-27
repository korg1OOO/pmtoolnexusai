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
import { Plus, Download, ArrowUpCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatDate, exportToCSV } from '@/lib/utils';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';

interface Escalation {
  id: string;
  project_id: string;
  date_raised: string;
  linked_item_type: 'risk' | 'issue' | 'decision' | null;
  linked_item_id: string | null;
  escalated_to: string;
  escalated_by: string;
  reason: string;
  response_received: boolean;
  response_date: string | null;
  outcome: string | null;
  status: 'open' | 'resolved' | 'closed';
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  resolved: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  closed: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

const EMPTY_FORM = {
  date_raised: new Date().toISOString().split('T')[0],
  linked_item_type: '' as any,
  linked_item_id: '',
  escalated_to: '',
  escalated_by: '',
  reason: '',
  response_received: false,
  response_date: '',
  outcome: '',
  status: 'open' as const,
};

const STALE_THRESHOLD_DAYS = 14;

export default function EscalationLog() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');

  const { data: escalations = [], isLoading } = useQuery({
    queryKey: ['escalations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalations')
        .select('*')
        .eq('project_id', projectId)
        .order('date_raised', { ascending: false });
      if (error) throw error;
      return data as Escalation[];
    },
    enabled: !!projectId,
  });

  const addMutation = useMutation({
    mutationFn: async (values: typeof EMPTY_FORM) => {
      const { error } = await supabase.from('escalations').insert({
        ...values,
        project_id: projectId,
        linked_item_type: values.linked_item_type || null,
        linked_item_id: values.linked_item_id || null,
        response_date: values.response_date || null,
        outcome: values.outcome || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalations', projectId] });
      toast.success('Escalation logged');
      setOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error('Failed to log escalation'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('escalations').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalations', projectId] });
    },
  });

  const filtered = escalations.filter(e =>
    e.escalated_to.toLowerCase().includes(search.toLowerCase()) ||
    e.escalated_by.toLowerCase().includes(search.toLowerCase()) ||
    e.reason.toLowerCase().includes(search.toLowerCase())
  );

  const staleCount = escalations.filter(e =>
    e.status === 'open' &&
    differenceInDays(new Date(), new Date(e.date_raised)) > STALE_THRESHOLD_DAYS
  ).length;

  const openCount = escalations.filter(e => e.status === 'open').length;

  const handleExport = () => {
    exportToCSV(
      filtered.map(e => ({
        'Date Raised': formatDate(e.date_raised),
        'Escalated To': e.escalated_to,
        'Escalated By': e.escalated_by,
        Reason: e.reason,
        'Linked Item': e.linked_item_type ? `${e.linked_item_type} ${e.linked_item_id || ''}` : '',
        'Response Received': e.response_received ? 'Yes' : 'No',
        'Response Date': e.response_date ? formatDate(e.response_date) : '',
        Outcome: e.outcome || '',
        Status: e.status,
      })),
      'escalations'
    );
  };

  return (
    <div className="p-6 space-y-4">
      {/* Stale escalation alert */}
      {staleCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{staleCount}</strong> open escalation{staleCount > 1 ? 's' : ''} with no response in over {STALE_THRESHOLD_DAYS} days
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search escalations..."
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
            Log Escalation
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <div className="text-2xl font-bold text-red-600">{openCount}</div>
          <div className="text-xs text-muted-foreground">Open</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-2xl font-bold text-amber-600">{staleCount}</div>
          <div className="text-xs text-muted-foreground">Stale (&gt;{STALE_THRESHOLD_DAYS}d)</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-2xl font-bold">{escalations.filter(e => e.status === 'resolved').length}</div>
          <div className="text-xs text-muted-foreground">Resolved</div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <ArrowUpCircle className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No escalations logged</p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Log your first escalation
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Date Raised</th>
                <th className="text-left p-3 font-medium">Escalated To</th>
                <th className="text-left p-3 font-medium">Escalated By</th>
                <th className="text-left p-3 font-medium">Reason</th>
                <th className="text-left p-3 font-medium">Linked Item</th>
                <th className="text-left p-3 font-medium">Response</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const daysOpen = differenceInDays(new Date(), new Date(e.date_raised));
                const isStale = e.status === 'open' && daysOpen > STALE_THRESHOLD_DAYS;
                return (
                  <tr key={e.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="p-3 whitespace-nowrap">
                      <div>{formatDate(e.date_raised)}</div>
                      {isStale && (
                        <div className="flex items-center gap-1 text-xs text-red-600 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {daysOpen}d open
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium">{e.escalated_to}</td>
                    <td className="p-3 text-muted-foreground">{e.escalated_by}</td>
                    <td className="p-3 max-w-[200px]">
                      <div className="line-clamp-2">{e.reason}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {e.linked_item_type ? (
                        <Badge variant="outline" className="text-xs capitalize">
                          {e.linked_item_type}
                          {e.linked_item_id ? ` #${e.linked_item_id.slice(0, 8)}` : ''}
                        </Badge>
                      ) : '—'}
                    </td>
                    <td className="p-3">
                      {e.response_received ? (
                        <div>
                          <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 text-xs">Received</Badge>
                          {e.response_date && <div className="text-xs text-muted-foreground mt-0.5">{formatDate(e.response_date)}</div>}
                        </div>
                      ) : (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs">Pending</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Select
                        value={e.status}
                        onValueChange={v => updateStatus.mutate({ id: e.id, status: v })}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Escalation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Escalated To *</Label>
                <Input value={form.escalated_to} onChange={e => setForm(f => ({ ...f, escalated_to: e.target.value }))} placeholder="Name / Role" />
              </div>
              <div className="space-y-1.5">
                <Label>Escalated By *</Label>
                <Input value={form.escalated_by} onChange={e => setForm(f => ({ ...f, escalated_by: e.target.value }))} placeholder="Your name / Role" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason *</Label>
              <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Why is this being escalated?" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date Raised</Label>
                <Input type="date" value={form.date_raised} onChange={e => setForm(f => ({ ...f, date_raised: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Linked Item Type</Label>
                <Select value={form.linked_item_type || ''} onValueChange={v => setForm(f => ({ ...f, linked_item_type: v as any }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="risk">Risk</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.linked_item_type && (
              <div className="space-y-1.5">
                <Label>Linked Item ID</Label>
                <Input value={form.linked_item_id} onChange={e => setForm(f => ({ ...f, linked_item_id: e.target.value }))} placeholder="Item ID or reference" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Outcome (if known)</Label>
              <Textarea value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} placeholder="Outcome or resolution..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate(form)}
              disabled={!form.escalated_to.trim() || !form.escalated_by.trim() || !form.reason.trim() || addMutation.isPending}
            >
              {addMutation.isPending ? 'Saving...' : 'Log Escalation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
