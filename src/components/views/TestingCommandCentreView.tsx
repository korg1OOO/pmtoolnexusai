import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus, Download, Bug, FlaskConical, ClipboardList, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatDate, exportToCSV } from '@/lib/utils';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Defect {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  type: string;
  raised_by: string;
  assigned_to: string | null;
  raised_date: string;
  resolved_date: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'deferred';
  external_ticket_url: string | null;
  resolution_notes: string | null;
  created_at: string;
}

interface TriageSession {
  id: string;
  project_id: string;
  date: string;
  participants: string[];
  defects_triaged: number;
  decisions: string;
  actions: string | null;
  next_triage_date: string | null;
  created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  P1: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  P2: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
  P3: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  P4: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500/15 text-red-700 dark:text-red-400',
  in_progress: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  resolved: 'bg-green-500/15 text-green-700 dark:text-green-400',
  closed: 'bg-slate-500/15 text-slate-600',
  deferred: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
};

const DEFECT_EMPTY = {
  title: '',
  description: '',
  priority: 'P3' as const,
  type: 'Functional',
  raised_by: '',
  assigned_to: '',
  raised_date: new Date().toISOString().split('T')[0],
  status: 'open' as const,
  external_ticket_url: '',
  resolution_notes: '',
};

const TRIAGE_EMPTY = {
  date: new Date().toISOString().split('T')[0],
  participants: [] as string[],
  defects_triaged: 0,
  decisions: '',
  actions: '',
  next_triage_date: '',
};

export default function TestingCommandCentreView() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [defectOpen, setDefectOpen] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);
  const [defectForm, setDefectForm] = useState(DEFECT_EMPTY);
  const [triageForm, setTriageForm] = useState(TRIAGE_EMPTY);
  const [participantsInput, setParticipantsInput] = useState('');
  const [search, setSearch] = useState('');

  const { data: defects = [], isLoading: loadingDefects } = useQuery({
    queryKey: ['defects', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('defects')
        .select('*')
        .eq('project_id', projectId)
        .order('raised_date', { ascending: false });
      if (error) throw error;
      return data as Defect[];
    },
    enabled: !!projectId,
  });

  const { data: triageSessions = [], isLoading: loadingTriage } = useQuery({
    queryKey: ['triage_sessions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('triage_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as TriageSession[];
    },
    enabled: !!projectId,
  });

  const addDefect = useMutation({
    mutationFn: async (values: typeof DEFECT_EMPTY) => {
      const { error } = await supabase.from('defects').insert({
        ...values,
        project_id: projectId,
        description: values.description || null,
        assigned_to: values.assigned_to || null,
        external_ticket_url: values.external_ticket_url || null,
        resolution_notes: values.resolution_notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['defects', projectId] });
      toast.success('Defect logged');
      setDefectOpen(false);
      setDefectForm(DEFECT_EMPTY);
    },
    onError: () => toast.error('Failed to log defect'),
  });

  const addTriage = useMutation({
    mutationFn: async (values: typeof TRIAGE_EMPTY) => {
      const { error } = await supabase.from('triage_sessions').insert({
        ...values,
        project_id: projectId,
        participants: values.participants,
        actions: values.actions || null,
        next_triage_date: values.next_triage_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['triage_sessions', projectId] });
      toast.success('Triage session recorded');
      setTriageOpen(false);
      setTriageForm(TRIAGE_EMPTY);
      setParticipantsInput('');
    },
    onError: () => toast.error('Failed to record triage'),
  });

  const updateDefectStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'resolved' || status === 'closed') updates.resolved_date = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('defects').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['defects', projectId] }),
  });

  const openDefects = defects.filter(d => !['closed', 'resolved'].includes(d.status));
  const p1Count = defects.filter(d => d.priority === 'P1' && !['closed', 'resolved'].includes(d.status)).length;
  const p2Count = defects.filter(d => d.priority === 'P2' && !['closed', 'resolved'].includes(d.status)).length;
  const resolvedCount = defects.filter(d => ['closed', 'resolved'].includes(d.status)).length;
  const totalCount = defects.length;
  const closureRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  const filtered = defects.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.raised_by.toLowerCase().includes(search.toLowerCase()) ||
    (d.assigned_to || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleExportDefects = () => {
    exportToCSV(
      filtered.map(d => ({
        Priority: d.priority,
        Title: d.title,
        Type: d.type,
        'Raised By': d.raised_by,
        'Assigned To': d.assigned_to || '',
        'Raised Date': formatDate(d.raised_date),
        'Resolved Date': d.resolved_date ? formatDate(d.resolved_date) : '',
        Status: d.status,
        'Ticket URL': d.external_ticket_url || '',
      })),
      'defects'
    );
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b bg-background px-6 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                Testing Command Centre
              </h1>
            </div>
          </div>
          <TabsList className="h-10 bg-transparent p-0 gap-1">
            <TabsTrigger value="dashboard" className="h-9 px-4 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="defects" className="h-9 px-4 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
              <Bug className="h-4 w-4 mr-1.5" />
              Defects
              {p1Count > 0 && <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5">{p1Count}</span>}
            </TabsTrigger>
            <TabsTrigger value="triage" className="h-9 px-4 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
              <ClipboardList className="h-4 w-4 mr-1.5" />
              Triage Log
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="flex-1 m-0 overflow-auto p-6 space-y-4">
          {p1Count > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <strong>{p1Count}</strong>&nbsp;P1 critical defect{p1Count > 1 ? 's' : ''} open — immediate attention required
            </div>
          )}

          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Total Defects', value: totalCount, color: '' },
              { label: 'Open', value: openDefects.length, color: 'text-red-600' },
              { label: 'P1 Critical', value: p1Count, color: 'text-red-700' },
              { label: 'P2 High', value: p2Count, color: 'text-orange-600' },
              { label: 'Closure Rate', value: `${closureRate}%`, color: closureRate >= 80 ? 'text-green-600' : 'text-amber-600' },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-bold mt-1">
                  <span className={kpi.color}>{kpi.value}</span>
                </div>
                <div className="text-xs text-muted-foreground">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Priority breakdown */}
          <div className="grid grid-cols-4 gap-3">
            {(['P1', 'P2', 'P3', 'P4'] as const).map(p => {
              const open = defects.filter(d => d.priority === p && !['closed', 'resolved'].includes(d.status)).length;
              const total = defects.filter(d => d.priority === p).length;
              return (
                <div key={p} className={`rounded-lg border p-4 ${PRIORITY_COLORS[p]}`}>
                  <div className="text-lg font-bold">{open} <span className="text-sm font-normal">/ {total}</span></div>
                  <div className="text-xs mt-0.5">{p} — Open / Total</div>
                  {total > 0 && <Progress value={(open / total) * 100} className="mt-2 h-1" />}
                </div>
              );
            })}
          </div>

          <div className="text-sm text-muted-foreground">
            Last triage session: {triageSessions[0] ? formatDate(triageSessions[0].date) : 'None recorded'}
            {triageSessions[0]?.next_triage_date && ` · Next: ${formatDate(triageSessions[0].next_triage_date)}`}
          </div>
        </TabsContent>

        {/* Defects Tab */}
        <TabsContent value="defects" className="flex-1 m-0 overflow-auto p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Input placeholder="Search defects..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportDefects}><Download className="h-4 w-4 mr-1.5" />Export CSV</Button>
              <Button size="sm" onClick={() => setDefectOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Log Defect</Button>
            </div>
          </div>

          {loadingDefects ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Bug className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">No defects logged yet</p>
              <Button size="sm" onClick={() => setDefectOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Log your first defect</Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Priority</th>
                    <th className="text-left p-3 font-medium">Title</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Raised By</th>
                    <th className="text-left p-3 font-medium">Raised</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => (
                    <tr key={d.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3">
                        <Badge className={`text-xs font-bold ${PRIORITY_COLORS[d.priority]}`}>{d.priority}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{d.title}</div>
                        {d.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{d.description}</div>}
                        {d.external_ticket_url && (
                          <a href={d.external_ticket_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                            View ticket ↗
                          </a>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{d.type}</td>
                      <td className="p-3 text-muted-foreground">{d.raised_by}</td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(d.raised_date)}</td>
                      <td className="p-3">
                        <Select value={d.status} onValueChange={v => updateDefectStatus.mutate({ id: d.id, status: v })}>
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="deferred">Deferred</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Triage Log Tab */}
        <TabsContent value="triage" className="flex-1 m-0 overflow-auto p-6 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setTriageOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Log Triage Session</Button>
          </div>

          {loadingTriage ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : triageSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">No triage sessions logged</p>
              <Button size="sm" onClick={() => setTriageOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Log first triage session</Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Defects Triaged</th>
                    <th className="text-left p-3 font-medium">Decisions</th>
                    <th className="text-left p-3 font-medium">Participants</th>
                    <th className="text-left p-3 font-medium">Next Triage</th>
                  </tr>
                </thead>
                <tbody>
                  {triageSessions.map((s, i) => (
                    <tr key={s.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3 whitespace-nowrap font-medium">{formatDate(s.date)}</td>
                      <td className="p-3 text-center">{s.defects_triaged}</td>
                      <td className="p-3 max-w-[260px]">
                        <div className="line-clamp-2">{s.decisions}</div>
                      </td>
                      <td className="p-3 text-muted-foreground">{s.participants.join(', ')}</td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">{s.next_triage_date ? formatDate(s.next_triage_date) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Defect Dialog */}
      <Dialog open={defectOpen} onOpenChange={setDefectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Log Defect</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={defectForm.title} onChange={e => setDefectForm(f => ({ ...f, title: e.target.value }))} placeholder="Defect title" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={defectForm.description} onChange={e => setDefectForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the defect..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={defectForm.priority} onValueChange={v => setDefectForm(f => ({ ...f, priority: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1">P1 — Critical</SelectItem>
                    <SelectItem value="P2">P2 — High</SelectItem>
                    <SelectItem value="P3">P3 — Medium</SelectItem>
                    <SelectItem value="P4">P4 — Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={defectForm.type} onValueChange={v => setDefectForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Functional', 'Data', 'UI/UX', 'Integration', 'Performance', 'Security', 'Other'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Raised Date</Label>
                <Input type="date" value={defectForm.raised_date} onChange={e => setDefectForm(f => ({ ...f, raised_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Raised By</Label>
                <Input value={defectForm.raised_by} onChange={e => setDefectForm(f => ({ ...f, raised_by: e.target.value }))} placeholder="Name" />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned To</Label>
                <Input value={defectForm.assigned_to} onChange={e => setDefectForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="Name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>External Ticket URL (Jira / DevOps)</Label>
              <Input value={defectForm.external_ticket_url} onChange={e => setDefectForm(f => ({ ...f, external_ticket_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDefectOpen(false)}>Cancel</Button>
            <Button onClick={() => addDefect.mutate(defectForm)} disabled={!defectForm.title.trim() || !defectForm.raised_by.trim() || addDefect.isPending}>
              {addDefect.isPending ? 'Saving...' : 'Log Defect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Triage Dialog */}
      <Dialog open={triageOpen} onOpenChange={setTriageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log Triage Session</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={triageForm.date} onChange={e => setTriageForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Defects Triaged</Label>
                <Input type="number" value={triageForm.defects_triaged} onChange={e => setTriageForm(f => ({ ...f, defects_triaged: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Decisions *</Label>
              <Textarea value={triageForm.decisions} onChange={e => setTriageForm(f => ({ ...f, decisions: e.target.value }))} placeholder="Key decisions made..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Actions</Label>
              <Textarea value={triageForm.actions} onChange={e => setTriageForm(f => ({ ...f, actions: e.target.value }))} placeholder="Action items..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Participants (comma-separated)</Label>
              <Input value={participantsInput} onChange={e => {
                setParticipantsInput(e.target.value);
                setTriageForm(f => ({ ...f, participants: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }));
              }} placeholder="Alice, Bob, Charlie" />
            </div>
            <div className="space-y-1.5">
              <Label>Next Triage Date</Label>
              <Input type="date" value={triageForm.next_triage_date} onChange={e => setTriageForm(f => ({ ...f, next_triage_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriageOpen(false)}>Cancel</Button>
            <Button onClick={() => addTriage.mutate(triageForm)} disabled={!triageForm.decisions.trim() || addTriage.isPending}>
              {addTriage.isPending ? 'Saving...' : 'Log Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
