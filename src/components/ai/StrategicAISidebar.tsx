import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Brain,
  Sparkles,
  Target,
  AlertTriangle,
  Shield,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Users,
  DollarSign,
  Scale,
  Clock,
  CheckCircle2,
  Zap,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { mockProjectContext, mockAIRiskDiscovery, mockValueEngineering } from '@/data/aiMockData';

interface StrategicAISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function StrategicAISidebar({ isOpen, onToggle }: StrategicAISidebarProps) {
  const context = mockProjectContext;
  const riskDiscovery = mockAIRiskDiscovery;
  const valueEngineering = mockValueEngineering;

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className={cn(
          'fixed right-0 top-1/2 -translate-y-1/2 z-50',
          'flex items-center gap-1 px-2 py-3 rounded-l-lg',
          'bg-primary text-primary-foreground shadow-lg',
          'hover:bg-primary/90 transition-colors',
          isOpen && 'hidden'
        )}
      >
        <Brain className="h-5 w-5" />
        <ChevronLeft className="h-4 w-4" />
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-xl z-40 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Strategic AI</h3>
                  <p className="text-xs text-muted-foreground">Decision Support</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* AI Readiness Banner */}
            <div className="px-4 py-3 bg-muted/30 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">AI Readiness</span>
                <Badge variant="outline">{Math.round(context.aiReadiness * 100)}%</Badge>
              </div>
              <Progress value={context.aiReadiness * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Context quality: {context.contextQuality}</p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Risk Summary */}
                <Card className="border-destructive/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Risk Discovery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 rounded bg-destructive/10">
                        <div className="text-lg font-bold text-destructive">{riskDiscovery.discoveredRisks.length}</div>
                        <div className="text-xs text-muted-foreground">Discovered</div>
                      </div>
                      <div className="text-center p-2 rounded bg-warning/10">
                        <div className="text-lg font-bold text-warning">{riskDiscovery.hiddenRisks.length}</div>
                        <div className="text-xs text-muted-foreground">Hidden</div>
                      </div>
                      <div className="text-center p-2 rounded bg-info/10">
                        <div className="text-lg font-bold text-info">{riskDiscovery.timingRisks.length}</div>
                        <div className="text-xs text-muted-foreground">Timing</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {riskDiscovery.discoveredRisks.slice(0, 2).map((risk) => (
                        <div key={risk.id} className="text-xs p-2 rounded bg-muted/50">
                          <p className="font-medium">{risk.title}</p>
                          <p className="text-muted-foreground">{risk.confidence * 100}% confident</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Value Engineering */}
                <Card className="border-success/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Scale className="h-4 w-4 text-success" />
                      Value Engineering
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-2 rounded bg-success/10 text-xs">
                      <div className="flex items-center gap-1 text-success font-medium mb-1">
                        <Sparkles className="h-3 w-3" />
                        Recommended Option
                      </div>
                      <p className="font-medium">{valueEngineering.recommendation.selectedOption}</p>
                      <p className="text-muted-foreground">{valueEngineering.recommendation.confidence * 100}% confidence</p>
                    </div>
                    <div className="text-xs">
                      <p className="font-medium mb-1">Key Trade-offs:</p>
                      <div className="flex items-center justify-between p-1">
                        <span className="text-muted-foreground">Cost vs Time</span>
                        <Badge variant="outline" className="text-xs">{valueEngineering.tradeoffAnalysis.costVsTime.recommendation.slice(0, 20)}...</Badge>
                      </div>
                      <div className="flex items-center justify-between p-1">
                        <span className="text-muted-foreground">Optimal Point</span>
                        <Badge variant="outline" className="text-xs">{valueEngineering.tradeoffAnalysis.optimalPoint}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stakeholder Power Map */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Stakeholder Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {context.stakeholderPowerMap.stakeholders.slice(0, 3).map((stakeholder) => (
                        <div key={stakeholder.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                          <div>
                            <p className="font-medium">{stakeholder.name}</p>
                            <p className="text-muted-foreground">{stakeholder.role}</p>
                          </div>
                          <Badge 
                            variant={stakeholder.attitude === 'champion' ? 'success' : 
                                    stakeholder.attitude === 'supporter' ? 'secondary' : 
                                    stakeholder.attitude === 'neutral' ? 'outline' : 'warning'}
                          >
                            {stakeholder.attitude}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Regulatory Status */}
                <Card className="border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Regulatory Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {context.regulatoryFrameworks.slice(0, 2).map((reg) => (
                        <div key={reg.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                          <span className="font-medium">{reg.name}</span>
                          <Badge 
                            variant={reg.complianceStatus === 'compliant' ? 'success' : 
                                    reg.complianceStatus === 'partially-compliant' ? 'warning' : 'secondary'}
                            className="text-xs"
                          >
                            {reg.complianceStatus}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                      <BarChart3 className="h-3 w-3" />
                      Generate Board Report
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                      <TrendingUp className="h-3 w-3" />
                      Run Scenario Analysis
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                      <Lightbulb className="h-3 w-3" />
                      Get Recommendations
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
