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
import { Plus, Download, BookOpen, AlertTriangle } from 'lucide-react';
import { formatDate, exportToCSV } from '@/lib/utils';
import { toast } from 'sonner';


interface Assumption {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  category: string;
  status: 'valid' | 'invalidated' | 'under_review';
  owner_name: string | null;
  date_logged: string;
  review_date: string | null;
  impact_if_wrong: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  valid: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  invalidated: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  under_review: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
};

const CATEGORIES = ['Technical', 'Business', 'Resource', 'Regulatory', 'Integration', 'Data', 'Other'];

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Business',
  status: 'valid' as const,
  owner_name: '',
  date_logged: new Date().toISOString().split('T')[0],
  review_date: '',
  impact_if_wrong: '',
};

export default function AssumptionsRegister() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');

  const { data: assumptions = [], isLoading } = useQuery({
    queryKey: ['assumptions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assumptions')
        .select('*')
        .eq('project_id', projectId)
        .order('date_logged', { ascending: false });
      if (error) throw error;
      return data as Assumption[];
    },
    enabled: !!projectId,
  });

  const addMutation = useMutation({
    mutationFn: async (values: typeof EMPTY_FORM) => {
      const { error } = await supabase.from('assumptions').insert({
        ...values,
        project_id: projectId,
        review_date: values.review_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assumptions', projectId] });
      toast.success('Assumption added');
      setOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error('Failed to add assumption'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('assumptions').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assumptions', projectId] });
      toast.success('Status updated');
    },
  });

  const filtered = assumptions.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.owner_name || '').toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    exportToCSV(
      filtered.map(a => ({
        Title: a.title,
        Category: a.category,
        Status: a.status,
        Owner: a.owner_name || '',
        'Date Logged': formatDate(a.date_logged),
        'Review Date': a.review_date ? formatDate(a.review_date) : '',
        'Impact if Wrong': a.impact_if_wrong || '',
        Description: a.description || '',
      })),
      'assumptions'
    );
  };

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search assumptions..."
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
            Add Assumption
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {(['valid', 'under_review', 'invalidated'] as const).map(s => (
          <div key={s} className="rounded-lg border bg-card p-3">
            <div className="text-2xl font-bold">{assumptions.filter(a => a.status === s).length}</div>
            <div className="text-xs text-muted-foreground capitalize">{s.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No assumptions logged yet</p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add your first assumption
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Owner</th>
                <th className="text-left p-3 font-medium">Logged</th>
                <th className="text-left p-3 font-medium">Review Date</th>
                <th className="text-left p-3 font-medium">Impact if Wrong</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="p-3">
                    <div className="font-medium">{a.title}</div>
                    {a.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</div>}
                    {a.status === 'invalidated' && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        Consider creating a linked risk
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{a.category}</td>
                  <td className="p-3">
                    <Select
                      value={a.status}
                      onValueChange={v => updateStatus.mutate({ id: a.id, status: v })}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valid">Valid</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="invalidated">Invalidated</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-muted-foreground">{a.owner_name || '—'}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(a.date_logged)}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {a.review_date ? formatDate(a.review_date) : '—'}
                  </td>
                  <td className="p-3 text-muted-foreground max-w-[200px]">
                    <div className="line-clamp-2">{a.impact_if_wrong || '—'}</div>
                  </td>
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
            <DialogTitle>Add Assumption</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Assumption title" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the assumption..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="valid">Valid</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="invalidated">Invalidated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} placeholder="Owner name" />
              </div>
              <div className="space-y-1.5">
                <Label>Date Logged</Label>
                <Input type="date" value={form.date_logged} onChange={e => setForm(f => ({ ...f, date_logged: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Review Date</Label>
              <Input type="date" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Impact if Wrong</Label>
              <Textarea value={form.impact_if_wrong} onChange={e => setForm(f => ({ ...f, impact_if_wrong: e.target.value }))} placeholder="What happens if this assumption is wrong?" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate(form)} disabled={!form.title.trim() || addMutation.isPending}>
              {addMutation.isPending ? 'Saving...' : 'Add Assumption'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
