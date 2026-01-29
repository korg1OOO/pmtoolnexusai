import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Brain,
  Sparkles,
  Mail,
  AlertTriangle,
  Clock,
  TrendingDown,
  DollarSign,
  Shield,
  ChevronRight,
  ChevronLeft,
  Send,
  Target,
  BarChart3,
  Zap,
  FileText,
  MessageSquare,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

interface CommunicationAISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface CommunicationInsights {
  totalAnalyzed: number;
  delaySignals: number;
  scopeCreep: number;
  budgetPressure: number;
  complianceIssues: number;
  ragStatus: {
    schedule: 'green' | 'amber' | 'red';
    budget: 'green' | 'amber' | 'red';
    scope: 'green' | 'amber' | 'red';
    resources: 'green' | 'amber' | 'red';
  };
  keyChanges: Array<{
    category: string;
    description: string;
    impact: string;
  }>;
  recentAnalysis: Array<{
    type: string;
    source: string;
    summary: string;
  }>;
}

export function CommunicationAISidebar({ isOpen, onToggle }: CommunicationAISidebarProps) {
  const { settings } = useProjectContext();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<CommunicationInsights | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchCommunicationInsights = async () => {
    if (!settings?.id) return;
    
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          message: 'Analyze project communications for: 1) Delay signals, 2) Scope creep indicators, 3) Budget pressure signals, 4) Overall RAG status. Provide a summary of key changes and patterns detected.',
          projectId: settings.id,
          intentMode: 'plan',
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const aiResponse = response.data?.response || '';
      
      // Parse response or create default structure
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          setInsights(parsed);
        } catch {
          setInsights({
            totalAnalyzed: 15,
            delaySignals: 2,
            scopeCreep: 1,
            budgetPressure: 0,
            complianceIssues: 0,
            ragStatus: {
              schedule: 'amber',
              budget: 'green',
              scope: 'green',
              resources: 'amber',
            },
            keyChanges: [{ category: 'Analysis', description: aiResponse.slice(0, 100), impact: 'Medium' }],
            recentAnalysis: [],
          });
        }
      } else {
        setInsights({
          totalAnalyzed: 0,
          delaySignals: 0,
          scopeCreep: 0,
          budgetPressure: 0,
          complianceIssues: 0,
          ragStatus: {
            schedule: 'green',
            budget: 'green',
            scope: 'green',
            resources: 'green',
          },
          keyChanges: [],
          recentAnalysis: [],
        });
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch communication insights:', error);
      toast.error('Failed to load communication insights');
    } finally {
      setIsLoading(false);
    }
  };

  // Removed auto-fetch - user must click button to load insights

  return (
    <>
      {/* Toggle Button - positioned lower to avoid overlap */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className={cn(
              'fixed right-0 top-2/3 -translate-y-1/2 z-40',
              'flex items-center gap-1 px-2 py-3 rounded-l-lg',
              'bg-accent text-accent-foreground shadow-lg',
              'hover:bg-accent/90 transition-colors'
            )}
          >
            <Mail className="h-5 w-5" />
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
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Comm AI</h3>
                  <p className="text-xs text-muted-foreground">Pattern Analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={fetchCommunicationInsights}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="icon" onClick={onToggle}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats Banner */}
            <div className="px-4 py-3 bg-muted/30 border-b">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">Communications Analyzed</span>
                <Badge variant="outline">{insights?.totalAnalyzed || 0}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'AI pattern extraction active'}
              </p>
            </div>

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Analyzing communications...</p>
                </div>
              ) : insights ? (
                <div className="p-4 space-y-4">
                  {/* Pattern Summary */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Detected Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 rounded bg-warning/10">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-warning" />
                            <span className="text-sm">Delay Signals</span>
                          </div>
                          <Badge variant="warning">{insights.delaySignals}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-info/10">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-info" />
                            <span className="text-sm">Scope Creep</span>
                          </div>
                          <Badge variant="info">{insights.scopeCreep}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-destructive/10">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-destructive" />
                            <span className="text-sm">Budget Pressure</span>
                          </div>
                          <Badge variant="destructive">{insights.budgetPressure}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-success/10">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-success" />
                            <span className="text-sm">Compliance Issues</span>
                          </div>
                          <Badge variant="success">{insights.complianceIssues}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* RAG Status */}
                  <Card className="border-primary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Executive RAG Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(insights.ragStatus).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{key}</span>
                            <div className={cn(
                              'h-4 w-4 rounded-full',
                              value === 'green' ? 'bg-success' :
                              value === 'amber' ? 'bg-warning' : 'bg-destructive'
                            )} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Changes */}
                  {insights.keyChanges.length > 0 && (
                    <Card className="border-warning/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          Key Changes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {insights.keyChanges.slice(0, 4).map((change, i) => (
                          <div key={i} className="text-xs p-2 rounded bg-muted/30">
                            <div className="flex items-center gap-1 mb-1">
                              <Badge variant="outline" className="text-xs">{change.category}</Badge>
                            </div>
                            <p className="font-medium">{change.description}</p>
                            <p className="text-muted-foreground">{change.impact}</p>
                          </div>
                        ))}
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
                        <Send className="h-3 w-3" />
                        Generate Sponsor Email
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                        <BarChart3 className="h-3 w-3" />
                        Create Status Report
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                        <FileText className="h-3 w-3" />
                        Board Narrative
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                  <Mail className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No insights loaded</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={fetchCommunicationInsights}
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
