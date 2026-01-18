import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  DollarSign,
  Calendar,
  Users,
  ChevronRight,
  Layers,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockProject } from '@/data/mockData';
import { KPICard } from '@/components/enterprise/KPICard';
import { StatusIndicator } from '@/components/enterprise/StatusIndicator';
import { ProgressRing } from '@/components/enterprise/ProgressRing';

// Mock portfolio data
const portfolios = [
  { id: 'port-1', name: 'Digital Transformation', owner: 'Sarah Chen', totalBudget: 25000000, programCount: 2 },
  { id: 'port-2', name: 'Infrastructure Modernization', owner: 'Michael Ross', totalBudget: 15000000, programCount: 1 },
];

const programs = [
  { id: 'prog-1', name: 'Customer Experience Platform', code: 'CXP', health: 'green' as const, manager: 'David Park', projectCount: 3, budget: 5500000, spent: 3510000, progress: 58 },
  { id: 'prog-2', name: 'Data Analytics Initiative', code: 'DAI', health: 'amber' as const, manager: 'Lisa Wang', projectCount: 2, budget: 5700000, spent: 2345000, progress: 40 },
  { id: 'prog-3', name: 'Cloud Migration', code: 'CLM', health: 'red' as const, manager: 'James Wilson', projectCount: 3, budget: 9300000, spent: 3615000, progress: 34 },
];

const projects = [
  { id: 'proj-1', name: 'Mobile App Redesign', code: 'MAR', programCode: 'CXP', status: 'active' as const, health: 'green' as const, progress: 68, budget: 2500000, spent: 1650000, manager: 'Emily Johnson', endDate: '2024-08-30' },
  { id: 'proj-2', name: 'Web Portal Enhancement', code: 'WPE', programCode: 'CXP', status: 'active' as const, health: 'amber' as const, progress: 82, budget: 1800000, spent: 1580000, manager: 'Robert Kim', endDate: '2024-07-15' },
  { id: 'proj-3', name: 'CRM Integration', code: 'CRI', programCode: 'CXP', status: 'active' as const, health: 'green' as const, progress: 25, budget: 1200000, spent: 280000, manager: 'Anna Martinez', endDate: '2024-10-30' },
  { id: 'proj-4', name: 'Data Warehouse Modernization', code: 'DWM', programCode: 'DAI', status: 'active' as const, health: 'amber' as const, progress: 45, budget: 3500000, spent: 1575000, manager: 'Chris Lee', endDate: '2024-12-15' },
  { id: 'proj-5', name: 'BI Dashboard Platform', code: 'BDP', programCode: 'DAI', status: 'active' as const, health: 'green' as const, progress: 35, budget: 2200000, spent: 770000, manager: 'Sophie Turner', endDate: '2024-11-30' },
  { id: 'proj-6', name: 'Legacy System Migration', code: 'LSM', programCode: 'CLM', status: 'active' as const, health: 'red' as const, progress: 32, budget: 5000000, spent: 1850000, manager: 'Mark Thompson', endDate: '2025-03-31' },
  { id: 'proj-7', name: 'Network Infrastructure', code: 'NIF', programCode: 'CLM', status: 'active' as const, health: 'green' as const, progress: 55, budget: 2800000, spent: 1540000, manager: 'Jennifer Brown', endDate: '2024-09-30' },
  { id: 'proj-8', name: 'Security Compliance', code: 'SEC', programCode: 'CLM', status: 'on-hold' as const, health: 'amber' as const, progress: 15, budget: 1500000, spent: 225000, manager: 'Alex Rivera', endDate: '2024-11-30' },
];

export function PortfolioView() {
  const [selectedPortfolio, setSelectedPortfolio] = useState(portfolios[0]);
  const [viewMode, setViewMode] = useState<'overview' | 'programs' | 'projects'>('overview');

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const avgProgress = projects.reduce((sum, p) => sum + p.progress, 0) / projects.length;

  const healthCounts = {
    green: projects.filter(p => p.health === 'green').length,
    amber: projects.filter(p => p.health === 'amber').length,
    red: projects.filter(p => p.health === 'red').length,
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Portfolio Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Strategic oversight of programs and projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" />Filter</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
        </div>
      </div>

      {/* Portfolio Selector */}
      <div className="flex gap-3">
        {portfolios.map((portfolio) => (
          <motion.button
            key={portfolio.id}
            onClick={() => setSelectedPortfolio(portfolio)}
            className={`flex-1 p-4 rounded-lg border transition-all text-left ${
              selectedPortfolio.id === portfolio.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
            }`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedPortfolio.id === portfolio.id ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{portfolio.name}</h3>
                  <p className="text-xs text-muted-foreground">{portfolio.owner}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">{formatCurrency(portfolio.totalBudget)}</p>
                <p className="text-xs text-muted-foreground">{portfolio.programCount} Programs</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {(['overview', 'programs', 'projects'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
              viewMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {viewMode === 'overview' && (
        <>
          {/* Executive KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <KPICard title="Total Budget" value={formatCurrency(totalBudget)} subtitle={`${formatCurrency(totalSpent)} spent`} icon={DollarSign} trend={{ value: 2.5, isPositive: true }} status="success" />
            <KPICard title="Portfolio Progress" value={`${Math.round(avgProgress)}%`} subtitle="Average completion" icon={Target} trend={{ value: 5.2, isPositive: true }} status="neutral" />
            <KPICard title="Active Projects" value={projects.filter(p => p.status === 'active').length.toString()} subtitle={`${projects.filter(p => p.status === 'on-hold').length} on hold`} icon={Layers} status="neutral" />
            <KPICard title="At Risk" value={(healthCounts.amber + healthCounts.red).toString()} subtitle={`${healthCounts.red} critical`} icon={AlertTriangle} status={healthCounts.red > 0 ? 'error' : 'warning'} />
          </div>

          {/* Health Overview */}
          <div className="grid grid-cols-3 gap-4">
            <Card variant="glass">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Project Health Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success" /><span className="text-sm">On Track</span></div>
                    <div className="flex items-center gap-2"><span className="text-lg font-semibold">{healthCounts.green}</span><span className="text-xs text-muted-foreground">({Math.round((healthCounts.green / projects.length) * 100)}%)</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-warning" /><span className="text-sm">At Risk</span></div>
                    <div className="flex items-center gap-2"><span className="text-lg font-semibold">{healthCounts.amber}</span><span className="text-xs text-muted-foreground">({Math.round((healthCounts.amber / projects.length) * 100)}%)</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive" /><span className="text-sm">Critical</span></div>
                    <div className="flex items-center gap-2"><span className="text-lg font-semibold">{healthCounts.red}</span><span className="text-xs text-muted-foreground">({Math.round((healthCounts.red / projects.length) * 100)}%)</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Budget Utilization</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <ProgressRing value={Math.round((totalSpent / totalBudget) * 100)} size={100} strokeWidth={8} />
                </div>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Spent</span><span className="font-medium">{formatCurrency(totalSpent)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Remaining</span><span className="font-medium">{formatCurrency(totalBudget - totalSpent)}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Milestone Status</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /><div className="flex-1"><p className="text-sm font-medium">Completed</p><p className="text-xs text-muted-foreground">12 milestones</p></div></div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10"><Clock className="h-5 w-5 text-primary" /><div className="flex-1"><p className="text-sm font-medium">Upcoming</p><p className="text-xs text-muted-foreground">8 milestones</p></div></div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /><div className="flex-1"><p className="text-sm font-medium">At Risk</p><p className="text-xs text-muted-foreground">3 milestones</p></div></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Programs Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between"><CardTitle>Programs in Portfolio</CardTitle><Button variant="ghost" size="sm">View All <ChevronRight className="h-4 w-4 ml-1" /></Button></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {programs.map((program) => (
                  <motion.div key={program.id} className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors cursor-pointer" whileHover={{ x: 4 }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <StatusIndicator status={program.health} pulse />
                        <div>
                          <div className="flex items-center gap-2"><h4 className="font-medium">{program.name}</h4><Badge variant="outline">{program.code}</Badge></div>
                          <p className="text-sm text-muted-foreground mt-0.5">{program.manager} · {program.projectCount} Projects</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right"><p className="text-sm font-medium">{formatCurrency(program.budget)}</p><p className="text-xs text-muted-foreground">{formatCurrency(program.spent)} spent</p></div>
                        <div className="w-32">
                          <div className="flex items-center justify-between mb-1"><span className="text-xs text-muted-foreground">Progress</span><span className="text-xs font-medium">{program.progress}%</span></div>
                          <Progress value={program.progress} className="h-2" />
                        </div>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {viewMode === 'programs' && (
        <div className="grid grid-cols-2 gap-4">
          {programs.map((program) => {
            const programProjects = projects.filter(p => p.programCode === program.code);
            return (
              <Card key={program.id} variant="interactive">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIndicator status={program.health} pulse size="lg" />
                      <div><CardTitle className="text-lg">{program.name}</CardTitle><p className="text-sm text-muted-foreground">{program.code}</p></div>
                    </div>
                    <Badge variant="active">active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Budget</p><p className="text-lg font-semibold">{formatCurrency(program.budget)}</p><p className="text-xs text-muted-foreground">{formatCurrency(program.spent)} spent</p></div>
                    <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Progress</p><p className="text-lg font-semibold">{program.progress}%</p><Progress value={program.progress} className="h-1.5 mt-1" /></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Projects</p>
                    {programProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                        <div className="flex items-center gap-2"><StatusIndicator status={project.health} size="sm" /><span className="text-sm">{project.name}</span></div>
                        <span className="text-xs text-muted-foreground">{project.progress}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /><span>{program.manager}</span></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {viewMode === 'projects' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left text-xs text-muted-foreground uppercase">
                  <th className="p-4 font-medium">Project</th>
                  <th className="p-4 font-medium">Program</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Health</th>
                  <th className="p-4 font-medium">Progress</th>
                  <th className="p-4 font-medium">Budget</th>
                  <th className="p-4 font-medium">Manager</th>
                  <th className="p-4 font-medium">End Date</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4"><div><p className="font-medium">{project.name}</p><p className="text-xs text-muted-foreground">{project.code}</p></div></td>
                    <td className="p-4"><Badge variant="outline">{project.programCode}</Badge></td>
                    <td className="p-4"><Badge variant={project.status === 'active' ? 'active' : 'pending'}>{project.status}</Badge></td>
                    <td className="p-4"><StatusIndicator status={project.health} /></td>
                    <td className="p-4"><div className="flex items-center gap-2"><Progress value={project.progress} className="h-2 w-20" /><span className="text-sm">{project.progress}%</span></div></td>
                    <td className="p-4"><div><p className="text-sm font-medium">{formatCurrency(project.budget)}</p><p className="text-xs text-muted-foreground">{formatCurrency(project.spent)} spent</p></div></td>
                    <td className="p-4 text-sm">{project.manager}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(project.endDate).toLocaleDateString()}</td>
                    <td className="p-4"><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
