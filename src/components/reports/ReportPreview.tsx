import { useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PDFExporter } from '@/components/common/PDFExporter';
import {
  Download,
  RefreshCw,
  Calendar,
  Clock,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Report } from './ReportCard';

interface ReportPreviewProps {
  report: Report | null;
  onRefresh: () => void;
}

// ── Hooks ────────────────────────────────────────────────────────────────────

function useProjectStatusData() {
  return useQuery({
    queryKey: ['report-project-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('health');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p: { health: string }) => {
        const label = p.health ?? 'Unknown';
        counts[label] = (counts[label] ?? 0) + 1;
      });
      const COLOR: Record<string, string> = {
        'on-track': 'hsl(var(--success))',
        'at-risk': 'hsl(var(--warning))',
        'critical': 'hsl(var(--destructive))',
      };
      return Object.entries(counts).map(([key, value]) => ({
        name: key.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
        color: COLOR[key] ?? 'hsl(var(--muted-foreground))',
      }));
    },
  });
}

function useBudgetTrendData() {
  return useQuery({
    queryKey: ['report-budget-trend'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('budget, spent, start_date')
        .order('start_date', { ascending: true });
      if (error) throw error;

      // Group cumulative spend by month based on project start months
      const monthMap = new Map<string, { budget: number; actual: number }>();
      ((data ?? []) as any[]).forEach((p) => {
        if (!p.start_date) return;
        const month = new Date(p.start_date).toLocaleString('default', {
          month: 'short',
        });
        const existing = monthMap.get(month) ?? { budget: 0, actual: 0 };
        monthMap.set(month, {
          budget: existing.budget + (p.budget ?? 0),
          actual: existing.actual + (p.spent ?? 0),
        });
      });

      return Array.from(monthMap.entries()).map(([month, vals]) => ({
        month,
        budget: vals.budget,
        actual: vals.actual,
      }));
    },
  });
}

function useVelocityData() {
  return useQuery({
    queryKey: ['report-velocity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprints')
        .select('name, completed_points')
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return ((data ?? []) as any[])
        .reverse()
        .map((s, i) => ({
          sprint: s.name ?? `Sprint ${i + 1}`,
          planned: Math.round((s.completed_points ?? 0) * 1.1), // estimate planned as 10% above actual
          completed: s.completed_points ?? 0,
        }));
    },
  });
}

function useResourceUtilizationData() {
  return useQuery({
    queryKey: ['report-resource-utilization'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('type, max_units');
      if (error) throw error;
      const typeMap = new Map<string, number[]>();
      ((data ?? []) as any[]).forEach((r) => {
        const type = r.type ?? 'Other';
        const existing = typeMap.get(type) ?? [];
        existing.push(r.max_units ?? 100);
        typeMap.set(type, existing);
      });
      return Array.from(typeMap.entries()).map(([name, vals]) => {
        const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        const utilized = Math.min(avg, 100);
        return { name, utilized, available: 100 - utilized };
      });
    },
  });
}

function useRiskSummaryData() {
  return useQuery({
    queryKey: ['report-risks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('risks')
        .select('id, impact, status');
      if (error) throw error;
      const risks = (data ?? []) as { id: string; impact: string; status: string }[];
      return {
        high: risks.filter((r) => r.impact === 'high' || r.impact === 'critical').length,
        medium: risks.filter((r) => r.impact === 'medium').length,
        low: risks.filter((r) => r.impact === 'low').length,
        topRisks: risks.slice(0, 3),
      };
    },
  });
}

// ── Chart skeletons ──────────────────────────────────────────────────────────
function ChartSkeleton() {
  return <Skeleton className="w-full h-[220px] rounded-xl" />;
}

// ── Main component ───────────────────────────────────────────────────────────
export function ReportPreview({ report, onRefresh }: ReportPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: statusData = [], isLoading: statusLoading } = useProjectStatusData();
  const { data: budgetData = [], isLoading: budgetLoading } = useBudgetTrendData();
  const { data: velocityData = [], isLoading: velocityLoading } = useVelocityData();
  const { data: resourceData = [], isLoading: resourceLoading } = useResourceUtilizationData();
  const { data: riskData, isLoading: riskLoading } = useRiskSummaryData();

  if (!report) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a report to preview</p>
            <p className="text-sm mt-1">
              Choose a report from the list to view its contents
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = report.icon;

  const renderChart = () => {
    switch (report.type) {
      case 'status':
        return (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Project Health Distribution</h4>
              {statusLoading || velocityLoading ? <ChartSkeleton /> : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  {statusData.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground mt-2">No project data</p>
                  )}
                </>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4">Sprint Velocity Trend</h4>
              {velocityLoading ? <ChartSkeleton /> : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={velocityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="sprint" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="planned" fill="hsl(var(--muted-foreground))" name="Planned" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  {velocityData.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground mt-2">No sprint data</p>
                  )}
                </>
              )}
            </div>
          </div>
        );

      case 'financial':
        return (
          <div>
            <h4 className="text-sm font-medium mb-4">Budget vs Actuals</h4>
            {budgetLoading ? <ChartSkeleton /> : (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="budget"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      name="Budget"
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success))"
                      fillOpacity={0.3}
                      name="Actual"
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
                {budgetData.length === 0 && (
                  <p className="text-sm text-center text-muted-foreground mt-2">No budget data</p>
                )}
              </>
            )}
          </div>
        );

      case 'resource':
        return (
          <div>
            <h4 className="text-sm font-medium mb-4">Resource Utilization by Role</h4>
            {resourceLoading ? <ChartSkeleton /> : (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={resourceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="utilized" stackId="a" fill="hsl(var(--primary))" name="Utilized %" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="available" stackId="a" fill="hsl(var(--muted))" name="Available %" radius={[0, 4, 4, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
                {resourceData.length === 0 && (
                  <p className="text-sm text-center text-muted-foreground mt-2">No resource data</p>
                )}
              </>
            )}
          </div>
        );

      case 'risk':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Risk Summary</h4>
            {riskLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="text-2xl font-bold text-destructive">{riskData?.high ?? 0}</div>
                    <div className="text-xs text-muted-foreground">High / Critical Risks</div>
                  </div>
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="text-2xl font-bold text-warning">{riskData?.medium ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Medium Risks</div>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="text-2xl font-bold text-success">{riskData?.low ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Low Risks</div>
                  </div>
                </div>
                {(riskData?.topRisks ?? []).length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Risk ID</th>
                          <th className="text-left p-3 font-medium">Impact</th>
                          <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {riskData!.topRisks.map((r) => (
                          <tr key={r.id}>
                            <td className="p-3 font-mono text-xs">{r.id.slice(0, 8)}…</td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  r.impact === 'high' || r.impact === 'critical'
                                    ? 'destructive'
                                    : 'outline'
                                }
                              >
                                {r.impact}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{r.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Custom report preview</p>
          </div>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{report.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{report.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <PDFExporter
              title={report.name}
              filename={report.id}
              contentRef={contentRef}
              variant="dropdown"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
          <span className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Generated: {report.lastGenerated}
          </span>
          {report.nextRun && (
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Next run: {report.nextRun}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto" ref={contentRef}>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
