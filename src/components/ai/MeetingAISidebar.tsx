import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Brain,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  Users,
  FileText,
  Calendar,
  Zap,
  RefreshCw,
  Loader2,
  GitBranch,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AIEnhancedMeeting } from '@/types/ai-pm';

interface MeetingAISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  meeting?: AIEnhancedMeeting | null;
}

interface MeetingInsights {
  summary: string;
  confidence: number;
  decisionsCount: number;
  actionsCount: number;
  risksCount: number;
  scopeChangesCount: number;
  overdueActions: Array<{ title: string }>;
  repeatDeferrals: Array<{ title: string }>;
  decisionDebt: Array<{ description: string }>;
  stakeholderRoles: Array<{ name: string; role: string }>;
}

export function MeetingAISidebar({ isOpen, onToggle, meeting }: MeetingAISidebarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<MeetingInsights | null>(null);

  const fetchMeetingInsights = async () => {
    if (!meeting) return;

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          message: `Analyze the meeting "${meeting.title}" and provide: 1) AI summary, 2) Key decisions count, 3) Action items count, 4) Risks identified, 5) Overdue actions, 6) Stakeholder roles analysis. Meeting purpose: ${meeting.purpose?.description || 'General'}.`,
          projectId: meeting.id, // Use meeting ID as fallback
          intentMode: 'plan',
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const aiResponse = response.data?.response || '';

      // Use meeting data combined with AI response
      setInsights({
        summary: aiResponse || meeting.aiIntelligence?.summary || 'Meeting analysis pending.',
        confidence: meeting.aiIntelligence?.confidence || 0.7,
        decisionsCount: meeting.aiIntelligence?.decisions?.length || 0,
        actionsCount: meeting.aiIntelligence?.actionItems?.length || 0,
        risksCount: meeting.aiIntelligence?.risksIdentified?.length || 0,
        scopeChangesCount: meeting.aiIntelligence?.scopeChanges?.length || 0,
        overdueActions: meeting.followUpStatus?.overdueActions?.map(a => ({ title: a.title })) || [],
        repeatDeferrals: meeting.followUpStatus?.repeatDeferrals?.map(r => ({ title: r.title })) || [],
        decisionDebt: meeting.followUpStatus?.decisionDebt?.map(d => ({ description: d.description })) || [],
        stakeholderRoles: meeting.stakeholderRoles?.slice(0, 4).map(s => ({ name: s.name, role: s.role })) || [],
      });
    } catch (error) {
      console.error('Failed to fetch meeting insights:', error);
      // Fall back to meeting data if AI call fails
      if (meeting.aiIntelligence) {
        setInsights({
          summary: meeting.aiIntelligence.summary || 'Analysis available from meeting data.',
          confidence: meeting.aiIntelligence.confidence || 0.5,
          decisionsCount: meeting.aiIntelligence.decisions?.length || 0,
          actionsCount: meeting.aiIntelligence.actionItems?.length || 0,
          risksCount: meeting.aiIntelligence.risksIdentified?.length || 0,
          scopeChangesCount: meeting.aiIntelligence.scopeChanges?.length || 0,
          overdueActions: meeting.followUpStatus?.overdueActions?.map(a => ({ title: a.title })) || [],
          repeatDeferrals: meeting.followUpStatus?.repeatDeferrals?.map(r => ({ title: r.title })) || [],
          decisionDebt: meeting.followUpStatus?.decisionDebt?.map(d => ({ description: d.description })) || [],
          stakeholderRoles: meeting.stakeholderRoles?.slice(0, 4).map(s => ({ name: s.name, role: s.role })) || [],
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Removed auto-fetch - user must click button to load insights

  // Reset insights when meeting changes
  useEffect(() => {
    setInsights(null);
  }, [meeting?.id]);

  return (
    <>
      {/* Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 z-40',
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
            className="absolute right-0 top-0 h-full w-80 bg-background border-l shadow-xl z-40 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Meeting AI</h3>
                  <p className="text-xs text-muted-foreground">Intelligence Panel</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {meeting && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchMeetingInsights}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onToggle}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {!meeting ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a meeting to see AI insights</p>
                  </div>
                ) : isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Analyzing meeting...</p>
                  </div>
                ) : insights ? (
                  <>
                    {/* Meeting Context */}
                    <Card className="border-primary/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          Meeting Context
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Purpose</span>
                          <Badge variant="secondary">{meeting.purpose?.type || 'General'}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Capture Mode</span>
                          <Badge variant={meeting.captureConfidence === 'high' ? 'success' : 'warning'}>
                            {meeting.captureMode?.mode || 'Standard'}
                          </Badge>
                        </div>
                        <div className="text-xs p-2 rounded bg-muted/50">
                          <p className="font-medium mb-1">AI Confidence</p>
                          <Progress value={insights.confidence * 100} className="h-2" />
                          <p className="text-muted-foreground mt-1">{Math.round(insights.confidence * 100)}% extraction confidence</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI Summary */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          AI Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">{insights.summary}</p>
                      </CardContent>
                    </Card>

                    {/* Extracted Intelligence Summary */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Extraction Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <div className="text-lg font-bold text-primary">{insights.decisionsCount}</div>
                            <div className="text-xs text-muted-foreground">Decisions</div>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <div className="text-lg font-bold text-success">{insights.actionsCount}</div>
                            <div className="text-xs text-muted-foreground">Actions</div>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <div className="text-lg font-bold text-warning">{insights.risksCount}</div>
                            <div className="text-xs text-muted-foreground">Risks</div>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <div className="text-lg font-bold text-info">{insights.scopeChangesCount}</div>
                            <div className="text-xs text-muted-foreground">Scope Changes</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Follow-up Status */}
                    {(insights.overdueActions.length > 0 || insights.repeatDeferrals.length > 0 || insights.decisionDebt.length > 0) && (
                      <Card className="border-warning/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-warning" />
                            Follow-up Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {insights.overdueActions.length > 0 && (
                            <div className="p-2 rounded bg-destructive/10 text-xs">
                              <div className="flex items-center gap-1 text-destructive font-medium mb-1">
                                <AlertTriangle className="h-3 w-3" />
                                {insights.overdueActions.length} Overdue Actions
                              </div>
                              {insights.overdueActions.slice(0, 2).map((action, i) => (
                                <p key={i} className="text-muted-foreground">• {action.title}</p>
                              ))}
                            </div>
                          )}
                          {insights.repeatDeferrals.length > 0 && (
                            <div className="p-2 rounded bg-warning/10 text-xs">
                              <div className="flex items-center gap-1 text-warning font-medium mb-1">
                                <RefreshCw className="h-3 w-3" />
                                {insights.repeatDeferrals.length} Repeat Deferrals
                              </div>
                            </div>
                          )}
                          {insights.decisionDebt.length > 0 && (
                            <div className="p-2 rounded bg-info/10 text-xs">
                              <div className="flex items-center gap-1 text-info font-medium mb-1">
                                <GitBranch className="h-3 w-3" />
                                {insights.decisionDebt.length} Decision Debt Items
                              </div>
                              {insights.decisionDebt.slice(0, 2).map((debt, i) => (
                                <p key={i} className="text-muted-foreground">• {debt.description}</p>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Stakeholder Participation */}
                    {insights.stakeholderRoles.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Stakeholder Roles
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {insights.stakeholderRoles.map((role, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                                <span className="font-medium">{role.name}</span>
                                <Badge variant="outline" className="text-xs">{role.role}</Badge>
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
                          <FileText className="h-3 w-3" />
                          Generate MoM
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                          <RefreshCw className="h-3 w-3" />
                          Re-extract Intelligence
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                          <Calendar className="h-3 w-3" />
                          Schedule Follow-up
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Button variant="outline" onClick={fetchMeetingInsights}>
                      Load AI Insights
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
