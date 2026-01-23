import React from 'react';
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
  Users,
  Target,
  BarChart3,
  Zap,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { mockCommunicationIngests, mockExecutiveStatus } from '@/data/aiMockData';

interface CommunicationAISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function CommunicationAISidebar({ isOpen, onToggle }: CommunicationAISidebarProps) {
  const communications = mockCommunicationIngests;
  const status = mockExecutiveStatus;

  // Aggregate pattern stats
  const totalDelaySignals = communications.reduce((acc, c) => acc + c.aiAnalysis.delaySignals.length, 0);
  const totalScopeCreep = communications.reduce((acc, c) => acc + c.aiAnalysis.scopeCreepIndicators.length, 0);
  const totalBudgetPressure = communications.reduce((acc, c) => acc + c.aiAnalysis.budgetPressureSignals.length, 0);

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
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Comm AI</h3>
                  <p className="text-xs text-muted-foreground">Pattern Analysis</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Stats Banner */}
            <div className="px-4 py-3 bg-muted/30 border-b">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">Communications Analyzed</span>
                <Badge variant="outline">{communications.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">AI pattern extraction active</p>
            </div>

            <ScrollArea className="flex-1">
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
                        <Badge variant="warning">{totalDelaySignals}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-info/10">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-info" />
                          <span className="text-sm">Scope Creep</span>
                        </div>
                        <Badge variant="info">{totalScopeCreep}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-destructive/10">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-destructive" />
                          <span className="text-sm">Budget Pressure</span>
                        </div>
                        <Badge variant="destructive">{totalBudgetPressure}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-success/10">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-success" />
                          <span className="text-sm">Compliance Issues</span>
                        </div>
                        <Badge variant="success">0</Badge>
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
                      <div className="flex items-center justify-between text-sm">
                        <span>Schedule</span>
                        <div className={cn(
                          'h-4 w-4 rounded-full',
                          status.ragStatus.schedule === 'green' ? 'bg-success' :
                          status.ragStatus.schedule === 'amber' ? 'bg-warning' : 'bg-destructive'
                        )} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Budget</span>
                        <div className={cn(
                          'h-4 w-4 rounded-full',
                          status.ragStatus.budget === 'green' ? 'bg-success' :
                          status.ragStatus.budget === 'amber' ? 'bg-warning' : 'bg-destructive'
                        )} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Scope</span>
                        <div className={cn(
                          'h-4 w-4 rounded-full',
                          status.ragStatus.scope === 'green' ? 'bg-success' :
                          status.ragStatus.scope === 'amber' ? 'bg-warning' : 'bg-destructive'
                        )} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Resources</span>
                        <div className={cn(
                          'h-4 w-4 rounded-full',
                          status.ragStatus.resources === 'green' ? 'bg-success' :
                          status.ragStatus.resources === 'amber' ? 'bg-warning' : 'bg-destructive'
                        )} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Changes */}
                <Card className="border-warning/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      Key Changes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {status.keyChanges.length > 0 ? (
                      status.keyChanges.slice(0, 4).map((change, i) => (
                        <div key={i} className="text-xs p-2 rounded bg-muted/30">
                          <div className="flex items-center gap-1 mb-1">
                            <Badge variant="outline" className="text-xs">{change.category}</Badge>
                          </div>
                          <p className="font-medium">{change.description}</p>
                          <p className="text-muted-foreground">{change.impact}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No recent changes</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Communications */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Recent Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {communications.slice(0, 3).map((comm) => (
                        <div key={comm.id} className="text-xs p-2 rounded bg-muted/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{comm.type}</Badge>
                            <span className="text-muted-foreground">{comm.source}</span>
                          </div>
                          <p className="text-muted-foreground line-clamp-1">{comm.content.slice(0, 60)}...</p>
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
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
