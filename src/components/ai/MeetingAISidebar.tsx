import React from 'react';
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
  Lightbulb,
  GitBranch,
  Users,
  FileText,
  Calendar,
  Shield,
  Zap,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import type { AIEnhancedMeeting } from '@/types/ai-pm';

interface MeetingAISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  meeting?: AIEnhancedMeeting | null;
}

export function MeetingAISidebar({ isOpen, onToggle, meeting }: MeetingAISidebarProps) {
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
                  <h3 className="font-semibold text-sm">Meeting AI</h3>
                  <p className="text-xs text-muted-foreground">Intelligence Panel</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {meeting ? (
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
                          <Badge variant="secondary">{meeting.purpose.type}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Capture Mode</span>
                          <Badge variant={meeting.captureConfidence === 'high' ? 'success' : 'warning'}>
                            {meeting.captureMode.mode}
                          </Badge>
                        </div>
                        <div className="text-xs p-2 rounded bg-muted/50">
                          <p className="font-medium mb-1">AI Confidence</p>
                          <Progress value={meeting.aiIntelligence.confidence * 100} className="h-2" />
                          <p className="text-muted-foreground mt-1">{(meeting.aiIntelligence.confidence * 100).toFixed(0)}% extraction confidence</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Extracted Intelligence Summary */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          AI Extraction Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <div className="text-lg font-bold text-primary">{meeting.aiIntelligence.decisions.length}</div>
                            <div className="text-xs text-muted-foreground">Decisions</div>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <div className="text-lg font-bold text-success">{meeting.aiIntelligence.actionItems.length}</div>
                            <div className="text-xs text-muted-foreground">Actions</div>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <div className="text-lg font-bold text-warning">{meeting.aiIntelligence.risksIdentified.length}</div>
                            <div className="text-xs text-muted-foreground">Risks</div>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <div className="text-lg font-bold text-info">{meeting.aiIntelligence.scopeChanges.length}</div>
                            <div className="text-xs text-muted-foreground">Scope Changes</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Follow-up Status */}
                    <Card className="border-warning/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4 text-warning" />
                          Follow-up Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {meeting.followUpStatus.overdueActions.length > 0 && (
                          <div className="p-2 rounded bg-destructive/10 text-xs">
                            <div className="flex items-center gap-1 text-destructive font-medium mb-1">
                              <AlertTriangle className="h-3 w-3" />
                              {meeting.followUpStatus.overdueActions.length} Overdue Actions
                            </div>
                            {meeting.followUpStatus.overdueActions.slice(0, 2).map((action, i) => (
                              <p key={i} className="text-muted-foreground">• {action.title}</p>
                            ))}
                          </div>
                        )}
                        {meeting.followUpStatus.repeatDeferrals.length > 0 && (
                          <div className="p-2 rounded bg-warning/10 text-xs">
                            <div className="flex items-center gap-1 text-warning font-medium mb-1">
                              <RefreshCw className="h-3 w-3" />
                              {meeting.followUpStatus.repeatDeferrals.length} Repeat Deferrals
                            </div>
                          </div>
                        )}
                        {meeting.followUpStatus.decisionDebt.length > 0 && (
                          <div className="p-2 rounded bg-info/10 text-xs">
                            <div className="flex items-center gap-1 text-info font-medium mb-1">
                              <GitBranch className="h-3 w-3" />
                              {meeting.followUpStatus.decisionDebt.length} Decision Debt Items
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Stakeholder Participation */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Stakeholder Roles
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {meeting.stakeholderRoles.slice(0, 4).map((role) => (
                            <div key={role.participantId} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                              <span className="font-medium">{role.name}</span>
                              <Badge variant="outline" className="text-xs">{role.role}</Badge>
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
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a meeting to see AI insights</p>
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
