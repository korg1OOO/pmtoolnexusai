import React from 'react';
import {
  Clock,
  Target,
  Users,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { methodologyOptions } from '@/data/templateData';
import type { ProjectTemplate } from '@/types/templates';

interface TemplatePreviewProps {
  template: ProjectTemplate;
  open: boolean;
  onClose: () => void;
  onSelect: () => void;
}

export function TemplatePreview({ template, open, onClose, onSelect }: TemplatePreviewProps) {
  const methodology = methodologyOptions.find((m) => m.id === template.methodology);
  const totalDays = template.phases.reduce((sum, phase) => sum + phase.durationDays, 0);
  const totalMilestones = template.phases.reduce((sum, phase) => sum + phase.milestones.length, 0);
  const totalTasks = template.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
  const gateCount = template.phases.filter((p) => p.gateApproval).length;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'text-destructive';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getProbabilityColor = (probability: string) => {
    switch (probability) {
      case 'high':
        return 'bg-destructive/20 text-destructive';
      case 'medium':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${template.color}20` }}
            >
              <FileText className="h-6 w-6" style={{ color: template.color }} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{template.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {template.description}
              </DialogDescription>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline">{methodology?.name}</Badge>
                <Badge variant="secondary">{template.complexity} complexity</Badge>
                <Badge variant="secondary">{template.usageCount} uses</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="phases">Phases & Tasks</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="risks">Risks</TabsTrigger>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
              <TabsTrigger value="ai">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{template.phases.length}</div>
                    <div className="text-xs text-muted-foreground">Phases</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{totalMilestones}</div>
                    <div className="text-xs text-muted-foreground">Milestones</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{totalTasks}</div>
                    <div className="text-xs text-muted-foreground">Sample Tasks</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{gateCount}</div>
                    <div className="text-xs text-muted-foreground">Stage Gates</div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Phase Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {template.phases.map((phase, index) => {
                      const progress = (phase.durationDays / totalDays) * 100;
                      return (
                        <div key={phase.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{phase.name}</span>
                              {phase.gateApproval && (
                                <Badge variant="outline" className="text-xs">Gate</Badge>
                              )}
                            </div>
                            <span className="text-muted-foreground">{phase.durationDays} days</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t text-sm">
                    <span className="text-muted-foreground">Total Duration</span>
                    <span className="font-semibold">{totalDays} days (~{Math.ceil(totalDays / 7)} weeks)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Industries & Tags */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Industries</div>
                      <div className="flex flex-wrap gap-1">
                        {template.industry.map((ind) => (
                          <Badge key={ind} variant="secondary" className="text-xs">
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="phases" className="mt-4 space-y-4">
              {template.phases.map((phase, index) => (
                <Card key={phase.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                        {phase.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {phase.gateApproval && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Gate Approval
                          </Badge>
                        )}
                        <Badge variant="outline">{phase.durationDays} days</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{phase.description}</p>
                  </CardHeader>
                  <CardContent>
                    {phase.milestones.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Milestones</div>
                        <div className="space-y-1">
                          {phase.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-center gap-2 text-sm">
                              <Target className={`h-4 w-4 ${milestone.isCritical ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span>{milestone.name}</span>
                              {milestone.isCritical && (
                                <Badge variant="destructive" className="text-xs">Critical</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {phase.tasks.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">Sample Tasks</div>
                        <div className="space-y-1">
                          {phase.tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between text-sm p-2 rounded bg-secondary/50">
                              <div className="flex items-center gap-2">
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                <span>{task.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                {task.defaultRole && (
                                  <Badge variant="outline" className="text-xs">{task.defaultRole}</Badge>
                                )}
                                <span className="text-xs">{task.durationDays}d</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="roles" className="mt-4">
              {template.roles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.roles.map((role) => (
                    <Card key={role.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{role.name}</span>
                          </div>
                          {role.isRequired && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{role.description}</p>
                        {role.responsibilities.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Responsibilities
                            </div>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {role.responsibilities.map((resp, i) => (
                                <li key={i}>• {resp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No predefined roles in this template.</p>
                  <p className="text-sm">You can define roles during project setup.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="risks" className="mt-4">
              {template.risks.length > 0 ? (
                <div className="space-y-3">
                  {template.risks.map((risk) => (
                    <Card key={risk.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className={`h-5 w-5 mt-0.5 ${getImpactColor(risk.impact)}`} />
                            <div>
                              <div className="font-medium">{risk.title}</div>
                              <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Badge className={getProbabilityColor(risk.probability)}>
                              {risk.probability} probability
                            </Badge>
                            <Badge variant="outline">{risk.impact} impact</Badge>
                          </div>
                        </div>
                        {risk.mitigation && (
                          <div className="mt-3 p-2 rounded bg-secondary/50">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Mitigation Strategy
                            </div>
                            <p className="text-sm">{risk.mitigation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No predefined risks in this template.</p>
                  <p className="text-sm">AI will identify risks during project setup.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="meetings" className="mt-4">
              {template.meetings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.meetings.map((meeting) => (
                    <Card key={meeting.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{meeting.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {meeting.frequency}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{meeting.description}</p>
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>{meeting.duration} minutes</span>
                          <span>{meeting.participants.length} participants</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No predefined meetings in this template.</p>
                  <p className="text-sm">You can set up meeting cadence during project setup.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai" className="mt-4 space-y-4">
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Typical Duration</div>
                      <div className="text-lg font-semibold text-primary">
                        {template.aiMetadata.typicalDuration.min}–{template.aiMetadata.typicalDuration.max}{' '}
                        {template.aiMetadata.typicalDuration.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Effort Benchmark</div>
                      <div className="text-lg font-semibold">
                        {template.aiMetadata.effortBenchmarks.min}–{template.aiMetadata.effortBenchmarks.max}{' '}
                        {template.aiMetadata.effortBenchmarks.unit}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-medium mb-2">Common Risk Patterns</div>
                    <div className="flex flex-wrap gap-2">
                      {template.aiMetadata.riskPatterns.map((pattern, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Success Indicators</div>
                    <div className="space-y-1">
                      {template.aiMetadata.successIndicators.map((indicator, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          {indicator}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Failure Signals</div>
                    <div className="space-y-1">
                      {template.aiMetadata.failureSignals.map((signal, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                          <XCircle className="h-4 w-4" />
                          {signal}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSelect}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Use This Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
