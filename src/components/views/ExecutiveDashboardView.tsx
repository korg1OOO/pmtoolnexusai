import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  RefreshCw,
  Download,
  Calendar,
  Zap,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { KPICard } from '@/components/enterprise/KPICard';
import { StatusIndicator } from '@/components/enterprise/StatusIndicator';
import { ProgressRing } from '@/components/enterprise/ProgressRing';
import { useProjects } from '@/hooks/useProjects';
import { usePortfolios } from '@/hooks/usePortfolios';
import { usePrograms } from '@/hooks/usePrograms';
import { useRisks } from '@/hooks/useRisks';
import { useOrgFinancials } from '@/hooks/useOrgFinancials';

export function ExecutiveDashboardView() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const { data: projects = [], isLoading: loadingProjects, refetch: refetchProjects } = useProjects();
  const { data: portfolios = [], isLoading: loadingPortfolios, refetch: refetchPortfolios } = usePortfolios();
  const { data: programs = [], isLoading: loadingPrograms, refetch: refetchPrograms } = usePrograms();
  const { risks: allRisks = [], loading: loadingRisks, refetch: refetchRisks } = useRisks();

  const isLoading = loadingProjects || loadingPortfolios || loadingPrograms || loadingRisks;

  const metrics = useMemo(() => {
    if (!projects.length) return {
      totalBudget: 0,
      totalActual: 0,
      avgProgress: 0,
      healthCounts: { green: 0, amber: 0, red: 0 }
    };

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalActual = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
    const avgProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length;

    const healthCounts = {
      green: projects.filter(p => p.health === 'green').length,
      amber: projects.filter(p => p.health === 'amber').length,
      red: projects.filter(p => p.health === 'red').length,
    };

    return { totalBudget, totalActual, avgProgress, healthCounts };
  }, [projects]);

  const activeRisks = useMemo(() => {
    return allRisks.filter(r => r.status !== 'closed').sort((a, b) => {
      const impactOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      return (impactOrder[b.impact as keyof typeof impactOrder] || 0) - (impactOrder[a.impact as keyof typeof impactOrder] || 0);
    });
  }, [allRisks]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const { data: financials, refetch: refetchFinancials } = useOrgFinancials();

  const trendData = useMemo(() => {
    return financials?.trendData || [];
  }, [financials]);

  const maxValue = Math.max(...trendData.map(d => Math.max(d.budget, d.actual)));

  const handleRefresh = () => {
    refetchProjects();
    refetchPortfolios();
    refetchPrograms();
    refetchRisks();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Strategic overview of portfolio performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${timeRange === range
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Executive KPIs - Large Format */}
      <div className="grid grid-cols-5 gap-4">
        <Card variant="glass" className="col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-success">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">2.4%</span>
              </div>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(metrics.totalBudget)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Portfolio Budget</p>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium">{formatCurrency(metrics.totalActual)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-success/10">
                <Target className="h-6 w-6 text-success" />
              </div>
              <div className="flex items-center gap-1 text-success">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">5.2%</span>
              </div>
            </div>
            <p className="text-3xl font-bold">{Math.round(metrics.avgProgress)}%</p>
            <p className="text-sm text-muted-foreground mt-1">Average Progress</p>
            <div className="mt-4">
              <Progress value={metrics.avgProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold">{projects.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Active Projects</p>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Programs</span>
                <span className="font-medium">{programs.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              {metrics.healthCounts.red > 0 && (
                <Badge variant="critical" className="text-xs">Critical</Badge>
              )}
            </div>
            <p className="text-3xl font-bold">{metrics.healthCounts.amber + metrics.healthCounts.red}</p>
            <p className="text-sm text-muted-foreground mt-1">At Risk Projects</p>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Critical</span>
                <span className="font-medium text-destructive">{metrics.healthCounts.red}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold">{metrics.healthCounts.green}</p>
            <p className="text-sm text-muted-foreground mt-1">On Track</p>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium text-success">
                  {projects.length > 0 ? Math.round((metrics.healthCounts.green / projects.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Budget Trend Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Budget vs Actual Trend</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Budget</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">Actual</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2">
              {trendData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end h-[200px]">
                    <motion.div
                      className="flex-1 bg-primary/30 rounded-t"
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.budget / maxValue) * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    />
                    <motion.div
                      className="flex-1 bg-success rounded-t"
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.actual / maxValue) * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 + 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{data.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Health */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                <ProgressRing
                  value={projects.length > 0 ? Math.round((metrics.healthCounts.green / projects.length) * 100) : 0}
                  size={150}
                  strokeWidth={12}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{metrics.healthCounts.green}</span>
                  <span className="text-xs text-muted-foreground">Healthy</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm">On Track</span>
                </div>
                <span className="font-semibold">{metrics.healthCounts.green}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-sm">At Risk</span>
                </div>
                <span className="font-semibold">{metrics.healthCounts.amber}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-sm">Critical</span>
                </div>
                <span className="font-semibold">{metrics.healthCounts.red}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Risks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Portfolio Risks</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeRisks.slice(0, 4).map((risk, index) => (
                <motion.div
                  key={risk.id}
                  className="p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded ${risk.impact === 'critical' || risk.impact === 'high' ? 'bg-destructive/10' :
                        risk.impact === 'medium' ? 'bg-warning/10' : 'bg-muted'
                        }`}>
                        <AlertTriangle className={`h-4 w-4 ${risk.impact === 'critical' || risk.impact === 'high' ? 'text-destructive' :
                          risk.impact === 'medium' ? 'text-warning' : 'text-muted-foreground'
                          }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{risk.title || (risk as any).name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{(risk as any).owner || 'Unassigned'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={risk.impact as any}>
                        {risk.impact}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
              {activeRisks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No active risks</p>}
            </div>
          </CardContent>
        </Card>

        {/* Program Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Program Performance</CardTitle>
              <Button variant="ghost" size="sm">Details</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {programs.slice(0, 4).map((program, index) => {
                const programProjects = projects.filter(p => (p as any).program_id === program.id);
                const programProgress = programProjects.length > 0
                  ? programProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / programProjects.length
                  : 0;
                const programBudget = programProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
                const programActual = programProjects.reduce((sum, p) => sum + (p.spent || 0), 0);
                const budgetProgress = programBudget > 0 ? (programActual / programBudget) * 100 : 0;

                return (
                  <motion.div
                    key={program.id}
                    className="p-4 rounded-lg border border-border"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <StatusIndicator status={(program as any).health || 'green'} pulse />
                        <div>
                          <p className="font-medium">{program.name}</p>
                          <p className="text-xs text-muted-foreground">{(program as any).manager_id || 'No Manager'}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{programProjects.length} Projects</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Progress</span>
                          <span className="text-xs font-medium">{Math.round(programProgress)}%</span>
                        </div>
                        <Progress value={programProgress} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Budget</span>
                          <span className="text-xs font-medium">
                            {Math.round(budgetProgress)}%
                          </span>
                        </div>
                        <Progress
                          value={budgetProgress}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {programs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No active programs</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Upcoming */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Briefcase className="h-5 w-5" />
                <span className="text-xs">New Project</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs">Log Risk</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Schedule</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Zap className="h-5 w-5" />
                <span className="text-xs">AI Insights</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Milestones</CardTitle>
              <Button variant="ghost" size="sm">View Calendar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.filter(p => p.progress < 100).slice(0, 4).map((project, index) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${project.health === 'green' ? 'bg-success/10' : 'bg-warning/10'
                      }`}>
                      <CheckCircle2 className={`h-4 w-4 ${project.health === 'green' ? 'text-success' : 'text-warning'
                        }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Completion: {project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={project.health === 'green' ? 'success' : 'warning'}>
                      {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'TBD'}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No upcoming milestones</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
