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
import { Plus, Activity } from 'lucide-react';
import { formatDate, exportToCSV } from '@/lib/utils';
import { toast } from 'sonner';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend,
  Cell,
} from 'recharts';

interface ADKARAssessment {
  id: string;
  project_id: string;
  business_unit: string;
  module_stream: string;
  assessment_date: string;
  awareness_score: number;
  desire_score: number;
  knowledge_score: number;
  ability_score: number;
  reinforcement_score: number;
  overall_score: number;
  assessor: string;
  notes: string | null;
  created_at: string;
}

const ADKAR_DIMS = [
  { key: 'awareness_score' as const, label: 'Awareness', short: 'A' },
  { key: 'desire_score' as const, label: 'Desire', short: 'D' },
  { key: 'knowledge_score' as const, label: 'Knowledge', short: 'K' },
  { key: 'ability_score' as const, label: 'Ability', short: 'A' },
  { key: 'reinforcement_score' as const, label: 'Reinforcement', short: 'R' },
];

const STREAMS = ['Finance', 'Procurement', 'SCM', 'HCM', 'Payroll', 'EPM', 'Technical', 'General'];

const ragColor = (score: number) => {
  if (score >= 4) return 'text-green-600';
  if (score >= 3) return 'text-amber-600';
  return 'text-red-600';
};

const ragBg = (score: number) => {
  if (score >= 4) return 'bg-green-500/15';
  if (score >= 3) return 'bg-amber-500/15';
  return 'bg-red-500/15';
};

const calcOverall = (form: any) =>
  Math.round((form.awareness_score + form.desire_score + form.knowledge_score + form.ability_score + form.reinforcement_score) / 5 * 10) / 10;

const EMPTY_FORM = {
  business_unit: '',
  module_stream: 'Finance',
  assessment_date: new Date().toISOString().split('T')[0],
  awareness_score: 3,
  desire_score: 3,
  knowledge_score: 3,
  ability_score: 3,
  reinforcement_score: 3,
  assessor: '',
  notes: '',
};

export default function ChangeReadinessView() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['adkar_assessments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adkar_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('assessment_date', { ascending: true });
      if (error) throw error;
      return data as ADKARAssessment[];
    },
    enabled: !!projectId,
  });

  const addAssessment = useMutation({
    mutationFn: async (values: typeof EMPTY_FORM) => {
      const overall = calcOverall(values);
      const { error } = await supabase.from('adkar_assessments').insert({
        ...values,
        project_id: projectId,
        overall_score: overall,
        notes: values.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adkar_assessments', projectId] });
      toast.success('Assessment recorded');
      setOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error('Failed to save assessment'),
  });

  // Average score per ADKAR dimension across all assessments
  const dimAverages = ADKAR_DIMS.map(dim => ({
    label: dim.label,
    score: assessments.length > 0
      ? Math.round(assessments.reduce((s, a) => s + a[dim.key], 0) / assessments.length * 10) / 10
      : 0,
  }));

  // Overall average
  const overallAvg = assessments.length > 0
    ? Math.round(assessments.reduce((s, a) => s + a.overall_score, 0) / assessments.length * 10) / 10
    : 0;

  // Trend data (group by date)
  const trendData = assessments.reduce((acc, a) => {
    const date = a.assessment_date;
    const existing = acc.find(x => x.date === date);
    if (existing) {
      existing.overall = Math.round((existing.overall + a.overall_score) / 2 * 10) / 10;
    } else {
      acc.push({ date: formatDate(date), overall: a.overall_score });
    }
    return acc;
  }, [] as { date: string; overall: number }[]);

  // BU breakdown — latest assessment per BU
  const buMap = new Map<string, ADKARAssessment>();
  assessments.forEach(a => {
    const existing = buMap.get(a.business_unit);
    if (!existing || a.assessment_date > existing.assessment_date) {
      buMap.set(a.business_unit, a);
    }
  });
  const buRows = Array.from(buMap.values());

  const radialData = [{ name: 'Overall', value: (overallAvg / 5) * 100, fill: 'hsl(var(--primary))' }];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Change Readiness (ADKAR)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Awareness · Desire · Knowledge · Ability · Reinforcement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(
            assessments.map(a => ({
              'Business Unit': a.business_unit,
              Stream: a.module_stream,
              Date: formatDate(a.assessment_date),
              Assessor: a.assessor,
              Awareness: a.awareness_score,
              Desire: a.desire_score,
              Knowledge: a.knowledge_score,
              Ability: a.ability_score,
              Reinforcement: a.reinforcement_score,
              Overall: a.overall_score,
            })), 'adkar_assessments'
          )}>
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Assessment
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : assessments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Activity className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No ADKAR assessments recorded yet</p>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add your first assessment
          </Button>
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Overall gauge */}
            <div className="rounded-lg border bg-card p-4 flex flex-col items-center">
              <h3 className="text-sm font-semibold mb-2">Overall Readiness</h3>
              <div className="relative w-full h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={radialData}>
                    <RadialBar dataKey="value" cornerRadius={6} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
                  <span className="text-3xl font-bold">{overallAvg}</span>
                  <span className="text-xs text-muted-foreground">/ 5.0</span>
                </div>
              </div>
            </div>

            {/* Dim bar chart */}
            <div className="col-span-2 rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-2">Average Score by Dimension</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={dimAverages} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [v, 'Avg Score']} />
                  <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                    {dimAverages.map((d, i) => (
                      <Cell key={i} fill={d.score >= 4 ? '#22c55e' : d.score >= 3 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend */}
          {trendData.length > 1 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-2">Overall Score Trend</h3>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="overall" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* BU Breakdown */}
          <div className="rounded-lg border overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30 text-sm font-semibold">BU Breakdown — Latest Assessment per Business Unit</div>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Business Unit</th>
                  <th className="text-left p-3 font-medium">Stream</th>
                  {ADKAR_DIMS.map(d => (
                    <th key={d.key} className="text-center p-3 font-medium">{d.label}</th>
                  ))}
                  <th className="text-center p-3 font-medium">Overall</th>
                  <th className="text-left p-3 font-medium">Assessor</th>
                  <th className="text-left p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {buRows.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="p-3 font-medium">{a.business_unit}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">{a.module_stream}</Badge>
                    </td>
                    {ADKAR_DIMS.map(d => (
                      <td key={d.key} className={`p-3 text-center font-semibold ${ragColor(a[d.key])}`}>
                        {a[d.key]}
                      </td>
                    ))}
                    <td className={`p-3 text-center font-bold ${ragColor(a.overall_score)}`}>{a.overall_score}</td>
                    <td className="p-3 text-muted-foreground">{a.assessor}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(a.assessment_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add ADKAR Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Business Unit *</Label>
                <Input value={form.business_unit} onChange={e => setForm(f => ({ ...f, business_unit: e.target.value }))} placeholder="e.g. Finance Operations" />
              </div>
              <div className="space-y-1.5">
                <Label>Stream</Label>
                <Select value={form.module_stream} onValueChange={v => setForm(f => ({ ...f, module_stream: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STREAMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Assessment Date</Label>
                <Input type="date" value={form.assessment_date} onChange={e => setForm(f => ({ ...f, assessment_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Assessor</Label>
                <Input value={form.assessor} onChange={e => setForm(f => ({ ...f, assessor: e.target.value }))} placeholder="Your name" />
              </div>
            </div>
            {/* ADKAR scores */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/30">
              <div className="text-xs font-semibold text-muted-foreground">ADKAR Scores (1=None, 5=Excellent)</div>
              {ADKAR_DIMS.map(dim => (
                <div key={dim.key} className="flex items-center gap-3">
                  <Label className="w-28 text-sm">{dim.label}</Label>
                  <Select value={String(form[dim.key])} onValueChange={v => setForm(f => ({ ...f, [dim.key]: parseInt(v) }))}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className={`text-sm font-medium ${ragColor(form[dim.key])}`}>
                    {['', 'Very Low', 'Low', 'Moderate', 'High', 'Excellent'][form[dim.key]]}
                  </span>
                </div>
              ))}
              <div className="text-xs text-muted-foreground pt-1">Overall: <strong>{calcOverall(form)} / 5</strong></div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Assessment notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => addAssessment.mutate(form)} disabled={!form.business_unit.trim() || !form.assessor.trim() || addAssessment.isPending}>
              {addAssessment.isPending ? 'Saving...' : 'Save Assessment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
