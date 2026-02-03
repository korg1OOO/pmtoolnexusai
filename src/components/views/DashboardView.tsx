import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Target,
  BarChart3,
  Zap,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/enterprise/KPICard';
import { ProgressRing } from '@/components/enterprise/ProgressRing';
import { StatusIndicator } from '@/components/enterprise/StatusIndicator';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useProject } from '@/hooks/useProject';
import { useTasks } from '@/hooks/useTasks';
import { useRisks } from '@/hooks/useRisks';
import { useMeetings } from '@/hooks/useMeetings';
import { useActions } from '@/hooks/useActions';
import { useBacklogItems } from '@/hooks/useBacklogItems';
import { useFinancials } from '@/hooks/useFinancials';
import { kpiData as mockKPIData } from '@/data/mockData';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function DashboardView() {
  const { settings } = useProjectContext();
  const projectId = settings.id;

  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(projectId);
  const { risks = [], loading: loadingRisks } = useRisks();
  const { meetings = [], isLoading: loadingMeetings } = useMeetings(projectId);
  const { actions = [], loading: loadingActions } = useActions();
  const { items: backlogItems = [], loading: loadingBacklog } = useBacklogItems();
  const { budget } = useFinancials(projectId);

  const isLoading = loadingProject || loadingTasks || loadingRisks || loadingMeetings || loadingActions || loadingBacklog;

  const kpis = useMemo(() => {
    if (!project) return mockKPIData;

    const activeRisksCount = risks.filter(r => r.status !== 'closed').length;
    const criticalRisks = risks.filter(r => r.status !== 'closed' && r.impact === 'critical').length;
    const openActions = actions.filter(a => a.status === 'pending' || a.status === 'in-progress').length;
    const overdueActions = actions.filter(a => (a.status === 'pending' || a.status === 'in-progress') && a.due_date && new Date(a.due_date) < new Date()).length;

    // Simple cost variance calculation
    const budgetTotal = project.budget || 0;
    const spentTotal = project.spent || 0;
    const costVariance = budgetTotal > 0 ? ((budgetTotal - spentTotal) / budgetTotal) * 100 : 0;

    return {
      ...mockKPIData,
      costVariance: parseFloat(costVariance.toFixed(1)),
      openRisks: activeRisksCount,
      criticalRisks,
      openActions,
      overdueActions,
      teamUtilization: 85, // Fallback for now
    };
  }, [project, risks, actions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeProject = project || {
    name: settings.name,
    health: 'green',
    description: 'No description available.',
    methodology: settings.methodology,
    progress: 0,
    start_date: new Date().toISOString(),
    end_date: new Date().toISOString(),
    spent: 0,
    budget: 0,
  };

  const inProgressItems = backlogItems.filter((t) => t.status === 'in-progress');
  const upcomingMeetings = meetings.filter((m) => m.status === 'scheduled');
  const activeRisks = risks.filter((r) => r.status !== 'closed');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-6"
    >
      {/* Project Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{activeProject.name}</h1>
            <StatusIndicator status={activeProject.health as any} pulse />
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {activeProject.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Full Report
          </Button>
          <Button size="sm">
            <Zap className="h-4 w-4 mr-2" />
            AI Insights
          </Button>
        </div>
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard
          title="Schedule Variance"
          value={`${kpis.scheduleVariance > 0 ? '+' : ''}${kpis.scheduleVariance}%`}
          status={kpis.scheduleVariance >= 0 ? 'success' : 'warning'}
          icon={Calendar}
          subtitle="vs. baseline"
        />
        <KPICard
          title="Cost Variance"
          value={`${kpis.costVariance > 0 ? '+' : ''}${kpis.costVariance}%`}
          status={kpis.costVariance >= 0 ? 'success' : 'warning'}
          icon={DollarSign}
          subtitle="under budget"
        />
        <KPICard
          title="Sprint Velocity"
          value={kpis.sprintVelocity}
          status="info"
          icon={TrendingUp}
          trend={{ value: 6, label: 'vs avg' }}
          subtitle={`Avg: ${kpis.avgVelocity} pts`}
        />
        <KPICard
          title="Open Risks"
          value={kpis.openRisks}
          status={kpis.criticalRisks > 0 ? 'error' : 'warning'}
          icon={AlertTriangle}
          subtitle={`${kpis.criticalRisks} critical`}
        />
        <KPICard
          title="Team Utilization"
          value={`${kpis.teamUtilization}%`}
          status="info"
          icon={Users}
          subtitle="Current sprint"
        />
        <KPICard
          title="Actions Due"
          value={kpis.openActions}
          status={kpis.overdueActions > 0 ? 'warning' : 'success'}
          icon={CheckCircle2}
          subtitle={`${kpis.overdueActions} overdue`}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Project Progress</CardTitle>
              <Badge variant={activeProject.methodology === 'hybrid' ? 'info' : 'secondary'}>
                {activeProject.methodology}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <ProgressRing value={activeProject.progress || 0} size={120} strokeWidth={10} color="primary" />
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">{activeProject.start_date ? new Date(activeProject.start_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Target End</span>
                  <span className="font-medium">{activeProject.end_date ? new Date(activeProject.end_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Projected</span>
                  <span className="font-medium text-success">{kpis.projectedCompletion}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget Overview */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-mono font-medium">
                      ${((activeProject.spent || 0) / 1000000).toFixed(2)}M / ${((activeProject.budget || 0) / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${activeProject.budget > 0 ? ((activeProject.spent || 0) / activeProject.budget) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Burn Rate</p>
                    <p className="text-lg font-semibold font-mono">${(kpis.burnRate / 1000).toFixed(0)}K<span className="text-xs text-muted-foreground">/mo</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-lg font-semibold font-mono text-success">${(((activeProject.budget || 0) - (activeProject.spent || 0)) / 1000000).toFixed(2)}M</p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Forecast Status</span>
                    <Badge variant="success">On Track</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Risks */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Active Risks</CardTitle>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-primary">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeRisks.slice(0, 4).map((risk) => (
                  <div
                    key={risk.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${risk.impact === 'critical' ? 'bg-destructive' :
                      risk.impact === 'high' ? 'bg-orange-500' :
                        risk.impact === 'medium' ? 'bg-warning' : 'bg-success'
                      }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{risk.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={risk.impact as any} className="text-[10px] px-1.5 py-0">
                          {risk.impact}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{risk.owner}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {activeRisks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No active risks</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* In Progress Work */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">In Progress</CardTitle>
              <Badge variant="in-progress">{inProgressItems.length} items</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inProgressItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Badge variant={item.type as any} className="shrink-0">
                      {item.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.key || item.wbs || 'No key'}</p>
                    </div>
                    {item.assignee && (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                          {item.assignee.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                      </div>
                    )}
                    {item.storyPoints && (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {item.storyPoints} pts
                      </span>
                    )}
                  </div>
                ))}
                {inProgressItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No work in progress</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Meetings */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Upcoming Meetings</CardTitle>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-primary">
                Schedule <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-2 min-w-[50px]">
                      <span className="text-xs text-primary font-medium">
                        {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {new Date(meeting.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{meeting.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {meeting.startTime} - {meeting.endTime}
                        </span>
                        <Badge variant={meeting.type === 'online' ? 'info' : meeting.type === 'hybrid' ? 'warning' : 'secondary'} className="text-[10px]">
                          {meeting.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingMeetings.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No upcoming meetings</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
