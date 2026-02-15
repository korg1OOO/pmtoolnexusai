import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Users, Briefcase, Download, FileText } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getWorkspaceAnalytics, getWorkspaceOverview } from '@/services/workspaceService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

export function WorkspaceAnalytics() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('6m');
  const [activeChart, setActiveChart] = useState<string | null>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  const { data: overview } = useQuery({
    queryKey: ['workspace-overview', workspaceId],
    queryFn: () => getWorkspaceOverview(workspaceId!),
    enabled: !!workspaceId,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['workspace-analytics', workspaceId, timeRange],
    queryFn: () => getWorkspaceAnalytics(workspaceId!),
    enabled: !!workspaceId,
  });

  const metrics = {
    portfolios: overview?.total_portfolios || 0,
    programs: overview?.total_programs || 0,
    projects: overview?.total_projects || 0,
    members: overview?.total_members || 0,
  };

  const exportCSV = useCallback(() => {
    const rows: string[][] = [['Section', 'Key', 'Value']];

    // Metrics
    Object.entries(metrics).forEach(([k, v]) => rows.push(['Metric', k, String(v)]));

    // Performance trend
    analytics?.performanceTrend?.forEach((r) =>
      rows.push(['Performance', r.month, `OnTrack:${r.onTrack} AtRisk:${r.atRisk} Delayed:${r.delayed}`])
    );

    // Portfolio distribution
    analytics?.portfolioDistribution?.forEach((r) =>
      rows.push(['Portfolio', r.name, String(r.value)])
    );

    // Resource utilization
    analytics?.resourceUtilization?.forEach((r) =>
      rows.push(['Resource', r.role, `${r.utilization}%`])
    );

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analytics, metrics]);

  const exportPDF = useCallback(async () => {
    if (!chartsRef.current) return;
    const canvas = await html2canvas(chartsRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`workspace-analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, []);

  const handleChartClick = (chartId: string) => {
    setActiveChart(activeChart === chartId ? null : chartId);
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading analytics...</div>;
  }

  const hasTrendData = (analytics?.performanceTrend?.length ?? 0) > 0;
  const hasDistData = (analytics?.portfolioDistribution?.length ?? 0) > 0;
  const hasResData = (analytics?.resourceUtilization?.length ?? 0) > 0;

  return (
    <div className="p-6 space-y-6" ref={chartsRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workspace Analytics</h1>
          <p className="text-muted-foreground">Performance insights and metrics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded-md px-3 py-2 bg-background text-foreground"
            aria-label="Select time range"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={exportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Briefcase, label: 'Portfolios', value: metrics.portfolios, cls: 'text-blue-600' },
          { icon: BarChart3, label: 'Programs', value: metrics.programs, cls: 'text-green-600' },
          { icon: TrendingUp, label: 'Projects', value: metrics.projects, cls: 'text-purple-600' },
          { icon: Users, label: 'Team Members', value: metrics.members, cls: 'text-orange-600' },
        ].map((m) => (
          <Card key={m.label} className="p-6">
            <div className="flex items-center gap-3">
              <m.icon className={`w-8 h-8 ${m.cls}`} />
              <div>
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold">{m.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card
          className={`p-6 cursor-pointer transition-shadow ${activeChart === 'trend' ? 'ring-2 ring-primary shadow-lg' : ''}`}
          onClick={() => handleChartClick('trend')}
        >
          <h2 className="text-xl font-semibold mb-4">Project Performance Trend</h2>
          {hasTrendData ? (
            <ResponsiveContainer width="100%" height={activeChart === 'trend' ? 350 : 250}>
              <BarChart data={analytics?.performanceTrend} onClick={(data) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  const month = data.activePayload[0].payload.month;
                  const status = data.activeLabel === 'On Track' ? 'on-track' : data.activeLabel === 'At Risk' ? 'at-risk' : 'delayed';
                  navigate(`/workspace/${workspaceId}/analytics/performance?month=${month}&status=${status}`);
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="onTrack" fill="hsl(160, 84%, 39%)" name="On Track" radius={[4, 4, 0, 0]} cursor="pointer" />
                <Bar dataKey="atRisk" fill="hsl(38, 92%, 50%)" name="At Risk" radius={[4, 4, 0, 0]} cursor="pointer" />
                <Bar dataKey="delayed" fill="hsl(0, 84%, 60%)" name="Delayed" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No project data available yet
            </div>
          )}
        </Card>

        {/* Portfolio Distribution */}
        <Card
          className={`p-6 cursor-pointer transition-shadow ${activeChart === 'dist' ? 'ring-2 ring-primary shadow-lg' : ''}`}
          onClick={() => handleChartClick('dist')}
        >
          <h2 className="text-xl font-semibold mb-4">Project Distribution by Portfolio</h2>
          {hasDistData ? (
            <ResponsiveContainer width="100%" height={activeChart === 'dist' ? 350 : 250}>
              <PieChart onClick={(data) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  navigate(`/workspace/${workspaceId}/analytics/portfolio`);
                }
              }}>
                <Pie
                  data={analytics?.portfolioDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={activeChart === 'dist' ? 120 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  cursor="pointer"
                >
                  {analytics?.portfolioDistribution?.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No portfolio data available yet
            </div>
          )}
        </Card>
      </div>

      {/* Resource Utilization */}
      <Card
        className={`p-6 cursor-pointer transition-shadow ${activeChart === 'resource' ? 'ring-2 ring-primary shadow-lg' : ''}`}
        onClick={() => handleChartClick('resource')}
      >
        <h2 className="text-xl font-semibold mb-4">Resource Utilization by Role</h2>
        {hasResData ? (
          <ResponsiveContainer width="100%" height={activeChart === 'resource' ? 350 : 250}>
            <BarChart data={analytics?.resourceUtilization} layout="vertical" onClick={(data) => {
              if (data && data.activePayload && data.activePayload[0]) {
                const role = data.activePayload[0].payload.role;
                navigate(`/workspace/${workspaceId}/analytics/resources?role=${role}`);
              }
            }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="role" type="category" tick={{ fontSize: 12 }} width={120} />
              <Tooltip
                formatter={(value: number) => `${value}%`}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="utilization" fill="hsl(217, 91%, 60%)" name="Utilization %" radius={[0, 4, 4, 0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No team members assigned yet
          </div>
        )}
      </Card>

      {/* Budget Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Budget Utilization by Portfolio</h2>
        {(analytics?.portfolio_performance?.length ?? 0) > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics?.portfolio_performance}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="portfolio_id" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="on_track_percentage" fill="hsl(160, 84%, 39%)" name="On Track %" radius={[4, 4, 0, 0]} />
              <Bar dataKey="budget_utilization" fill="hsl(217, 91%, 60%)" name="Budget Used %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No budget data available yet
          </div>
        )}
      </Card>
    </div>
  );
}
