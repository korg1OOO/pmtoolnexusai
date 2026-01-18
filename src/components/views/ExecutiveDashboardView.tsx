import { useState } from 'react';
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
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockPortfolios, mockPrograms, mockProjects, mockRisks } from '@/data/mockData';
import { KPICard } from '@/components/enterprise/KPICard';
import { StatusIndicator } from '@/components/enterprise/StatusIndicator';
import { ProgressRing } from '@/components/enterprise/ProgressRing';

export function ExecutiveDashboardView() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Calculate aggregate metrics
  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget.approved, 0);
  const totalActual = mockProjects.reduce((sum, p) => sum + p.budget.actual, 0);
  const totalForecast = mockProjects.reduce((sum, p) => sum + p.budget.forecast, 0);
  const avgProgress = mockProjects.reduce((sum, p) => sum + p.progress, 0) / mockProjects.length;

  const healthCounts = {
    green: mockProjects.filter(p => p.health === 'green').length,
    amber: mockProjects.filter(p => p.health === 'amber').length,
    red: mockProjects.filter(p => p.health === 'red').length,
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  // Generate trend data
  const generateTrendData = () => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        budget: Math.random() * 2000000 + 1000000,
        actual: Math.random() * 1800000 + 800000,
      });
    }
    return data;
  };

  const trendData = generateTrendData();
  const maxValue = Math.max(...trendData.map(d => Math.max(d.budget, d.actual)));

  return (
    <div className="space-y-6">
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
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  timeRange === range
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
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
            <p className="text-3xl font-bold">{formatCurrency(totalBudget)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Portfolio Budget</p>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Spent</span>
                <span className="font-medium">{formatCurrency(totalActual)}</span>
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
            <p className="text-3xl font-bold">{Math.round(avgProgress)}%</p>
            <p className="text-sm text-muted-foreground mt-1">Average Progress</p>
            <div className="mt-4">
              <Progress value={avgProgress} className="h-2" />
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
            <p className="text-3xl font-bold">{mockProjects.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Active Projects</p>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Programs</span>
                <span className="font-medium">{mockPrograms.length}</span>
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
              {healthCounts.red > 0 && (
                <Badge variant="critical" className="text-xs">Critical</Badge>
              )}
            </div>
            <p className="text-3xl font-bold">{healthCounts.amber + healthCounts.red}</p>
            <p className="text-sm text-muted-foreground mt-1">At Risk Projects</p>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Critical</span>
                <span className="font-medium text-destructive">{healthCounts.red}</span>
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
            <p className="text-3xl font-bold">{healthCounts.green}</p>
            <p className="text-sm text-muted-foreground mt-1">On Track</p>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium text-success">
                  {Math.round((healthCounts.green / mockProjects.length) * 100)}%
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
                  <div className="w-full flex gap-1 items-end" style={{ height: '200px' }}>
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
                  progress={Math.round((healthCounts.green / mockProjects.length) * 100)} 
                  size={150}
                  strokeWidth={12}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{healthCounts.green}</span>
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
                <span className="font-semibold">{healthCounts.green}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-sm">At Risk</span>
                </div>
                <span className="font-semibold">{healthCounts.amber}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-sm">Critical</span>
                </div>
                <span className="font-semibold">{healthCounts.red}</span>
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
              {mockRisks.slice(0, 4).map((risk, index) => (
                <motion.div
                  key={risk.id}
                  className="p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded ${
                        risk.impact === 'high' ? 'bg-destructive/10' : 
                        risk.impact === 'medium' ? 'bg-warning/10' : 'bg-muted'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          risk.impact === 'high' ? 'text-destructive' : 
                          risk.impact === 'medium' ? 'text-warning' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{risk.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{risk.owner}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        risk.probability === 'high' ? 'critical' :
                        risk.probability === 'medium' ? 'high' : 'low'
                      }>
                        {risk.probability}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
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
              {mockPrograms.map((program, index) => {
                const programProjects = mockProjects.filter(p => program.projectIds.includes(p.id));
                const programProgress = programProjects.reduce((sum, p) => sum + p.progress, 0) / programProjects.length;
                const programBudget = programProjects.reduce((sum, p) => sum + p.budget.approved, 0);
                const programActual = programProjects.reduce((sum, p) => sum + p.budget.actual, 0);

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
                        <StatusIndicator health={program.health} />
                        <div>
                          <p className="font-medium">{program.name}</p>
                          <p className="text-xs text-muted-foreground">{program.manager}</p>
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
                            {Math.round((programActual / programBudget) * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={(programActual / programBudget) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
              {[
                { name: 'Mobile App Beta Release', project: 'Mobile App Redesign', date: 'May 15', status: 'on-track' },
                { name: 'Data Warehouse Go-Live', project: 'DWM', date: 'May 20', status: 'at-risk' },
                { name: 'Security Audit Complete', project: 'Cloud Migration', date: 'May 25', status: 'on-track' },
                { name: 'User Training Complete', project: 'BI Dashboard', date: 'May 30', status: 'on-track' },
              ].map((milestone, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      milestone.status === 'on-track' ? 'bg-success/10' : 'bg-warning/10'
                    }`}>
                      <CheckCircle2 className={`h-4 w-4 ${
                        milestone.status === 'on-track' ? 'text-success' : 'text-warning'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{milestone.name}</p>
                      <p className="text-xs text-muted-foreground">{milestone.project}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={milestone.status === 'on-track' ? 'completed' : 'pending'}>
                      {milestone.date}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
