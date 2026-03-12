import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
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
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useProjectContext } from '@/contexts/ProjectContext';
import { TrackedAIService } from '@/services/trackedAIService';
import { useTasks, useDependencies } from '@/hooks/useTasks';
import { useLessonsLearned } from '@/hooks/useLessonsLearned';
import { useCalculateCriticalPath } from '@/hooks/useCriticalPath';
import { useResourceLeveling } from '@/hooks/useResourceLeveling';
import { useAutoScheduler } from '@/hooks/useAutoScheduler';
import { useResources } from '@/hooks/useResources';
import { useProjectCalendars } from '@/hooks/useCalendars';

interface PMCoachSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentView?: string;
}

export function PMCoachSidebar({ isOpen, onToggle, currentView = 'gantt' }: PMCoachSidebarProps) {
  const { settings: project } = useProjectContext();
  const projectId = project?.id || null;

  const { data: tasks = [] } = useTasks(projectId);
  const { data: dependencies = [] } = useDependencies(projectId);
  const { data: lessons = [] } = useLessonsLearned(projectId);
  const { data: resources = [] } = useResources(projectId);
  const { data: calendars = [] } = useProjectCalendars(projectId);

  const calculateCriticalPath = useCalculateCriticalPath();
  const { levelResources, isLeveling } = useResourceLeveling(projectId);
  const { scheduleProject, applySchedule, isApplying } = useAutoScheduler();

  const [activeTab, setActiveTab] = useState<'insights' | 'patterns' | 'learning'>('insights');
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant' | 'system', content: string }[]>([]);

  const projectCalendar = useMemo(() => calendars.find(c => c.is_default) || null, [calendars]);

  // Derived Insights
  const criticalTasks = useMemo(() => tasks.filter(t => t.is_critical), [tasks]);

  const slippageRisk = useMemo(() => {
    const laggingTasks = tasks.filter(t => t.total_slack && t.total_slack < 0);
    if (laggingTasks.length > 5) return 'high';
    if (laggingTasks.length > 0) return 'medium';
    return 'low';
  }, [tasks]);

  const bottlenecks = useMemo(() => {
    const successorCounts = new Map<string, number>();
    dependencies.forEach(d => {
      successorCounts.set(d.predecessor_id, (successorCounts.get(d.predecessor_id) || 0) + 1);
    });

    return Array.from(successorCounts.entries())
      .filter(([_, count]) => count >= 3)
      .map(([id, _]) => tasks.find(t => t.id === id)?.name || 'Unknown task')
      .filter(name => name !== 'Unknown task');
  }, [dependencies, tasks]);

  const negativeFloatItems = useMemo(() => {
    return tasks
      .filter(t => t.total_slack && t.total_slack < 0)
      .map(t => ({
        taskId: t.id,
        taskName: t.name,
        floatDays: Math.abs(t.total_slack || 0),
        cause: 'Dependency lag or resource constraint',
      }));
  }, [tasks]);

  const constraintViolations = useMemo(() => {
    return tasks
      .filter(t => {
        if (!t.constraint_type || !t.constraint_date) return false;
        const constraintDate = new Date(t.constraint_date);
        const startDate = new Date(t.start_date);

        if (t.constraint_type === 'MSO' && startDate.getTime() !== constraintDate.getTime()) return true;
        if (t.constraint_type === 'SNET' && startDate < constraintDate) return true;
        return false;
      })
      .map(t => ({
        constraintId: t.id,
        severity: 'warning' as 'warning' | 'critical',
        description: `Constraint violation for "${t.name}": Expected ${t.constraint_type} ${t.constraint_date}`,
        suggestedResolution: 'Run auto-scheduler to re-align dates.',
      }));
  }, [tasks]);

  const handleRecalculateCP = () => {
    if (projectId) calculateCriticalPath.mutate(projectId);
  };

  const handleLevelResources = () => {
    if (projectId && tasks.length > 0) {
      levelResources({
        tasks,
        assignments: [], // Needs proper assignment data if available
        resources,
      });
    }
  };

  const handleOptimizeSchedule = async () => {
    if (projectId && tasks.length > 0) {
      const results = await scheduleProject(
        tasks,
        dependencies,
        projectCalendar,
        [], // Exceptions
        projectId
      );
      if (results.length > 0) {
        applySchedule({ results, projectId });
      }
    }
  };

  const handleAskCoach = async (query?: string) => {
    const message = query || "Tell me how the project is doing given the current view.";
    if (!projectId) return;

    setIsAsking(true);
    toast.info('AI PM Coach is thinking...');

    // Add user message to history
    const userMsg: { role: 'user' | 'assistant' | 'system', content: string } = { role: 'user', content: message };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);

    const { data, error } = await TrackedAIService.chat(projectId, message, updatedHistory);
    setIsAsking(false);

    if (error) {
      toast.error('Coach failed: ' + error);
    } else {
      // Add assistant message to history
      const replyContent = typeof data === 'string' ? data : data?.reply || 'No response from coach';
      setChatHistory([...updatedHistory, { role: 'assistant', content: replyContent }]);
      toast.success('Coach responded');
    }
  };

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
                  onClick={() => setActiveTab(tab.id as 'insights' | 'patterns' | 'learning')}
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
                            slippageRisk === 'high' ? 'destructive' :
                              slippageRisk === 'medium' ? 'warning' : 'success'
                          }>
                            {slippageRisk}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{criticalTasks.length}</span>
                          <span className="text-muted-foreground"> tasks on critical path</span>
                        </div>

                        {criticalTasks.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-xs font-medium">Critical Tasks:</span>
                            {criticalTasks.slice(0, 3).map((task) => (
                              <div key={task.id} className="p-2 rounded bg-muted/50 text-xs">
                                <p className="font-medium">{task.name}</p>
                                <p className="text-muted-foreground mt-1">Due: {task.end_date}</p>
                              </div>
                            ))}
                          </div>
                        )}
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
                        {negativeFloatItems.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-destructive">Negative Float Detected:</span>
                            {negativeFloatItems.slice(0, 2).map((item) => (
                              <div key={item.taskId} className="mt-2 p-2 rounded bg-destructive/10 text-xs">
                                <p className="font-medium">{item.taskName}</p>
                                <p className="text-destructive">{item.floatDays} days negative float</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {bottlenecks.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-warning">Bottlenecks:</span>
                            <ul className="mt-1 space-y-1">
                              {bottlenecks.map((b, i) => (
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
                    {constraintViolations.length > 0 && (
                      <Card className="border-destructive/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            Constraint Violations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {constraintViolations.map((v) => (
                            <div key={v.constraintId} className="p-2 rounded bg-destructive/10 text-xs mb-2">
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={handleRecalculateCP}
                          disabled={calculateCriticalPath.isPending}
                        >
                          <GitBranch className="h-4 w-4" />
                          {calculateCriticalPath.isPending ? 'Calculating...' : 'Recalculate Critical Path'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={handleLevelResources}
                          disabled={isLeveling}
                        >
                          <Users className="h-4 w-4" />
                          {isLeveling ? 'Leveling...' : 'Level Resources'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={handleOptimizeSchedule}
                          disabled={isApplying}
                        >
                          <Target className="h-4 w-4" />
                          {isApplying ? 'Optimizing...' : 'Optimize Schedule'}
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
                        {slippageRisk !== 'low' && (
                          <div className="p-3 rounded-lg border">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="warning">Slippage Cluster</Badge>
                            </div>
                            <p className="text-sm mb-1">Detected a cluster of tasks with negative float.</p>
                            <p className="text-xs text-muted-foreground mb-2">Impact: Project end date delay likely.</p>
                            <div className="p-2 rounded bg-green-500/10 text-xs flex items-start gap-1">
                              <Sparkles className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                              <span>Consider resource leveling or scope reduction.</span>
                            </div>
                          </div>
                        )}
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          {slippageRisk === 'low' && "No significant patterns detected at this time."}
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
                          Lessons Learned
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {lessons.length > 0 ? (
                          <div className="space-y-3">
                            {lessons.map((lesson) => (
                              <div key={lesson.id} className="p-3 rounded-lg border">
                                <Badge variant="outline" className="mb-2">{lesson.category}</Badge>
                                <p className="text-sm font-medium">{lesson.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">Impact: {lesson.impact_level}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No lessons learned recorded for this project yet.
                          </div>
                        )}
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
                            "Why is my critical path shifting?"
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start text-xs h-auto py-2">
                            "How do I fix this negative float?"
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
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={() => handleAskCoach()}
                disabled={isAsking}
              >
                {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Ask AI Coach
              </Button>
            </div>

            {/* Simple Chat Overlay if history exists */}
            {chatHistory.length > 0 && (
              <div className="absolute bottom-16 left-4 right-4 max-h-96 bg-card border rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden">
                <div className="p-2 border-b bg-muted/50 flex items-center justify-between">
                  <span className="text-xs font-semibold">Coach Conversation</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setChatHistory([])}>
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={cn(
                        "p-2 rounded-lg text-xs leading-relaxed",
                        msg.role === 'user' ? "bg-primary/5 ml-4" : "bg-muted mr-4"
                      )}>
                        <p className="font-semibold mb-1 capitalize">{msg.role}:</p>
                        <p>{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
