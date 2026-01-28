import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FileText,
  Target,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Edit2,
  Save,
  Award,
  Bookmark,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockProject } from '@/data/mockData';

export function ProjectCharterView() {
  const [isEditing, setIsEditing] = useState(false);

  const charterData = {
    projectName: mockProject.name,
    projectCode: mockProject.code,
    version: '2.1',
    status: 'Approved',
    approvedDate: '2024-01-10',
    vision: 'Transform our legacy infrastructure into a modern, scalable cloud-native platform that enables rapid innovation and reduces operational costs by 40%.',
    mission: 'Execute a phased migration of all business-critical applications to the cloud while maintaining zero disruption to business operations.',
    objectives: [
      { id: 1, text: 'Migrate 100% of Tier-1 applications to cloud by Q4 2024', status: 'in-progress', progress: 65 },
      { id: 2, text: 'Achieve 99.99% uptime SLA for all migrated systems', status: 'on-track', progress: 85 },
      { id: 3, text: 'Reduce infrastructure costs by 40%', status: 'at-risk', progress: 30 },
      { id: 4, text: 'Implement zero-trust security architecture', status: 'completed', progress: 100 },
    ],
    successCriteria: [
      'All critical business applications successfully migrated',
      'No unplanned downtime during migration',
      'Security audit passed with no critical findings',
      'User satisfaction score above 85%',
      'Cost reduction targets achieved within 12 months post-migration',
    ],
    assumptions: [
      'Cloud provider will maintain committed SLAs',
      'Adequate skilled resources available for migration',
      'Legacy system documentation is accurate and complete',
      'Business stakeholders available for UAT cycles',
    ],
    constraints: [
      'Budget ceiling of $2.5M',
      'Must complete before regulatory deadline Q1 2025',
      'No impact to month-end financial processing',
      'Maintain PCI-DSS compliance throughout',
    ],
    approvalAuthorities: [
      { role: 'Executive Sponsor', name: 'James Morrison', authority: 'Final project approval', approved: true },
      { role: 'Project Sponsor', name: 'Sarah Mitchell', authority: 'Budget & scope changes up to $50K', approved: true },
      { role: 'Technical Lead', name: 'Mike Johnson', authority: 'Technical decisions & architecture', approved: true },
      { role: 'Business Owner', name: 'Lisa Chen', authority: 'Business requirements sign-off', approved: false },
    ],
    milestones: [
      { name: 'Discovery Complete', date: '2024-03-15', status: 'completed' },
      { name: 'Architecture Approved', date: '2024-05-31', status: 'completed' },
      { name: 'Wave 1 Migration', date: '2024-08-31', status: 'in-progress' },
      { name: 'Wave 2 Migration', date: '2024-10-15', status: 'upcoming' },
      { name: 'Go-Live', date: '2024-12-15', status: 'upcoming' },
    ],
    budget: {
      approved: 2500000,
      allocated: 2300000,
      spent: mockProject.spent,
    },
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{charterData.projectName}</h1>
              <p className="text-muted-foreground">Project Charter • Version {charterData.version}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="success">{charterData.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  Approved: {new Date(charterData.approvedDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
              {isEditing ? 'Save Changes' : 'Edit Charter'}
            </Button>
            <Button>
              <Bookmark className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="constraints">Assumptions & Constraints</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Vision & Mission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Vision Statement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{charterData.vision}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Mission Statement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{charterData.mission}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Success Criteria */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Success Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {charterData.successCriteria.map((criteria, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                        <span className="text-sm">{criteria}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Budget Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Budget Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold">${(charterData.budget.approved / 1000000).toFixed(1)}M</div>
                      <p className="text-xs text-muted-foreground">Approved Budget</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold">${(charterData.budget.allocated / 1000000).toFixed(1)}M</div>
                      <p className="text-xs text-muted-foreground">Allocated</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold text-primary">${(charterData.budget.spent / 1000000).toFixed(2)}M</div>
                      <p className="text-xs text-muted-foreground">Spent to Date</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="objectives" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Objectives</CardTitle>
                  <CardDescription>Measurable goals with success criteria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {charterData.objectives.map((obj) => (
                      <div key={obj.id} className="p-4 rounded-lg border bg-muted/20">
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-sm font-medium">{obj.text}</p>
                          <Badge variant={
                            obj.status === 'completed' ? 'success' :
                            obj.status === 'at-risk' ? 'destructive' :
                            obj.status === 'on-track' ? 'info' : 'warning'
                          }>
                            {obj.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                obj.status === 'completed' ? 'bg-success' :
                                obj.status === 'at-risk' ? 'bg-destructive' : 'bg-primary'
                              )}
                              style={{ width: `${obj.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{obj.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="constraints" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-info" />
                      Assumptions
                    </CardTitle>
                    <CardDescription>Conditions assumed to be true</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {charterData.assumptions.map((assumption, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
                          <span className="text-info font-medium">A{i + 1}.</span>
                          <span className="text-sm">{assumption}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      Constraints
                    </CardTitle>
                    <CardDescription>Limitations and boundaries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {charterData.constraints.map((constraint, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                          <span className="text-warning font-medium">C{i + 1}.</span>
                          <span className="text-sm">{constraint}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="approvals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Approval Authorities
                  </CardTitle>
                  <CardDescription>Key stakeholders and their decision authority</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {charterData.approvalAuthorities.map((auth, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {auth.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{auth.name}</p>
                            <p className="text-sm text-muted-foreground">{auth.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{auth.authority}</span>
                          {auth.approved ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="milestones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Key Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {charterData.milestones.map((milestone, i) => (
                        <div key={i} className="relative flex items-center gap-4 pl-10">
                          <div className={cn(
                            "absolute left-2.5 h-4 w-4 rounded-full border-2",
                            milestone.status === 'completed' ? 'bg-success border-success' :
                            milestone.status === 'in-progress' ? 'bg-primary border-primary animate-pulse' :
                            'bg-muted border-border'
                          )} />
                          <div className="flex-1 p-3 rounded-lg border bg-muted/20">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{milestone.name}</span>
                              <Badge variant={
                                milestone.status === 'completed' ? 'success' :
                                milestone.status === 'in-progress' ? 'info' : 'secondary'
                              }>
                                {milestone.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(milestone.date).toLocaleDateString('en-US', { 
                                year: 'numeric', month: 'long', day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
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
