import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolios } from '@/hooks/usePortfolios';
import { usePrograms } from '@/hooks/usePrograms';
import {
  Loader2,
  Briefcase,
  Plus,
  Filter,
  Download,
  RefreshCw,
  X,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Layers,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Milestone,
  Flag,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { KPICard } from '@/components/enterprise/KPICard';
import { StatusIndicator } from '@/components/enterprise/StatusIndicator';
import { ProgressRing } from '@/components/enterprise/ProgressRing';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export function PortfolioView() {
  const { data: portfoliosData, isLoading: isLoadingPortfolios } = usePortfolios();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'programs' | 'projects'>('overview');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Set initial selected portfolio if not set
  if (!selectedPortfolioId && portfoliosData && portfoliosData.length > 0) {
    setSelectedPortfolioId(portfoliosData[0].id);
  }

  const selectedPortfolio = portfoliosData?.find(p => p.id === selectedPortfolioId);
  const portfolios = portfoliosData || [];

  // Aggregate data from nested structures
  const projects = selectedPortfolio?.programs?.flatMap(p => p.projects || []) || [];
  const programs = selectedPortfolio?.programs || [];

  const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0);
  const totalSpent = projects.reduce((sum: number, p: any) => sum + (p.spent || 0), 0);
  const avgProgress = projects.length > 0
    ? projects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / projects.length
    : 0;

  const healthCounts = {
    green: projects.filter((p: any) => p.health === 'green').length,
    amber: projects.filter((p: any) => p.health === 'amber').length,
    red: projects.filter((p: any) => p.health === 'red').length,
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'completed';
      case 'upcoming': return 'active';
      case 'overdue': return 'critical';
      default: return 'outline';
    }
  };

  const getRiskSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'critical';
      case 'medium': return 'warning';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoadingPortfolios) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading portfolio data...</span>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="text-center py-20">
        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
        <h3 className="text-lg font-medium text-foreground">No Portfolios Found</h3>
        <p className="text-muted-foreground">Create a portfolio to start managing programs and projects.</p>
        <Button className="mt-4" onClick={async () => {
          try {
            console.log('[Portfolio] Creating portfolio...');
            const { supabase } = await import('@/integrations/supabase/client');
            const { toast } = await import('sonner');

            const { data, error } = await supabase.from('portfolios').insert({
              name: 'Default Portfolio',
              description: 'Your first portfolio'
            }).select().single();

            if (error) {
              console.error('[Portfolio] Creation error:', error);
              toast.error('Failed to create portfolio', { description: error.message });
              return;
            }

            console.log('[Portfolio] Created successfully:', data);
            toast.success('Portfolio created successfully!');
            setTimeout(() => window.location.reload(), 1000);
          } catch (err: any) {
            console.error('[Portfolio] Unexpected error:', err);
            const { toast } = await import('sonner');
            toast.error('Unexpected error', { description: err.message });
          }
        }}><Plus className="h-4 w-4 mr-2" />Create Portfolio</Button>
      </div>
    );
  }

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
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button size="sm" onClick={async () => {
            try {
              const portfolioName = prompt('Enter portfolio name:');
              if (!portfolioName || portfolioName.trim() === '') {
                return; // User cancelled or entered empty name
              }

              console.log('[Portfolio] Creating portfolio...');
              const { supabase } = await import('@/integrations/supabase/client');
              const { toast } = await import('sonner');

              const { data, error } = await supabase.from('portfolios').insert({
                name: portfolioName.trim(),
                description: `Portfolio created on ${new Date().toLocaleDateString()}`
              }).select().single();

              if (error) {
                console.error('[Portfolio] Creation error:', error);
                toast.error('Failed to create portfolio', { description: error.message });
                return;
              }

              console.log('[Portfolio] Created successfully:', data);
              toast.success('Portfolio created successfully!');
              setTimeout(() => window.location.reload(), 1000);
            } catch (err: any) {
              console.error('[Portfolio] Unexpected error:', err);
              const { toast } = await import('sonner');
              toast.error('Unexpected error', { description: err.message });
            }
          }}><Plus className="h-4 w-4 mr-2" />Create Portfolio</Button>
        </div>
      </div>

      {/* Portfolio Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {portfolios.map((portfolio) => (
          <motion.button
            key={portfolio.id}
            onClick={() => setSelectedPortfolioId(portfolio.id)}
            className={`min-w-[300px] flex-1 p-4 rounded-lg border transition-all text-left ${selectedPortfolioId === portfolio.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
              }`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedPortfolioId === portfolio.id ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{portfolio.name}</h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{portfolio.description || 'No description'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency((portfolio.programs as any[])?.reduce((sum, prog) => sum + (prog.projects?.reduce((pSum: number, p: any) => pSum + (p.budget || 0), 0) || 0), 0) || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{(portfolio.programs as any[])?.length || 0} Programs</p>
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
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${viewMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
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
            <KPICard title="Active Projects" value={projects.filter((p: any) => p.status === 'active').length.toString()} subtitle={`${projects.filter((p: any) => p.status === 'on-hold').length} on hold`} icon={Layers} status="neutral" />
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
                    <div className="flex items-center gap-2"><span className="text-lg font-semibold">{healthCounts.green}</span><span className="text-xs text-muted-foreground">({projects.length > 0 ? Math.round((healthCounts.green / projects.length) * 100) : 0}%)</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-warning" /><span className="text-sm">At Risk</span></div>
                    <div className="flex items-center gap-2"><span className="text-lg font-semibold">{healthCounts.amber}</span><span className="text-xs text-muted-foreground">({projects.length > 0 ? Math.round((healthCounts.amber / projects.length) * 100) : 0}%)</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive" /><span className="text-sm">Critical</span></div>
                    <div className="flex items-center gap-2"><span className="text-lg font-semibold">{healthCounts.red}</span><span className="text-xs text-muted-foreground">({projects.length > 0 ? Math.round((healthCounts.red / projects.length) * 100) : 0}%)</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Budget Utilization</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <ProgressRing value={totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0} size={100} strokeWidth={8} />
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
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /><div className="flex-1"><p className="text-sm font-medium">Completed</p><p className="text-xs text-muted-foreground">Aggregated milestones</p></div></div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10"><Clock className="h-5 w-5 text-primary" /><div className="flex-1"><p className="text-sm font-medium">Upcoming</p><p className="text-xs text-muted-foreground">Scheduled tasks</p></div></div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /><div className="flex-1"><p className="text-sm font-medium">At Risk</p><p className="text-xs text-muted-foreground">Overdue items</p></div></div>
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
                {programs.map((program: any) => {
                  const pBudget = program.projects?.reduce((sum: number, p: any) => sum + (p.budget || 0), 0) || 0;
                  const pSpent = program.projects?.reduce((sum: number, p: any) => sum + (p.spent || 0), 0) || 0;
                  const pProgress = program.projects?.length > 0
                    ? Math.round(program.projects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / program.projects.length)
                    : 0;
                  const redHealth = program.projects?.some((p: any) => p.health === 'red');
                  const amberHealth = program.projects?.some((p: any) => p.health === 'amber');
                  const health = redHealth ? 'red' : amberHealth ? 'amber' : 'green';

                  return (
                    <motion.div key={program.id} className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors cursor-pointer" whileHover={{ x: 4 }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <StatusIndicator status={health} pulse />
                          <div>
                            <div className="flex items-center gap-2"><h4 className="font-medium">{program.name}</h4><Badge variant="outline">{program.id.split('-')[1] || 'PROG'}</Badge></div>
                            <p className="text-sm text-muted-foreground mt-0.5">{program.projects?.length || 0} Projects</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right"><p className="text-sm font-medium">{formatCurrency(pBudget)}</p><p className="text-xs text-muted-foreground">{formatCurrency(pSpent)} spent</p></div>
                          <div className="w-32">
                            <div className="flex items-center justify-between mb-1"><span className="text-xs text-muted-foreground">Progress</span><span className="text-xs font-medium">{pProgress}%</span></div>
                            <Progress value={pProgress} className="h-2" />
                          </div>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {programs.length === 0 && <p className="text-center py-10 text-muted-foreground italic">No programs linked to this portfolio.</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {viewMode === 'programs' && (
        <div className="grid grid-cols-2 gap-4">
          {programs.map((program: any) => {
            const pBudget = program.projects?.reduce((sum: number, p: any) => sum + (p.budget || 0), 0) || 0;
            const pSpent = program.projects?.reduce((sum: number, p: any) => sum + (p.spent || 0), 0) || 0;
            const pProgress = program.projects?.length > 0
              ? Math.round(program.projects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / program.projects.length)
              : 0;
            return (
              <Card key={program.id} variant="interactive">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIndicator status={program.health || 'green'} pulse size="lg" />
                      <div><CardTitle className="text-lg">{program.name}</CardTitle><p className="text-sm text-muted-foreground">PROGRAM</p></div>
                    </div>
                    <Badge variant="active">active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Budget</p><p className="text-lg font-semibold">{formatCurrency(pBudget)}</p><p className="text-xs text-muted-foreground">{formatCurrency(pSpent)} spent</p></div>
                    <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Progress</p><p className="text-lg font-semibold">{pProgress}%</p><Progress value={pProgress} className="h-1.5 mt-1" /></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Projects</p>
                    {program.projects?.map((project: any) => (
                      <div key={project.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                        <div className="flex items-center gap-2"><StatusIndicator status={project.health} size="sm" /><span className="text-sm">{project.name}</span></div>
                        <span className="text-xs text-muted-foreground">{project.progress}%</span>
                      </div>
                    ))}
                    {!program.projects?.length && <p className="text-xs text-muted-foreground italic">No projects linked.</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {programs.length === 0 && <div className="col-span-2 text-center py-20 text-muted-foreground">No programs found for this portfolio.</div>}
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
                  <th className="p-4 font-medium">End Date</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project: any) => (
                  <tr
                    key={project.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >
                    <td className="p-4"><div><p className="font-medium">{project.name}</p><p className="text-xs text-muted-foreground">{project.code}</p></div></td>
                    <td className="p-4"><Badge variant="outline">{(programs as any[]).find(p => p.projects?.some((proj: any) => proj.id === project.id))?.name || 'N/A'}</Badge></td>
                    <td className="p-4"><Badge variant={project.status === 'active' ? 'active' : 'pending'}>{project.status}</Badge></td>
                    <td className="p-4"><StatusIndicator status={project.health} /></td>
                    <td className="p-4"><div className="flex items-center gap-2"><Progress value={project.progress} className="h-2 w-20" /><span className="text-sm">{project.progress}%</span></div></td>
                    <td className="p-4"><div><p className="text-sm font-medium">{formatCurrency(project.budget)}</p><p className="text-xs text-muted-foreground">{formatCurrency(project.spent)} spent</p></div></td>
                    <td className="p-4 text-sm text-muted-foreground">{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-4"><Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
                {projects.length === 0 && <tr><td colSpan={8} className="p-20 text-center text-muted-foreground italic">No projects found for this portfolio.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Project Detail Slide-out Panel */}
      <AnimatePresence>
        {selectedProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setSelectedProject(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[600px] bg-background border-l border-border z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <StatusIndicator status={selectedProject.health} pulse size="lg" />
                      <Badge variant={selectedProject.status === 'active' ? 'active' : 'pending'}>{selectedProject.status}</Badge>
                    </div>
                    <h2 className="text-2xl font-semibold">{selectedProject.name}</h2>
                    <p className="text-muted-foreground">{selectedProject.code} · {selectedProject.programCode}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedProject(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm">{selectedProject.description}</p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-4 w-4 text-primary" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="text-lg font-semibold">{selectedProject.progress}%</p>
                      </div>
                    </div>
                    <Progress value={selectedProject.progress} className="h-2 mt-3" />
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-success/10"><DollarSign className="h-4 w-4 text-success" /></div>
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="text-lg font-semibold">{formatCurrency(selectedProject.budget)}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(selectedProject.spent)} spent</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Burndown Chart */}
                {selectedProject.burndownData && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Burndown Chart</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={150}>
                        <AreaChart data={selectedProject.burndownData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="planned" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" name="Planned" />
                          <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Actual" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Team */}
                {selectedProject.team && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Team ({selectedProject.team.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.team.map((member, i) => (
                        <Badge key={i} variant="outline" className="py-1.5"><Users className="h-3 w-3 mr-1" />{member}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestones */}
                {selectedProject.milestones && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Milestones</h3>
                    <div className="space-y-2">
                      {selectedProject.milestones.map((milestone, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{milestone.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{milestone.date}</span>
                            <Badge variant={getMilestoneStatusColor(milestone.status) as any}>{milestone.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks */}
                {selectedProject.risks && selectedProject.risks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Active Risks</h3>
                    <div className="space-y-2">
                      {selectedProject.risks.map((risk, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            <span className="text-sm">{risk.name}</span>
                          </div>
                          <Badge variant={getRiskSeverityColor(risk.severity) as any}>{risk.severity}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project Manager */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedProject.manager}</p>
                      <p className="text-xs text-muted-foreground">Project Manager</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="text-sm font-medium">{new Date(selectedProject.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
