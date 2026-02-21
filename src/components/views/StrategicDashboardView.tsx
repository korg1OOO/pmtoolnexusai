import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Brain, Target, TrendingUp, Shield, Clock, ArrowRight,
  CheckCircle2, Sparkles, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useStrategicInsights } from '@/hooks/useStrategicInsights';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { StrategicAISidebar } from '@/components/ai/StrategicAISidebar';
import { TrackedAIService } from '@/services/trackedAIService';
import { AIRiskDiscovery, ProjectContext, ValueEngineering } from '@/types/ai-pm';
import { AlertCircle, Plus } from 'lucide-react';
import { ChangeImpactAnalyzerPanel } from '@/components/ai/ChangeImpactAnalyzerPanel';

export default function StrategicDashboardView() {
  const { settings } = useProjectContext();
  const { data: insights, isLoading, refetch } = useStrategicInsights(settings.id);
  const [selectedOption, setSelectedOption] = useState<string | null>('OPT-001');
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [isAnalyzingRisks, setIsAnalyzingRisks] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Live Data with no mock fallback
  const context = insights?.context; // ProjectContext | undefined
  const riskDiscovery = insights?.riskDiscovery; // AIRiskDiscovery | undefined
  const valueEngineering = insights?.valueEngineering; // ValueEngineering | undefined

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
      case 'valid':
      case 'compliant':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'at-risk':
      case 'uncertain':
      case 'partially-compliant':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAttitudeColor = (attitude: string): string => {
    switch (attitude) {
      case 'champion':
        return 'bg-success/10 text-success border-success/20';
      case 'supporter':
        return 'bg-success/5 text-success/80 border-success/10';
      case 'neutral':
        return 'bg-muted text-muted-foreground border-border';
      case 'critic':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <StrategicAISidebar isOpen={showAISidebar} onToggle={() => setShowAISidebar(!showAISidebar)} />
      <div className={cn("p-6 space-y-6 overflow-y-auto h-full transition-all duration-300", showAISidebar && "mr-80")}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Strategic Dashboard
            </h1>
            <p className="text-muted-foreground">AI-powered project intelligence and decision support</p>
          </div>
          <div className="flex items-center gap-2">
            {context && (
              <>
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Readiness: {Math.round(context.aiReadiness * 100)}%
                </Badge>
                <Badge variant="outline">
                  Context Quality: {context.contextQuality}
                </Badge>
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="context" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="context">Project Context</TabsTrigger>
            <TabsTrigger value="risks">AI Risk Discovery</TabsTrigger>
            <TabsTrigger value="value">Value Engineering</TabsTrigger>
            <TabsTrigger value="stakeholders">Stakeholder Map</TabsTrigger>
            <TabsTrigger value="change-impact">Change Impact</TabsTrigger>
          </TabsList>

          {/* Project Context Tab */}
          <TabsContent value="context" className="space-y-4">
            {!context ? (
              <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 bg-muted/20 border-dashed">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <Brain className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Project Context Not Available</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  AI has not yet analyzed the project context. Configure the project charter and run the initial analysis to populate this dashboard.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Initialize Project Context
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Business Case */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Business Case
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Strategic Objectives</h4>
                      <ul className="space-y-2">
                        {context.businessCase.objectives.map((obj: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Success Criteria</h4>
                      <div className="space-y-3">
                        {context.businessCase.successCriteria.map((sc) => (
                          <div key={sc.id} className="p-3 rounded-lg bg-muted/30 border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{sc.description}</span>
                              {getStatusIcon(sc.status)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Target: {sc.target}</span>
                              <span>•</span>
                              <span>Current: {sc.currentValue}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Benefits & Assumptions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Benefits & Assumptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Projected Benefits</h4>
                      <div className="space-y-2">
                        {context.businessCase.benefits.map((b) => (
                          <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2">
                              <Badge variant={(b.type === 'financial' ? 'success' : b.type === 'strategic' ? 'outline' : 'secondary')}>
                                {b.type}
                              </Badge>
                              <span className="text-sm">{b.description}</span>
                            </div>
                            {b.quantified && b.value && (
                              <span className="text-sm font-medium text-success">${(b.value / 1000).toFixed(0)}K</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Key Assumptions</h4>
                      <div className="space-y-2">
                        {context.businessCase.assumptions.map((a) => (
                          <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                            {getStatusIcon(a.status)}
                            <div className="flex-1">
                              <p className="text-sm">{a.description}</p>
                              <p className="text-xs text-muted-foreground">Impact: {a.impact}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Regulatory Frameworks */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Regulatory Frameworks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {context.regulatoryFrameworks.map((reg: any) => (
                          <div key={reg.id} className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{reg.name}</span>
                                <Badge variant="outline" className="text-xs">{reg.jurisdiction}</Badge>
                              </div>
                              <Badge
                                variant={(reg.complianceStatus === 'compliant' ? 'success' :
                                  reg.complianceStatus === 'partially-compliant' ? 'warning' :
                                    reg.complianceStatus === 'not-assessed' ? 'secondary' : 'destructive')}
                              >
                                {reg.complianceStatus}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {reg.requirements.slice(0, 3).map((req: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">{req}</Badge>
                              ))}
                              {reg.requirements.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{reg.requirements.length - 3}</Badge>
                              )}
                            </div>
                            {reg.deadline && (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Deadline: {new Date(reg.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Operating Constraints */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Operating Constraints
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {context.operatingConstraints.map((oc: any) => (
                          <div key={oc.id} className="flex items-start gap-3 p-3 rounded-lg border">
                            <Badge
                              variant={(oc.flexibility === 'fixed' ? 'destructive' : oc.flexibility === 'negotiable' ? 'warning' : 'secondary')}
                              className="shrink-0"
                            >
                              {oc.flexibility}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-sm">{oc.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{oc.type}</Badge>
                                <span className="text-xs text-muted-foreground">→ {oc.impact}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* AI Risk Discovery Tab */}
          <TabsContent value="risks" className="space-y-4">
            {!riskDiscovery ? (
              <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 bg-muted/20 border-dashed">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Risk Analysis Found</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Deep risk analysis has not been performed on this project yet. Use the AI engine to scan for hidden risks and patterns.
                </p>
                <Button
                  className="gap-2"
                  disabled={isAnalyzingRisks}
                  onClick={async () => {
                    if (!settings?.id) return;
                    setIsAnalyzingRisks(true);
                    toast.info('AI is performing project risk discovery...');
                    const { error } = await TrackedAIService.analyzeRisks(settings.id);

                    if (error) {
                      setIsAnalyzingRisks(false);
                      toast.error('Risk discovery failed: ' + error);
                    } else {
                      // Data persisted by service, now refetch to update UI
                      await refetch();
                      setIsAnalyzingRisks(false);
                      toast.success('AI Risk Discovery complete');
                    }
                  }}
                >
                  {isAnalyzingRisks ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Run Risk Discovery
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Discovered Risks
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-2"
                          disabled={isAnalyzingRisks || !settings?.id}
                          onClick={async () => {
                            if (!settings?.id) return;
                            setIsAnalyzingRisks(true);
                            toast.info('AI is performing project risk discovery...');
                            const { error } = await TrackedAIService.analyzeRisks(settings.id);

                            if (error) {
                              setIsAnalyzingRisks(false);
                              toast.error('Risk discovery failed: ' + error);
                            } else {
                              // Data persisted by service, now refetch to update UI
                              await refetch();
                              setIsAnalyzingRisks(false);
                              toast.success('AI Risk Discovery complete');
                            }
                          }}
                        >
                          {isAnalyzingRisks ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Re-discover Risks
                        </Button>
                      </div>
                      <CardDescription>AI-identified risks based on pattern matching and historical project data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {riskDiscovery.discoveredRisks.map((risk) => (
                        <div
                          key={risk.id}
                          className="p-4 rounded-lg border border-primary/20 bg-primary/5 relative overflow-hidden group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{risk.title}</h4>
                            <Badge variant="destructive" className="text-xs">{risk.confidence * 100}% confident</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{risk.description}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">P: {risk.probability}</Badge>
                            <Badge variant="outline">I: {risk.impact}</Badge>
                            <Badge variant="secondary" className="text-xs">{risk.source}</Badge>
                          </div>
                          <div className="mt-3 p-2 rounded bg-muted/50">
                            <p className="text-xs font-medium mb-1">AI Explanation:</p>
                            <p className="text-xs text-muted-foreground italic truncate">{risk.explanation}</p>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {risk.dataSupport.map((ds, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {ds.description}: {ds.value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Inferred Risks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {riskDiscovery.hiddenRisks.map((risk) => (
                        <div key={risk.id} className="p-3 rounded-lg border border-warning/30 bg-warning/5">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-sm">{risk.title}</h4>
                            <Badge variant="warning" className="text-xs">{risk.confidence * 100}%</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{risk.inference}</p>
                          <div className="space-y-1 mb-2">
                            {risk.indicators.map((ind: string, i: number) => (
                              <p key={i} className="text-xs flex items-center gap-1">
                                <Target className="h-3 w-3" /> {ind}
                              </p>
                            ))}
                          </div>
                          <p className="text-xs text-primary font-medium p-2 bg-primary/5 rounded border border-primary/10">
                            Rec: {risk.recommendation}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Timing & Sequence Risks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {riskDiscovery.timingRisks.map((risk) => (
                        <div key={risk.id} className="p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={(risk.type === 'regulatory-deadline' ? 'destructive' : 'warning')}>
                              {risk.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{risk.period}</span>
                          </div>
                          <p className="text-sm mb-1">{risk.description}</p>
                          <p className="text-xs text-muted-foreground italic mb-2">{risk.impact}</p>
                          <div className="text-xs bg-muted p-2 rounded">
                            Mitigation: {risk.mitigation}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Value Engineering Tab */}
          <TabsContent value="value" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {valueEngineering?.options?.map((option) => (
                <Card
                  key={option.id}
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    selectedOption === option.id ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : "hover:border-primary/50"
                  )}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{option.name}</CardTitle>
                      {valueEngineering.recommendation.selectedOption === option.id && (
                        <Badge variant="success">Recommended</Badge>
                      )}
                    </div>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">Est. Cost</p>
                        <p className="font-semibold">${(option.cost / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">ROI (2yr)</p>
                        <p className="font-semibold text-success">+{option.roi * 100}%</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">Risk Score</p>
                        <p className="font-semibold">{option.riskScore}/10</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">Time Impact</p>
                        <p className={cn("font-semibold", option.timeImpact <= 0 ? "text-success" : "text-destructive")}>
                          {option.timeImpact >= 0 ? "+" : ""}{option.timeImpact} days
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium">Key Pros:</p>
                      {option.pros.map((pro, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-success" /> {pro}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Trade-off Analysis</CardTitle>
                  <CardDescription>Balanced comparison of cost, risk, and time factors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-4">
                        <h4 className="text-sm font-medium">Relative Cost vs. Time Advantage</h4>
                        <span className="text-xs text-muted-foreground">Optimal point marked in blue</span>
                      </div>
                      <div className="h-24 flex items-end gap-1 mb-2">
                        {valueEngineering.tradeoffAnalysis.costVsTime.points.map((p, i: number) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div
                              className={cn(
                                "w-full rounded-t transition-all",
                                p.isOptimal ? "bg-primary shadow-lg shadow-primary/20" : "bg-primary/20"
                              )}
                              style={{ height: `${Math.abs(p.y) + 20}%` }}
                            />
                            <span className="text-[10px] text-center font-medium opacity-70 group-hover:opacity-100">{p.label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground italic mt-2 text-center">
                        {valueEngineering.tradeoffAnalysis.costVsTime.recommendation}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-4">Risk Profile per Option</h4>
                      <div className="h-24 flex items-end gap-1 mb-2">
                        {valueEngineering.tradeoffAnalysis.costVsRisk.points.map((p, i: number) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            <div
                              className={cn(
                                "w-full rounded-t transition-all",
                                p.isOptimal ? "bg-primary shadow-lg shadow-primary/20" : "bg-primary/20"
                              )}
                              style={{ height: `${(p.y / 10) * 100}%` }}
                            />
                            <span className="text-[10px] text-center font-medium opacity-70 group-hover:opacity-100">{p.label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground italic mt-2 text-center">
                        {valueEngineering.tradeoffAnalysis.costVsRisk.recommendation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Strategic Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="text-sm font-medium mb-2">AI Recommendation</h4>
                    <p className="text-lg font-semibold text-primary mb-2">{valueEngineering?.tradeoffAnalysis?.optimalPoint}</p>
                    <p className="text-sm text-muted-foreground mb-3">{valueEngineering?.recommendation?.justification}</p>
                    <Badge variant="outline">{(valueEngineering?.recommendation?.confidence || 0) * 100}% confident</Badge>
                    <div className="mt-4">
                      <Button
                        className="w-full gap-2"
                        onClick={() => {
                          const option = valueEngineering?.options?.find((o) => o.id === selectedOption);
                          toast.success(`Implementing Value Engineering Option: ${option?.name || 'Selected Option'}`);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Implement Recommendation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stakeholder Map Tab */}
          <TabsContent value="stakeholders" className="space-y-4">
            {!context ? (
              <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 bg-muted/20 border-dashed">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Stakeholder Map Unavailable</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Stakeholder analysis requires the project context to be initialized effectively.
                </p>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Stakeholder Influence & Sentiment Map
                  </CardTitle>
                  <CardDescription>AI-generated analysis of stakeholder power dynamics and project attitude</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* High Power, High Interest (Manage Closely) */}
                    <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/10 min-h-[200px]">
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Champions (Key Influencers)</h4>
                      <div className="space-y-2">
                        {context.stakeholderPowerMap.stakeholders.filter((s) => s.power === 'high' && s.attitude === 'champion').map((s) => (
                          <div key={s.id} className="p-3 rounded bg-card border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{s.name}</span>
                              <Badge className={getAttitudeColor(s.attitude)}>{s.attitude}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{s.role}</p>
                            <p className="text-xs bg-muted/50 p-2 rounded">{s.engagementStrategy}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* High Power, Medium Interest */}
                    <div className="space-y-2 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 min-h-[200px]">
                      <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">High Power, Medium Interest</h4>
                      <div className="space-y-2">
                        {context.stakeholderPowerMap.stakeholders.filter((s) => s.power === 'high' && s.attitude === 'supporter').map((s) => (
                          <div key={s.id} className="p-3 rounded bg-card border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{s.name}</span>
                              <Badge className={getAttitudeColor(s.attitude)}>{s.attitude}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{s.role}</p>
                            <p className="text-xs bg-muted/50 p-2 rounded">{s.engagementStrategy}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Medium Power, High Interest */}
                    <div className="space-y-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 min-h-[200px]">
                      <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Knowledge Keepers</h4>
                      <div className="space-y-2">
                        {context.stakeholderPowerMap.stakeholders.filter((s) => s.power === 'medium' && s.interest === 'high').map((s) => (
                          <div key={s.id} className="p-3 rounded bg-card border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{s.name}</span>
                              <Badge className={getAttitudeColor(s.attitude)}>{s.attitude}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{s.role}</p>
                            <p className="text-xs bg-muted/50 p-2 rounded">{s.engagementStrategy}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Low Power, Low Interest */}
                    <div className="space-y-2 p-3 rounded-lg bg-muted border min-h-[200px]">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Informed Only</h4>
                      <div className="space-y-2">
                        {context.stakeholderPowerMap.stakeholders.filter((s) => s.interest === 'low').map((s) => (
                          <div key={s.id} className="p-3 rounded bg-card border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{s.name}</span>
                              <Badge className={getAttitudeColor(s.attitude)}>{s.attitude}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{s.role}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Conflict Map */}
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold mb-4">Inter-Stakeholder Conflict Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {context.stakeholderPowerMap.relationships.map((rel, i: number) => {
                        const from = context.stakeholderPowerMap.stakeholders.find((s) => s.id === rel.from);
                        const to = context.stakeholderPowerMap.stakeholders.find((s) => s.id === rel.to);
                        return (
                          <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm">
                            <span className="font-medium">{from?.name}</span>
                            <Badge variant={(rel.type === 'conflicts-with' ? 'destructive' : 'secondary')}>
                              {rel.type}
                            </Badge>
                            <ArrowRight className="h-4 w-4" />
                            <span className="font-medium">{to?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Change Impact Analyzer Tab — P2.6 */}
          <TabsContent value="change-impact" className="space-y-4">
            <ChangeImpactAnalyzerPanel
              projectId={settings.id}
              projectName={settings.name}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
