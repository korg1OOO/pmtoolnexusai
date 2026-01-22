import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Brain,
  Target,
  AlertTriangle,
  Users,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Network,
  BarChart3,
  FileText,
  Lightbulb,
  Scale,
  CircleDot,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockProjectContext, mockAIRiskDiscovery, mockValueEngineering } from '@/data/aiMockData';

export function StrategicDashboardView() {
  const [selectedOption, setSelectedOption] = useState<string | null>('OPT-001');
  
  const context = mockProjectContext;
  const riskDiscovery = mockAIRiskDiscovery;
  const valueEngineering = mockValueEngineering;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'at-risk':
      case 'uncertain':
        return <HelpCircle className="h-4 w-4 text-warning" />;
      case 'off-track':
      case 'invalid':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <CircleDot className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAttitudeColor = (attitude: string) => {
    switch (attitude) {
      case 'champion':
        return 'bg-success text-success-foreground';
      case 'supporter':
        return 'bg-success/20 text-success';
      case 'neutral':
        return 'bg-muted text-muted-foreground';
      case 'critic':
        return 'bg-warning/20 text-warning';
      case 'blocker':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
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
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI Readiness: {Math.round(context.aiReadiness * 100)}%
          </Badge>
          <Badge variant="outline">
            Context Quality: {context.contextQuality}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="context" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="context">Project Context</TabsTrigger>
          <TabsTrigger value="risks">AI Risk Discovery</TabsTrigger>
          <TabsTrigger value="value">Value Engineering</TabsTrigger>
          <TabsTrigger value="stakeholders">Stakeholder Map</TabsTrigger>
        </TabsList>

        {/* Project Context Tab */}
        <TabsContent value="context" className="space-y-4">
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
                    {context.businessCase.objectives.map((obj, i) => (
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
                          <Badge variant={b.type === 'financial' ? 'success' : b.type === 'strategic' ? 'info' : 'secondary'}>
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
                  {context.regulatoryFrameworks.map((reg) => (
                    <div key={reg.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{reg.name}</span>
                          <Badge variant="outline" className="text-xs">{reg.jurisdiction}</Badge>
                        </div>
                        <Badge 
                          variant={reg.complianceStatus === 'compliant' ? 'success' : 
                                  reg.complianceStatus === 'partially-compliant' ? 'warning' : 
                                  reg.complianceStatus === 'not-assessed' ? 'secondary' : 'destructive'}
                        >
                          {reg.complianceStatus}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {reg.requirements.slice(0, 3).map((req, i) => (
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
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Operating Constraints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {context.operatingConstraints.map((oc) => (
                    <div key={oc.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Badge 
                        variant={oc.flexibility === 'fixed' ? 'destructive' : oc.flexibility === 'negotiable' ? 'warning' : 'secondary'}
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
        </TabsContent>

        {/* AI Risk Discovery Tab */}
        <TabsContent value="risks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Discovered Risks */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI-Discovered Risks
                </CardTitle>
                <CardDescription>Risks identified through pattern matching and dependency analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {riskDiscovery.discoveredRisks.map((risk) => (
                    <motion.div
                      key={risk.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg border border-destructive/30 bg-destructive/5"
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
                        <p className="text-xs text-muted-foreground">{risk.explanation}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {risk.dataSupport.map((ds, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {ds.description}: {ds.value}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hidden Risks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-warning" />
                  Hidden Risks Inferred
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskDiscovery.hiddenRisks.map((risk) => (
                    <div key={risk.id} className="p-3 rounded-lg border border-warning/30 bg-warning/5">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-sm">{risk.title}</h4>
                        <Badge variant="warning" className="text-xs">{risk.confidence * 100}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{risk.inference}</p>
                      <div className="space-y-1 mb-2">
                        {risk.indicators.map((ind, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-warning" />
                            {ind}
                          </p>
                        ))}
                      </div>
                      <div className="p-2 rounded bg-success/10 text-xs">
                        <span className="font-medium">Recommendation:</span> {risk.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timing Risks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Timing & Seasonal Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskDiscovery.timingRisks.map((risk) => (
                    <div key={risk.id} className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={risk.type === 'regulatory-deadline' ? 'destructive' : 'warning'}>
                          {risk.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{risk.period}</span>
                      </div>
                      <p className="text-sm mb-1">{risk.description}</p>
                      <p className="text-xs text-muted-foreground mb-2">Impact: {risk.impact}</p>
                      <p className="text-xs text-success">Mitigation: {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Value Engineering Tab */}
        <TabsContent value="value" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {valueEngineering.options.map((option) => (
              <motion.div
                key={option.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedOption(option.id)}
                className={cn(
                  'cursor-pointer transition-all',
                  selectedOption === option.id && 'ring-2 ring-primary'
                )}
              >
                <Card className={cn(
                  selectedOption === option.id ? 'border-primary' : ''
                )}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{option.name}</CardTitle>
                      {valueEngineering.recommendation.selectedOption === option.id && (
                        <Badge variant="success">Recommended</Badge>
                      )}
                    </div>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <DollarSign className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-lg font-semibold">${(option.cost / 1000000).toFixed(2)}M</p>
                        <p className="text-xs text-muted-foreground">Cost</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <TrendingUp className="h-4 w-4 mx-auto text-success" />
                        <p className="text-lg font-semibold">{(option.roi * 100).toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">ROI</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <AlertTriangle className="h-4 w-4 mx-auto text-warning" />
                        <p className="text-lg font-semibold">{option.riskScore}</p>
                        <p className="text-xs text-muted-foreground">Risk Score</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <Clock className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-lg font-semibold">{option.timeImpact >= 0 ? '+' : ''}{option.timeImpact}d</p>
                        <p className="text-xs text-muted-foreground">Time Impact</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium mb-1 text-success">Pros</h5>
                      <ul className="space-y-1">
                        {option.pros.map((pro, i) => (
                          <li key={i} className="text-xs flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-success" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium mb-1 text-destructive">Cons</h5>
                      <ul className="space-y-1">
                        {option.cons.map((con, i) => (
                          <li key={i} className="text-xs flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-destructive" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tradeoff Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Trade-off Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border">
                  <h4 className="text-sm font-medium mb-2">Cost vs Time</h4>
                  <div className="space-y-2">
                    {valueEngineering.tradeoffAnalysis.costVsTime.points.map((p, i) => (
                      <div key={i} className={cn(
                        'flex items-center justify-between p-2 rounded text-sm',
                        p.isOptimal ? 'bg-primary/10 border border-primary' : 'bg-muted/30'
                      )}>
                        <span>{p.label}</span>
                        <span className="text-xs text-muted-foreground">{p.y >= 0 ? '+' : ''}{p.y}d</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{valueEngineering.tradeoffAnalysis.costVsTime.recommendation}</p>
                </div>

                <div className="p-4 rounded-lg border">
                  <h4 className="text-sm font-medium mb-2">Cost vs Risk</h4>
                  <div className="space-y-2">
                    {valueEngineering.tradeoffAnalysis.costVsRisk.points.map((p, i) => (
                      <div key={i} className={cn(
                        'flex items-center justify-between p-2 rounded text-sm',
                        p.isOptimal ? 'bg-primary/10 border border-primary' : 'bg-muted/30'
                      )}>
                        <span>{p.label}</span>
                        <span className="text-xs text-muted-foreground">Risk: {p.y}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{valueEngineering.tradeoffAnalysis.costVsRisk.recommendation}</p>
                </div>

                <div className="p-4 rounded-lg border bg-primary/5">
                  <h4 className="text-sm font-medium mb-2">AI Recommendation</h4>
                  <p className="text-lg font-semibold text-primary mb-2">{valueEngineering.tradeoffAnalysis.optimalPoint}</p>
                  <p className="text-sm text-muted-foreground mb-3">{valueEngineering.recommendation.justification}</p>
                  <Badge variant="outline">{valueEngineering.recommendation.confidence * 100}% confident</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stakeholder Power Map Tab */}
        <TabsContent value="stakeholders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Power/Interest Grid */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  Stakeholder Power Map
                </CardTitle>
                <CardDescription>Power vs Interest Matrix with Engagement Strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* High Power */}
                  <div className="border rounded-lg p-4 bg-destructive/5">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      High Power / High Interest (Manage Closely)
                    </h4>
                    <div className="space-y-2">
                      {context.stakeholderPowerMap.stakeholders
                        .filter(s => s.power === 'high' && s.interest === 'high')
                        .map((s) => (
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

                  <div className="border rounded-lg p-4 bg-warning/5">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-warning" />
                      High Power / Low Interest (Keep Satisfied)
                    </h4>
                    <div className="space-y-2">
                      {context.stakeholderPowerMap.stakeholders
                        .filter(s => s.power === 'high' && s.interest !== 'high')
                        .map((s) => (
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

                  <div className="border rounded-lg p-4 bg-info/5">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-info" />
                      Low Power / High Interest (Keep Informed)
                    </h4>
                    <div className="space-y-2">
                      {context.stakeholderPowerMap.stakeholders
                        .filter(s => s.power !== 'high' && s.interest === 'high')
                        .map((s) => (
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

                  <div className="border rounded-lg p-4 bg-muted/10">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Low Power / Low Interest (Monitor)
                    </h4>
                    <div className="space-y-2">
                      {context.stakeholderPowerMap.stakeholders
                        .filter(s => s.power !== 'high' && s.interest !== 'high')
                        .map((s) => (
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
              </CardContent>
            </Card>

            {/* Relationships */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stakeholder Relationships</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {context.stakeholderPowerMap.relationships.map((rel, i) => {
                    const from = context.stakeholderPowerMap.stakeholders.find(s => s.id === rel.from);
                    const to = context.stakeholderPowerMap.stakeholders.find(s => s.id === rel.to);
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm">
                        <span className="font-medium">{from?.name}</span>
                        <Badge variant={rel.type === 'conflicts-with' ? 'destructive' : 'secondary'}>
                          {rel.type}
                        </Badge>
                        <ArrowRight className="h-4 w-4" />
                        <span className="font-medium">{to?.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">{rel.strength}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  AI Engagement Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Generate Steering Committee Brief
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    Schedule Stakeholder Reviews
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Create Executive Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
