import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Brain,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Target,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  GitBranch,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Play,
  FileText,
  Video,
  BarChart3,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { mockPMCoachContext } from '@/data/aiMockData';

interface PMCoachSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentView?: string;
}

export function PMCoachSidebar({ isOpen, onToggle, currentView = 'gantt' }: PMCoachSidebarProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'patterns' | 'learning'>('insights');
  const coachContext = mockPMCoachContext;

  const getLevelIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'interactive':
        return <Play className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

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
            className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-40 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">AI PM Coach</h3>
                  <p className="text-xs text-muted-foreground">Context-aware assistance</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Context Banner */}
            <div className="px-4 py-2 bg-muted/30 border-b">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {currentView}
                </Badge>
                <span className="text-muted-foreground">Active context</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {[
                { id: 'insights', icon: Lightbulb, label: 'Insights' },
                { id: 'patterns', icon: TrendingUp, label: 'Patterns' },
                { id: 'learning', icon: BookOpen, label: 'Learning' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 py-3 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {activeTab === 'insights' && (
                  <>
                    {/* Critical Path Insight */}
                    <Card className="border-primary/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-primary" />
                          Critical Path Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Slippage Risk</span>
                          <Badge variant={
                            coachContext.projectData.criticalPath.slippageRisk === 'high' ? 'destructive' :
                            coachContext.projectData.criticalPath.slippageRisk === 'medium' ? 'warning' : 'success'
                          }>
                            {coachContext.projectData.criticalPath.slippageRisk}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{coachContext.projectData.criticalPath.tasks.length}</span>
                          <span className="text-muted-foreground"> tasks on critical path</span>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="text-xs font-medium">Recent Changes:</span>
                          {coachContext.projectData.criticalPath.recentChanges.map((change, i) => (
                            <div key={i} className="p-2 rounded bg-muted/50 text-xs">
                              <p className="font-medium">{change.change}</p>
                              <p className="text-muted-foreground mt-1">Cause: {change.cause}</p>
                              <p className="text-primary mt-1">Impact: {change.impact}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dependency Issues */}
                    <Card className="border-warning/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          Dependency Issues
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {coachContext.projectData.dependencies.negativeFloat.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-destructive">Negative Float Detected:</span>
                            {coachContext.projectData.dependencies.negativeFloat.map((item) => (
                              <div key={item.taskId} className="mt-2 p-2 rounded bg-destructive/10 text-xs">
                                <p className="font-medium">{item.taskName}</p>
                                <p className="text-destructive">{item.floatDays} days negative float</p>
                                <p className="text-muted-foreground mt-1">Cause: {item.cause}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {coachContext.projectData.dependencies.bottlenecks.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-warning">Bottlenecks:</span>
                            <ul className="mt-1 space-y-1">
                              {coachContext.projectData.dependencies.bottlenecks.map((b, i) => (
                                <li key={i} className="text-xs flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Constraint Violations */}
                    {coachContext.projectData.constraints.violations.length > 0 && (
                      <Card className="border-destructive/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            Constraint Violations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {coachContext.projectData.constraints.violations.map((v) => (
                            <div key={v.constraintId} className="p-2 rounded bg-destructive/10 text-xs">
                              <Badge variant={v.severity === 'critical' ? 'destructive' : 'warning'} className="mb-1">
                                {v.severity}
                              </Badge>
                              <p>{v.description}</p>
                              <p className="text-success mt-2">
                                <Sparkles className="h-3 w-3 inline mr-1" />
                                {v.suggestedResolution}
                              </p>
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
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                          <GitBranch className="h-4 w-4" />
                          Recalculate Critical Path
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                          <Users className="h-4 w-4" />
                          Level Resources
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                          <Target className="h-4 w-4" />
                          Optimize Schedule
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}

                {activeTab === 'patterns' && (
                  <>
                    {/* Detected Patterns */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Detected Patterns
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {coachContext.projectData.patterns.map((pattern, i) => (
                          <div key={i} className="p-3 rounded-lg border">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={
                                pattern.type === 'slippage' ? 'warning' :
                                pattern.type === 'estimation-error' ? 'destructive' : 'secondary'
                              }>
                                {pattern.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {pattern.frequency} occurrences
                              </span>
                            </div>
                            <p className="text-sm mb-1">{pattern.description}</p>
                            <p className="text-xs text-muted-foreground mb-2">Impact: {pattern.impact}</p>
                            <div className="p-2 rounded bg-success/10 text-xs flex items-start gap-1">
                              <Sparkles className="h-3 w-3 text-success mt-0.5 shrink-0" />
                              <span>{pattern.recommendation}</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Common Mistakes */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          Common Mistakes Detected
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {coachContext.commonMistakes.map((mistake) => (
                          <div key={mistake.id} className="p-3 rounded-lg border border-warning/30 bg-warning/5">
                            <Badge variant="outline" className="mb-2">{mistake.category}</Badge>
                            <p className="text-sm font-medium mb-1">{mistake.description}</p>
                            <p className="text-xs text-muted-foreground mb-2">
                              Detected: {mistake.detection}
                            </p>
                            <div className="space-y-1 text-xs">
                              <p className="text-success">
                                <CheckCircle2 className="h-3 w-3 inline mr-1" />
                                Fix: {mistake.correction}
                              </p>
                              <p className="text-info">
                                <Lightbulb className="h-3 w-3 inline mr-1" />
                                Prevent: {mistake.prevention}
                              </p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Recent Actions */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Your Recent Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {coachContext.recentActions.map((action, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/30">
                              <span className="text-muted-foreground shrink-0">{action.timestamp.split(' ')[1]}</span>
                              <div>
                                <p>{action.action}</p>
                                <p className="text-muted-foreground">{action.context}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {activeTab === 'learning' && (
                  <>
                    {/* Learning Progress */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          Your Learning Journey
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium capitalize">
                              {coachContext.learningPath.currentLevel}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {coachContext.learningPath.completedModules.length} modules completed
                            </span>
                          </div>
                          <Progress value={
                            coachContext.learningPath.currentLevel === 'beginner' ? 25 :
                            coachContext.learningPath.currentLevel === 'intermediate' ? 50 :
                            coachContext.learningPath.currentLevel === 'advanced' ? 75 : 100
                          } />
                        </div>

                        <div>
                          <span className="text-xs font-medium">Completed:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {coachContext.learningPath.completedModules.map((m, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {m}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommended Learning */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Recommended For You
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {coachContext.learningPath.nextRecommendations.map((rec) => (
                          <motion.div
                            key={rec.id}
                            whileHover={{ scale: 1.02 }}
                            className="p-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                {getLevelIcon(rec.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium">{rec.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Badge variant="outline" className="text-xs">{rec.type}</Badge>
                                  <span>{rec.duration} min</span>
                                </div>
                                <p className="text-xs text-primary mt-2">{rec.relevance}</p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Tool Translation */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          Ask PM Coach
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">
                          Get context-aware help with your project plan
                        </p>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-auto py-2">
                            "Why is my critical path shifting every week?"
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-auto py-2">
                            "How do I fix this negative float?"
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-auto py-2">
                            "Compare to MS Project baseline"
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/20">
              <Button className="w-full gap-2" size="sm">
                <MessageSquare className="h-4 w-4" />
                Ask AI Coach
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
