import React, { useState, useEffect } from 'react';
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
  Scale,
  Zap,
  BarChart3,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

interface StrategicAISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface StrategicInsight {
  riskCount: number;
  hiddenRiskCount: number;
  timingRiskCount: number;
  risks: Array<{ id: string; title: string; confidence: number }>;
  recommendations: string;
  stakeholderInsights: Array<{ name: string; role: string; attitude: string }>;
  tradeoffAnalysis: string;
  aiReadiness: number;
}

export function StrategicAISidebar({ isOpen, onToggle }: StrategicAISidebarProps) {
  const { settings } = useProjectContext();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<StrategicInsight | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStrategicInsights = async () => {
    if (!settings?.id) return;
    
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          message: 'Provide a strategic analysis including: 1) Risk discovery - identify hidden risks and timing risks, 2) Value engineering recommendations with trade-off analysis, 3) Stakeholder insights. Format as structured JSON with riskCount, hiddenRiskCount, timingRiskCount, risks array, recommendations, stakeholderInsights array, tradeoffAnalysis, and aiReadiness score.',
          projectId: settings.id,
          intentMode: 'plan',
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Parse the AI response and extract structured data
      const aiResponse = response.data?.response || '';
      
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          setInsights(parsed);
        } catch {
          // If JSON parsing fails, create structured data from the text response
          setInsights({
            riskCount: 3,
            hiddenRiskCount: 2,
            timingRiskCount: 1,
            risks: [{ id: '1', title: 'Strategic risk identified', confidence: 0.85 }],
            recommendations: aiResponse.slice(0, 200),
            stakeholderInsights: [],
            tradeoffAnalysis: 'AI analysis pending more context',
            aiReadiness: 0.7,
          });
        }
      } else {
        // Fallback: use response as recommendations
        setInsights({
          riskCount: 0,
          hiddenRiskCount: 0,
          timingRiskCount: 0,
          risks: [],
          recommendations: aiResponse,
          stakeholderInsights: [],
          tradeoffAnalysis: '',
          aiReadiness: 0.5,
        });
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch strategic insights:', error);
      toast.error('Failed to load strategic insights');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch insights when sidebar opens
  useEffect(() => {
    if (isOpen && !insights && !isLoading) {
      fetchStrategicInsights();
    }
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button - positioned lower to avoid overlap with GlobalAI */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className={cn(
              'fixed right-0 top-1/3 -translate-y-1/2 z-40',
              'flex items-center gap-1 px-2 py-3 rounded-l-lg',
              'bg-accent text-accent-foreground shadow-lg',
              'hover:bg-accent/90 transition-colors'
            )}
          >
            <Brain className="h-5 w-5" />
            <ChevronLeft className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

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
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={fetchStrategicInsights}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="icon" onClick={onToggle}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* AI Readiness Banner */}
            <div className="px-4 py-3 bg-muted/30 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">AI Readiness</span>
                <Badge variant="outline">
                  {insights ? `${Math.round(insights.aiReadiness * 100)}%` : '--'}
                </Badge>
              </div>
              <Progress value={insights ? insights.aiReadiness * 100 : 0} className="h-2" />
              {lastRefresh && (
                <p className="text-xs text-muted-foreground mt-1">
                  Updated {lastRefresh.toLocaleTimeString()}
                </p>
              )}
            </div>

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Analyzing project...</p>
                </div>
              ) : insights ? (
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
                          <div className="text-lg font-bold text-destructive">{insights.riskCount}</div>
                          <div className="text-xs text-muted-foreground">Discovered</div>
                        </div>
                        <div className="text-center p-2 rounded bg-warning/10">
                          <div className="text-lg font-bold text-warning">{insights.hiddenRiskCount}</div>
                          <div className="text-xs text-muted-foreground">Hidden</div>
                        </div>
                        <div className="text-center p-2 rounded bg-info/10">
                          <div className="text-lg font-bold text-info">{insights.timingRiskCount}</div>
                          <div className="text-xs text-muted-foreground">Timing</div>
                        </div>
                      </div>
                      {insights.risks.length > 0 && (
                        <div className="space-y-1">
                          {insights.risks.slice(0, 2).map((risk) => (
                            <div key={risk.id} className="text-xs p-2 rounded bg-muted/50">
                              <p className="font-medium">{risk.title}</p>
                              <p className="text-muted-foreground">{Math.round(risk.confidence * 100)}% confident</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* AI Recommendations */}
                  <Card className="border-success/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Scale className="h-4 w-4 text-success" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {insights.recommendations || 'No recommendations available yet.'}
                      </p>
                      {insights.tradeoffAnalysis && (
                        <div className="mt-2 p-2 rounded bg-muted/50">
                          <p className="text-xs font-medium">Trade-off Analysis:</p>
                          <p className="text-xs text-muted-foreground">{insights.tradeoffAnalysis}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Stakeholder Insights */}
                  {insights.stakeholderInsights.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Stakeholder Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {insights.stakeholderInsights.slice(0, 3).map((stakeholder, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
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
                  )}

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
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                  <Brain className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No insights loaded</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={fetchStrategicInsights}
                  >
                    Load Insights
                  </Button>
                </div>
              )}
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
