import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield, TrendingUp, AlertTriangle, CheckCircle, DollarSign,
  Download, Target, Activity, Clock, BarChart3, PieChart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { PDFExporter } from '@/components/common/PDFExporter';

const supabase = _supabase as any;

const HEALTH_COLORS = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' };

async function fetchGovernanceOverview() {
  const [projectsRes, risksRes, actionsRes, milestonesRes, budgetRes, evmRes] = await Promise.all([
    supabase.from('projects').select('id, name, status, health, progress, budget, spent, program_id'),
    supabase.from('risks').select('id, project_id, probability, impact, status'),
    supabase.from('actions').select('id, project_id, status, priority, due_date'),
    supabase.from('timeline_milestones').select('id, project_id, label, month, color'),
    supabase.from('project_budget_items').select('id, project_id, name, category, budgeted_amount, actual_amount'),
    supabase.from('project_evm_snapshots').select('id, project_id, snapshot_date, pv, ev, ac, bac, spi, cpi').order('snapshot_date'),
  ]);

  return {
    projects: projectsRes.data || [],
    risks: risksRes.data || [],
    actions: actionsRes.data || [],
    milestones: milestonesRes.data || [],
    budgetItems: budgetRes.data || [],
    evmSnapshots: evmRes.data || [],
  };
}

export default function GlobalGovernanceDashboard() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['governance-overview'],
    queryFn: fetchGovernanceOverview,
  });

  const metrics = useMemo(() => {
    if (!data) return null;
    const { projects, risks, actions, budgetItems, evmSnapshots } = data;

    const totalBudget = projects.reduce((s: number, p: any) => s + (p.budget || 0), 0);
    const totalSpent = projects.reduce((s: number, p: any) => s + (p.spent || 0), 0);
    const avgProgress = projects.length ? Math.round(projects.reduce((s: number, p: any) => s + (p.progress || 0), 0) / projects.length) : 0;

    const healthDist = projects.reduce((acc: any, p: any) => {
      const h = p.health || 'green';
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {});

    const riskBySeverity = risks.reduce((acc: any, r: any) => {
      const sev = r.impact === 'high' || r.impact === 'critical' ? 'High' : r.impact === 'medium' ? 'Medium' : 'Low';
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const actionsByStatus = actions.reduce((acc: any, a: any) => {
      const s = a.status || 'open';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const budgetByCategory = budgetItems.reduce((acc: any, b: any) => {
      const cat = b.category || 'other';
      if (!acc[cat]) acc[cat] = { planned: 0, actual: 0 };
      acc[cat].planned += b.budgeted_amount || 0;
      acc[cat].actual += b.actual_amount || 0;
      return acc;
    }, {} as Record<string, { planned: number; actual: number }>);

    return {
      totalProjects: projects.length,
      totalBudget,
      totalSpent,
      avgProgress,
      healthDist,
      riskBySeverity,
      actionsByStatus,
      budgetByCategory,
      latestEvm: evmSnapshots,
      openRisks: risks.filter((r: any) => r.status !== 'closed').length,
      overdueActions: actions.filter((a: any) => a.due_date && new Date(a.due_date) < new Date() && a.status !== 'completed').length,
    };
  }, [data]);

  if (isLoading || !metrics) {
    return <div className="flex items-center justify-center h-64"><Activity className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const healthPieData = Object.entries(metrics.healthDist).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: value as number,
    color: HEALTH_COLORS[key as keyof typeof HEALTH_COLORS] || '#94a3b8',
  }));

  const riskPieData = Object.entries(metrics.riskBySeverity).map(([key, value]) => ({
    name: key, value: value as number,
    color: key === 'High' ? '#ef4444' : key === 'Medium' ? '#f59e0b' : '#22c55e',
  }));

  const budgetChartData = Object.entries(metrics.budgetByCategory).map(([cat, vals]) => ({
    category: cat.charAt(0).toUpperCase() + cat.slice(1),
    planned: (vals as any).planned,
    actual: (vals as any).actual,
  }));

  const evmChartData = metrics.latestEvm.map((s: any) => ({
    date: new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    PV: s.pv, EV: s.ev, AC: s.ac,
  }));

  const utilization = metrics.totalBudget > 0 ? Math.round((metrics.totalSpent / metrics.totalBudget) * 100) : 0;

  return (
    <div className="p-6 space-y-6" ref={contentRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Governance Dashboard</h1>
            <p className="text-sm text-muted-foreground">Cross-project health, milestones & budget overview</p>
          </div>
        </div>
        <PDFExporter title="Governance Dashboard" filename="governance-dashboard" contentRef={contentRef} orientation="landscape" variant="dropdown" />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard icon={Target} label="Projects" value={metrics.totalProjects} color="text-blue-600" />
        <KPICard icon={TrendingUp} label="Avg Progress" value={`${metrics.avgProgress}%`} color="text-green-600" />
        <KPICard icon={DollarSign} label="Budget Used" value={`${utilization}%`} color={utilization > 90 ? 'text-red-600' : 'text-purple-600'} />
        <KPICard icon={AlertTriangle} label="Open Risks" value={metrics.openRisks} color="text-amber-600" />
        <KPICard icon={Clock} label="Overdue Actions" value={metrics.overdueActions} color={metrics.overdueActions > 0 ? 'text-red-600' : 'text-green-600'} />
      </div>

      {/* Charts Grid */}
      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health">Project Health</TabsTrigger>
          <TabsTrigger value="budget">Budget Analysis</TabsTrigger>
          <TabsTrigger value="risk">Risk Heatmap</TabsTrigger>
          <TabsTrigger value="evm">EVM Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Health Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie data={healthPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {healthPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Project Progress</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {data?.projects.map((p: any) => (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.health === 'green' ? 'default' : p.health === 'amber' ? 'secondary' : 'destructive'} className="text-[10px]">{p.health}</Badge>
                        <span className="text-muted-foreground">{p.progress || 0}%</span>
                      </div>
                    </div>
                    <Progress value={p.progress || 0} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Budget by Category</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="planned" name="Planned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Budget Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-bold">${(metrics.totalBudget / 1e6).toFixed(2)}M</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Spent</span>
                    <span className="font-bold">${(metrics.totalSpent / 1e6).toFixed(2)}M</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-bold text-green-600">${((metrics.totalBudget - metrics.totalSpent) / 1e6).toFixed(2)}M</span>
                  </div>
                  <Progress value={utilization} className="h-3 mt-3" />
                  <p className="text-xs text-muted-foreground text-center">{utilization}% utilized</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Risk Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {riskPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Risk Heatmap</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-1 text-xs">
                  <div />
                  {['Low', 'Medium', 'High'].map(imp => <div key={imp} className="text-center font-medium text-muted-foreground py-1">{imp}</div>)}
                  {['High', 'Medium', 'Low'].map(prob => (
                    <>
                      <div key={`label-${prob}`} className="font-medium text-muted-foreground flex items-center">{prob}</div>
                      {['low', 'medium', 'high'].map(imp => {
                        const count = data?.risks.filter((r: any) =>
                          (r.probability === prob.toLowerCase()) && (r.impact === imp)
                        ).length || 0;
                        const severity = (['high', 'high'].includes(prob.toLowerCase()) && imp === 'high') ? 'bg-red-500' :
                          (prob.toLowerCase() === 'medium' && imp === 'medium') ? 'bg-amber-400' : 
                          count > 0 ? 'bg-yellow-300' : 'bg-muted';
                        return (
                          <div key={`${prob}-${imp}`} className={`${severity} rounded p-3 text-center font-bold ${count > 0 ? 'text-white' : 'text-muted-foreground'}`}>
                            {count}
                          </div>
                        );
                      })}
                    </>
                  ))}
                  <div />
                  <div className="col-span-3 text-center text-muted-foreground mt-1">Impact →</div>
                </div>
                <div className="text-xs text-muted-foreground text-center mt-1">↑ Probability</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evm" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Earned Value Trends</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evmChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Area type="monotone" dataKey="PV" name="Planned Value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="EV" name="Earned Value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="AC" name="Actual Cost" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Milestones Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Milestone Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data?.milestones.map((m: any) => (
              <div key={m.id} className="flex flex-col items-center min-w-[120px] p-3 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: m.color || '#3b82f6' }} />
                <span className="text-xs font-medium text-center">{m.label}</span>
                <span className="text-[10px] text-muted-foreground mt-1">Month {m.month}</span>
              </div>
            ))}
            {(!data?.milestones || data.milestones.length === 0) && (
              <p className="text-sm text-muted-foreground py-4">No milestones found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Icon className={`h-7 w-7 ${color}`} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}
