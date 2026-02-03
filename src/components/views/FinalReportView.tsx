import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  FileCheck,
  CheckCircle2,
  Target,
  DollarSign,
  Calendar,
  Award,
  Download,
  Printer,
  Edit2,
  Star,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PDFExporter, PDFExportSection } from '@/components/common/PDFExporter';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useFinalReport, FinalReport } from '@/hooks/useFinalReport';

export function FinalReportView() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { settings: project } = useProjectContext();
  const { data: report, isLoading } = useFinalReport(project?.id);

  const pdfSections: PDFExportSection[] = [
    { id: 'summary', name: 'Executive Summary', selector: '[data-section="summary"]' },
    { id: 'metrics', name: 'Key Metrics', selector: '[data-section="metrics"]' },
    { id: 'objectives', name: 'Objectives', selector: '[data-section="objectives"]' },
    { id: 'financials', name: 'Financial Summary', selector: '[data-section="financials"]' },
    { id: 'deliverables', name: 'Deliverables', selector: '[data-section="deliverables"]' },
    { id: 'team', name: 'Team Recognition', selector: '[data-section="team"]' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <div className="p-4 rounded-full bg-success/10 mb-4">
          <FileCheck className="h-12 w-12 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Final Report</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          A final report has not been generated for this project yet.
          Generate one after project completion to summarize achievements and performance.
        </p>
        <Button className="bg-success hover:bg-success/90">
          <Plus className="h-4 w-4 mr-2" />
          Generate Final Report
        </Button>
      </div>
    );
  }

  // Helper to cast JSONB fields
  const objectives = (report.objectives_achievement as any[]) || [];
  const financials = (report.financial_performance as any) || {};
  const schedule = (report.schedule_performance as any) || {};
  const deliverables = (report.deliverables_status as any[]) || [];
  const teamMembers = (report.team_recognition as any[]) || [];
  const recommendations = (report.recommendations as any[]) || [];

  return (
    <div className="flex flex-col h-full overflow-auto" ref={contentRef}>
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
                  {report.status === 'completed' ? 'Completed' : 'Draft'}
                </Badge>
              </div>
              <p className="text-muted-foreground">{project.name}</p>
              {report.completion_date && (
                <p className="text-sm text-muted-foreground mt-1">
                  Completed: {new Date(report.completion_date).toLocaleDateString()}
                </p>
              )}
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
            <PDFExporter
              title="Project Final Report"
              filename="final-report"
              contentRef={contentRef}
              sections={pdfSections}
              showSectionPicker
              variant="button"
            />
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
              <Card data-section="summary">
                <CardHeader>
                  <CardTitle className="text-base">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{report.executive_summary || 'No executive summary provided.'}</p>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4" data-section="metrics">
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4">
                    <DollarSign className="h-5 w-5 text-success mb-2" />
                    <div className="text-2xl font-bold text-success">
                      {financials.variance > 0 ? 'Under Budget' : financials.variance < 0 ? 'Over Budget' : 'On Budget'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {financials.variance !== undefined ? `$${(Math.abs(financials.variance) / 1000).toFixed(0)}K ${financials.variance > 0 ? 'saved' : 'over'}` : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4">
                    <Calendar className="h-5 w-5 text-success mb-2" />
                    <div className="text-2xl font-bold text-success">
                      {schedule.variance > 0 ? 'Delayed' : schedule.variance < 0 ? 'Ahead' : 'On Time'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {schedule.variance !== undefined ? `${Math.abs(schedule.variance)} days ${schedule.variance > 0 ? 'delay' : 'finish'}` : 'Delivered as planned'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4">
                    <Target className="h-5 w-5 text-success mb-2" />
                    <div className="text-2xl font-bold text-success">
                      {objectives.filter(o => o.status === 'met').length}/{objectives.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Objectives Met</p>
                  </CardContent>
                </Card>
                <Card className="border-warning/30 bg-warning/5">
                  <CardContent className="p-4">
                    <Star className="h-5 w-5 text-warning mb-2" />
                    <div className="text-2xl font-bold text-warning">{report.stakeholder_satisfaction || 0}/5</div>
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
                    {recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                        <span className="text-primary font-medium">{i + 1}.</span>
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                    {recommendations.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No recommendations provided.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="objectives" className="space-y-6" data-section="objectives">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Objectives Achievement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {objectives.map((obj, i) => (
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
                    {objectives.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No objectives achievement data.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financials" className="space-y-6" data-section="financials">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Budget Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Approved Budget</span>
                      <span className="font-semibold">${((financials.approvedBudget || 0) / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Actual Spend</span>
                      <span className="font-semibold">${((financials.actualSpend || 0) / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Variance</span>
                        <span className={cn(
                          "font-bold",
                          financials.variance >= 0 ? 'text-success' : 'text-destructive'
                        )}>
                          {financials.variance >= 0 ? '+' : '-'}${Math.abs((financials.variance || 0) / 1000).toFixed(0)}K ({financials.variancePercent || 0}%)
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
                      <span className="font-semibold">{schedule.plannedDuration || 0} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Actual Duration</span>
                      <span className="font-semibold">{schedule.actualDuration || 0} days</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Variance</span>
                        <span className={cn(
                          "font-bold",
                          schedule.variance <= 0 ? 'text-success' : 'text-destructive'
                        )}>
                          {schedule.variance <= 0 ? 'On Time / Ahead' : `${schedule.variance} days Delay`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="deliverables" className="space-y-6" data-section="deliverables">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Deliverables Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deliverables.map((del, i) => (
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
                    {deliverables.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No deliverables status data.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-6" data-section="team">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Team Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamMembers.map((member, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {member.name.split(' ').map((n: string) => n[0]).join('')}
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
                    {teamMembers.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No team recognition data.</p>
                    )}
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
