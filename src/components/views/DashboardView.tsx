import React from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/enterprise/KPICard';
import { ProgressRing } from '@/components/enterprise/ProgressRing';
import { StatusIndicator } from '@/components/enterprise/StatusIndicator';
import { mockProject, mockTasks, mockRisks, mockMeetings, kpiData, mockSprintItems } from '@/data/mockData';

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
  const inProgressTasks = mockSprintItems.filter((t) => t.status === 'in-progress');
  const upcomingMeetings = mockMeetings.filter((m) => m.status === 'scheduled');
  const activeRisks = mockRisks.filter((r) => r.status !== 'closed');

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
            <h1 className="text-2xl font-bold">{mockProject.name}</h1>
            <StatusIndicator status={mockProject.health} pulse />
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {mockProject.description}
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
          value={`${kpiData.scheduleVariance > 0 ? '+' : ''}${kpiData.scheduleVariance}%`}
          status={kpiData.scheduleVariance >= 0 ? 'success' : 'warning'}
          icon={Calendar}
          subtitle="vs. baseline"
        />
        <KPICard
          title="Cost Variance"
          value={`${kpiData.costVariance > 0 ? '+' : ''}${kpiData.costVariance}%`}
          status={kpiData.costVariance >= 0 ? 'success' : 'warning'}
          icon={DollarSign}
          subtitle="under budget"
        />
        <KPICard
          title="Sprint Velocity"
          value={kpiData.sprintVelocity}
          status="info"
          icon={TrendingUp}
          trend={{ value: 6, label: 'vs avg' }}
          subtitle={`Avg: ${kpiData.avgVelocity} pts`}
        />
        <KPICard
          title="Open Risks"
          value={kpiData.openRisks}
          status={kpiData.criticalRisks > 0 ? 'error' : 'warning'}
          icon={AlertTriangle}
          subtitle={`${kpiData.criticalRisks} critical`}
        />
        <KPICard
          title="Team Utilization"
          value={`${kpiData.teamUtilization}%`}
          status="info"
          icon={Users}
          subtitle="Current sprint"
        />
        <KPICard
          title="Actions Due"
          value={kpiData.openActions}
          status={kpiData.overdueActions > 0 ? 'warning' : 'success'}
          icon={CheckCircle2}
          subtitle={`${kpiData.overdueActions} overdue`}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Project Progress</CardTitle>
              <Badge variant={mockProject.methodology === 'hybrid' ? 'info' : 'secondary'}>
                {mockProject.methodology}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <ProgressRing value={mockProject.progress} size={120} strokeWidth={10} color="primary" />
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">{new Date(mockProject.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Target End</span>
                  <span className="font-medium">{new Date(mockProject.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Projected</span>
                  <span className="font-medium text-success">{kpiData.projectedCompletion}</span>
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
                      ${(mockProject.spent / 1000000).toFixed(2)}M / ${(mockProject.budget / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(mockProject.spent / mockProject.budget) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Burn Rate</p>
                    <p className="text-lg font-semibold font-mono">${(kpiData.burnRate / 1000).toFixed(0)}K<span className="text-xs text-muted-foreground">/mo</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-lg font-semibold font-mono text-success">${((mockProject.budget - mockProject.spent) / 1000000).toFixed(2)}M</p>
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
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      risk.impact === 'critical' ? 'bg-destructive' :
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
              <Badge variant="in-progress">{inProgressTasks.length} items</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inProgressTasks.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Badge variant={item.type as any} className="shrink-0">
                      {item.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.key}</p>
                    </div>
                    {item.assignee && (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                          {item.assignee.split(' ').map(n => n[0]).join('')}
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
                      <div className="flex items-center gap-1 mt-2">
                        {meeting.participants.slice(0, 4).map((p, i) => (
                          <div
                            key={p.id}
                            className="h-5 w-5 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium -ml-1 first:ml-0"
                          >
                            {p.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        ))}
                        {meeting.participants.length > 4 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            +{meeting.participants.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
