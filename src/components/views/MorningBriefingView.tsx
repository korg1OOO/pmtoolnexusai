import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Sun,
  Coffee,
  AlertTriangle,
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Zap,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockProject, mockRisks, mockMeetings } from '@/data/mockData';

export function MorningBriefingView() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdated] = useState(new Date());

  const briefingData = {
    greeting: `Good morning! Here's your daily briefing for ${mockProject.name}`,
    projectHealth: mockProject.health,
    criticalAlerts: [
      { type: 'risk', message: 'Data Migration Complexity risk escalated to HIGH', priority: 'critical' },
      { type: 'deadline', message: 'Implementation Phase milestone in 14 days', priority: 'warning' },
      { type: 'action', message: '3 overdue action items require attention', priority: 'high' },
    ],
    todayFocus: [
      { task: 'Review API Gateway configuration', owner: 'Mike Johnson', priority: 'high' },
      { task: 'Complete data validation scripts', owner: 'Emily Brown', priority: 'medium' },
      { task: 'Stakeholder update meeting at 10:00 AM', owner: 'Sarah Mitchell', priority: 'high' },
    ],
    progressSummary: {
      yesterday: { completed: 5, added: 2 },
      thisWeek: { completed: 18, target: 25 },
      velocity: 'on-track',
    },
    upcomingMeetings: mockMeetings.slice(0, 3),
    teamAvailability: [
      { name: 'John Doe', status: 'available', load: 85 },
      { name: 'Jane Smith', status: 'busy', load: 100 },
      { name: 'Mike Johnson', status: 'available', load: 70 },
      { name: 'Emily Brown', status: 'away', load: 50 },
    ],
    aiInsights: [
      'Based on current velocity, Sprint 12 is likely to complete 2 days ahead of schedule.',
      'Consider reallocating resources from Phase 3 to Phase 4 to mitigate testing risks.',
      'Integration testing bottleneck predicted in Week 3 - recommend starting early.',
    ],
    keyMetrics: {
      budgetUsed: 45,
      scheduleVariance: -2,
      riskScore: 72,
      teamMorale: 85,
    },
  };

  const handleRefresh = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Sun className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Morning Briefing
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </h1>
              <p className="text-muted-foreground">{briefingData.greeting}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isGenerating}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
            Refresh Briefing
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Critical Alerts */}
          {briefingData.criticalAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <Bell className="h-5 w-5" />
                    Critical Alerts Requiring Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {briefingData.criticalAlerts.map((alert, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-background border"
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={cn(
                            "h-4 w-4",
                            alert.priority === 'critical' ? 'text-destructive' :
                            alert.priority === 'warning' ? 'text-warning' : 'text-orange-500'
                          )} />
                          <span className="text-sm">{alert.message}</span>
                        </div>
                        <Badge variant={alert.priority as any}>{alert.priority}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Focus */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Today's Focus Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {briefingData.todayFocus.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              item.priority === 'high' ? 'bg-destructive' : 'bg-warning'
                            )} />
                            <div>
                              <p className="text-sm font-medium">{item.task}</p>
                              <p className="text-xs text-muted-foreground">{item.owner}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI-Powered Insights
                    </CardTitle>
                    <CardDescription>Predictions and recommendations based on project data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {briefingData.aiInsights.map((insight, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg bg-background border"
                        >
                          <Zap className="h-4 w-4 text-primary mt-0.5" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Progress Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      Progress Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <div className="text-2xl font-bold text-success">
                          {briefingData.progressSummary.yesterday.completed}
                        </div>
                        <p className="text-xs text-muted-foreground">Tasks Completed Yesterday</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <div className="text-2xl font-bold">
                          {briefingData.progressSummary.thisWeek.completed}/{briefingData.progressSummary.thisWeek.target}
                        </div>
                        <p className="text-xs text-muted-foreground">Weekly Progress</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <Badge variant="success" className="text-sm">
                          {briefingData.progressSummary.velocity}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Velocity Status</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Budget Utilization</span>
                        <span className="font-medium">{briefingData.keyMetrics.budgetUsed}%</span>
                      </div>
                      <Progress value={briefingData.keyMetrics.budgetUsed} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Schedule Variance</span>
                        <span className={cn(
                          "font-medium",
                          briefingData.keyMetrics.scheduleVariance < 0 ? 'text-success' : 'text-destructive'
                        )}>
                          {briefingData.keyMetrics.scheduleVariance > 0 ? '+' : ''}{briefingData.keyMetrics.scheduleVariance} days
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Risk Score</span>
                        <span className="font-medium">{briefingData.keyMetrics.riskScore}/100</span>
                      </div>
                      <Progress 
                        value={briefingData.keyMetrics.riskScore} 
                        className={cn("h-2", briefingData.keyMetrics.riskScore > 70 ? '[&>div]:bg-warning' : '')}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Team Morale</span>
                        <span className="font-medium text-success">{briefingData.keyMetrics.teamMorale}%</span>
                      </div>
                      <Progress value={briefingData.keyMetrics.teamMorale} className="h-2 [&>div]:bg-success" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Today's Meetings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Today's Meetings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {briefingData.upcomingMeetings.map((meeting, i) => (
                        <div
                          key={meeting.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                        >
                          <div className="text-center min-w-[50px]">
                            <span className="text-sm font-medium">{meeting.startTime}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{meeting.title}</p>
                            <p className="text-xs text-muted-foreground">{meeting.participants.length} participants</p>
                          </div>
                          <Badge variant="outline">{meeting.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Team Availability */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Team Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {briefingData.teamAvailability.map((member, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              member.status === 'available' ? 'success' :
                              member.status === 'busy' ? 'warning' : 'secondary'
                            } className="text-xs">
                              {member.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{member.load}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
