import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FileCheck,
  CheckCircle2,
  Target,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Award,
  Download,
  Share2,
  Printer,
  Edit2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockProject } from '@/data/mockData';

export function FinalReportView() {
  const reportData = {
    projectName: mockProject.name,
    projectCode: mockProject.code,
    completionDate: '2024-12-15',
    sponsor: 'James Morrison',
    projectManager: 'Sarah Mitchell',
    
    executiveSummary: `The ${mockProject.name} was successfully completed on schedule and within budget. 
    All primary objectives were achieved, including the migration of 100% of Tier-1 applications to the cloud, 
    achieving 99.99% uptime SLA, and implementing zero-trust security architecture. 
    The project delivered significant value to the organization through improved scalability, 
    reduced operational costs, and enhanced security posture.`,
    
    objectives: [
      { objective: 'Migrate 100% of Tier-1 applications to cloud', target: '100%', achieved: '100%', status: 'met' },
      { objective: 'Achieve 99.99% uptime SLA', target: '99.99%', achieved: '99.97%', status: 'met' },
      { objective: 'Reduce infrastructure costs by 40%', target: '40%', achieved: '38%', status: 'partial' },
      { objective: 'Implement zero-trust security architecture', target: 'Complete', achieved: 'Complete', status: 'met' },
      { objective: 'Complete within approved budget', target: '$2.5M', achieved: '$2.45M', status: 'met' },
    ],
    
    financialSummary: {
      approvedBudget: 2500000,
      actualSpend: 2450000,
      variance: 50000,
      variancePercent: 2.0,
    },
    
    scheduleSummary: {
      plannedDuration: 365,
      actualDuration: 365,
      variance: 0,
      plannedEnd: '2024-12-15',
      actualEnd: '2024-12-15',
    },
    
    deliverables: [
      { name: 'Cloud Architecture Design', status: 'delivered', quality: 'excellent' },
      { name: 'Data Migration Framework', status: 'delivered', quality: 'good' },
      { name: 'Security Framework', status: 'delivered', quality: 'excellent' },
      { name: 'API Gateway', status: 'delivered', quality: 'good' },
      { name: 'User Training Materials', status: 'delivered', quality: 'excellent' },
      { name: 'Operations Runbook', status: 'delivered', quality: 'good' },
    ],
    
    teamMembers: [
      { name: 'John Doe', role: 'Technical Lead', contribution: 'excellent' },
      { name: 'Jane Smith', role: 'Senior Developer', contribution: 'excellent' },
      { name: 'Mike Johnson', role: 'Cloud Architect', contribution: 'excellent' },
      { name: 'Emily Brown', role: 'Data Engineer', contribution: 'good' },
      { name: 'David Wilson', role: 'DevOps Engineer', contribution: 'excellent' },
    ],
    
    stakeholderSatisfaction: 4.5,
    
    recommendations: [
      'Continue monitoring cloud costs for the first 6 months post-go-live',
      'Plan for Phase 2 migration of Tier-2 applications',
      'Establish a cloud center of excellence team',
      'Implement automated cost optimization tools',
    ],
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-success/10 via-success/5 to-transparent">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/20">
              <FileCheck className="h-8 w-8 text-success" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Project Final Report</h1>
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </Badge>
              </div>
              <p className="text-muted-foreground">{reportData.projectName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Completed: {new Date(reportData.completionDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="summary" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{reportData.executiveSummary}</p>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4">
                    <DollarSign className="h-5 w-5 text-success mb-2" />
                    <div className="text-2xl font-bold text-success">Under Budget</div>
                    <p className="text-sm text-muted-foreground">
                      ${(reportData.financialSummary.variance / 1000).toFixed(0)}K saved
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4">
                    <Calendar className="h-5 w-5 text-success mb-2" />
                    <div className="text-2xl font-bold text-success">On Time</div>
                    <p className="text-sm text-muted-foreground">
                      Delivered as planned
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4">
                    <Target className="h-5 w-5 text-success mb-2" />
                    <div className="text-2xl font-bold text-success">
                      {reportData.objectives.filter(o => o.status === 'met').length}/{reportData.objectives.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Objectives Met</p>
                  </CardContent>
                </Card>
                <Card className="border-warning/30 bg-warning/5">
                  <CardContent className="p-4">
                    <Star className="h-5 w-5 text-warning mb-2" />
                    <div className="text-2xl font-bold text-warning">{reportData.stakeholderSatisfaction}/5</div>
                    <p className="text-sm text-muted-foreground">Satisfaction Score</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportData.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                        <span className="text-primary font-medium">{i + 1}.</span>
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="objectives" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Objectives Achievement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.objectives.map((obj, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-muted/20">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium">{obj.objective}</span>
                          <Badge variant={obj.status === 'met' ? 'success' : 'warning'}>
                            {obj.status === 'met' ? 'Achieved' : 'Partially Met'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Target:</span>{' '}
                            <span className="font-medium">{obj.target}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Achieved:</span>{' '}
                            <span className={cn(
                              "font-medium",
                              obj.status === 'met' ? 'text-success' : 'text-warning'
                            )}>{obj.achieved}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financials" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Budget Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Approved Budget</span>
                      <span className="font-semibold">${(reportData.financialSummary.approvedBudget / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Actual Spend</span>
                      <span className="font-semibold">${(reportData.financialSummary.actualSpend / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Variance</span>
                        <span className="font-bold text-success">
                          +${(reportData.financialSummary.variance / 1000).toFixed(0)}K ({reportData.financialSummary.variancePercent}%)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Schedule Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Planned Duration</span>
                      <span className="font-semibold">{reportData.scheduleSummary.plannedDuration} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Actual Duration</span>
                      <span className="font-semibold">{reportData.scheduleSummary.actualDuration} days</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Variance</span>
                        <span className="font-bold text-success">On Time</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="deliverables" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Deliverables Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.deliverables.map((del, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                          <span className="font-medium">{del.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="success">Delivered</Badge>
                          <Badge variant={del.quality === 'excellent' ? 'info' : 'secondary'}>
                            {del.quality}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Team Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.teamMembers.map((member, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <Badge variant={member.contribution === 'excellent' ? 'success' : 'info'}>
                          {member.contribution} contribution
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
