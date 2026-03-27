import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus, Download, GraduationCap, Users, Clock, CheckCircle2 } from 'lucide-react';
import { formatDate, exportToCSV } from '@/lib/utils';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TrainingSession {
  id: string;
  project_id: string;
  date: string;
  module_stream: string;
  trainer: string;
  participant_names: string[];
  max_capacity: number;
  location: 'on-site' | 'remote';
  status: 'scheduled' | 'delivered' | 'cancelled';
  attendance_count: number;
  notes: string | null;
  created_at: string;
}

const STREAMS = ['Finance', 'Procurement', 'SCM', 'HCM', 'Payroll', 'EPM', 'Technical', 'General'];
const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  delivered: 'bg-green-500/15 text-green-700 dark:text-green-400',
  cancelled: 'bg-slate-500/15 text-slate-600',
};

const EMPTY_FORM = {
  date: '',
  module_stream: 'Finance',
  trainer: '',
  max_capacity: 20,
  location: 'on-site' as const,
  status: 'scheduled' as const,
  attendance_count: 0,
  notes: '',
  participant_names: [] as string[],
};

export default function TrainingTrackerView() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [participantsInput, setParticipantsInput] = useState('');

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['training_sessions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as TrainingSession[];
    },
    enabled: !!projectId,
  });

  const addSession = useMutation({
    mutationFn: async (values: typeof EMPTY_FORM) => {
      const { error } = await supabase.from('training_sessions').insert({
        ...values,
        project_id: projectId,
        notes: values.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training_sessions', projectId] });
      toast.success('Training session added');
      setOpen(false);
      setForm(EMPTY_FORM);
      setParticipantsInput('');
    },
    onError: () => toast.error('Failed to add session'),
  });

  const delivered = sessions.filter(s => s.status === 'delivered');
  const scheduled = sessions.filter(s => s.status === 'scheduled');
  const totalAttendance = delivered.reduce((s, d) => s + d.attendance_count, 0);
  const avgAttendancePct = delivered.length > 0
    ? Math.round(delivered.reduce((s, d) => s + (d.attendance_count / d.max_capacity * 100), 0) / delivered.length)
    : 0;

  // By-stream heatmap data
  const streamData = STREAMS.map(stream => ({
    stream,
    sessions: sessions.filter(s => s.module_stream === stream && s.status === 'delivered').length,
  }));

  const handleExport = () => {
    exportToCSV(
      sessions.map(s => ({
        Date: formatDate(s.date),
        Stream: s.module_stream,
        Trainer: s.trainer,
        Location: s.location,
        Status: s.status,
        'Max Capacity': s.max_capacity,
        'Attendance': s.attendance_count,
        'Attendance %': s.max_capacity > 0 ? Math.round(s.attendance_count / s.max_capacity * 100) + '%' : '',
        Notes: s.notes || '',
      })),
      'training_sessions'
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Training Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track training sessions, streams, and attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Session
          </Button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Sessions Delivered</span>
          </div>
          <div className="text-2xl font-bold">{delivered.length}</div>
          <div className="text-xs text-muted-foreground">{scheduled.length} scheduled</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Total Attendees</span>
          </div>
          <div className="text-2xl font-bold">{totalAttendance}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Avg Attendance</span>
          </div>
          <div className="text-2xl font-bold">{avgAttendancePct}%</div>
          <Progress value={avgAttendancePct} className="mt-1 h-1" />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Streams Covered</span>
          </div>
          <div className="text-2xl font-bold">{streamData.filter(s => s.sessions > 0).length}/{STREAMS.length}</div>
        </div>
      </div>

      {/* By-stream bar chart */}
      {sessions.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Sessions by Stream</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={streamData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="stream" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="sessions" name="Delivered Sessions" radius={[3, 3, 0, 0]}>
                {streamData.map((_, i) => (
                  <Cell key={i} fill={`hsl(var(--primary) / ${0.4 + (_.sessions / (Math.max(...streamData.map(s => s.sessions)) || 1)) * 0.6})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session Register */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No training sessions logged yet</p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add your first session
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Stream / Module</th>
                <th className="text-left p-3 font-medium">Trainer</th>
                <th className="text-left p-3 font-medium">Location</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Capacity</th>
                <th className="text-right p-3 font-medium">Attended</th>
                <th className="text-right p-3 font-medium">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="p-3 whitespace-nowrap">{formatDate(s.date)}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">{s.module_stream}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{s.trainer}</td>
                  <td className="p-3 text-muted-foreground capitalize">{s.location.replace('-', ' ')}</td>
                  <td className="p-3">
                    <Badge className={`text-xs ${STATUS_COLORS[s.status]}`}>{s.status}</Badge>
                  </td>
                  <td className="p-3 text-right text-muted-foreground">{s.max_capacity}</td>
                  <td className="p-3 text-right">{s.status === 'delivered' ? s.attendance_count : '—'}</td>
                  <td className="p-3 text-right">
                    {s.status === 'delivered' && s.max_capacity > 0 ? (
                      <span className={s.attendance_count / s.max_capacity < 0.5 ? 'text-amber-600' : 'text-green-600'}>
                        {Math.round(s.attendance_count / s.max_capacity * 100)}%
                      </span>
                    ) : '—'}
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
            <DialogTitle>Add Training Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Stream / Module</Label>
                <Select value={form.module_stream} onValueChange={v => setForm(f => ({ ...f, module_stream: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STREAMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Trainer</Label>
              <Input value={form.trainer} onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))} placeholder="Trainer name" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Select value={form.location} onValueChange={v => setForm(f => ({ ...f, location: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-site">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Max Capacity</Label>
                <Input type="number" value={form.max_capacity} onChange={e => setForm(f => ({ ...f, max_capacity: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.status === 'delivered' && (
              <div className="space-y-1.5">
                <Label>Attendance Count</Label>
                <Input type="number" value={form.attendance_count} onChange={e => setForm(f => ({ ...f, attendance_count: parseInt(e.target.value) || 0 }))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Session notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => addSession.mutate(form)} disabled={!form.date || !form.trainer.trim() || addSession.isPending}>
              {addSession.isPending ? 'Saving...' : 'Add Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
