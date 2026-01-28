import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Video,
  Users,
  MapPin,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Target,
  Sparkles,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  Monitor,
  PhoneOff,
  Hand,
  FileText,
  Download,
  Eye,
  EyeOff,
  CircleDot,
  ArrowUpRight,
  GitBranch,
  Zap,
  MessageSquare,
  RefreshCw,
  Send,
  Shield,
  Timer,
  Wifi,
  WifiOff,
  Volume2,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockAIMeetings, mockMoMTemplates } from '@/data/aiMockData';
import { MeetingAISidebar } from '@/components/ai/MeetingAISidebar';
import { LinkDialog, LinkableItem } from '@/components/linking/LinkDialog';
import type { AIEnhancedMeeting } from '@/types/ai-pm';

export function EnhancedMeetingsView() {
  const [selectedMeeting, setSelectedMeeting] = useState<AIEnhancedMeeting | null>(mockAIMeetings[0]);
  const [notes, setNotes] = useState('');
  const [showMoM, setShowMoM] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(mockMoMTemplates[0]);
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingAction, setLinkingAction] = useState<{ id: string; title: string } | null>(null);

  const handleOpenLinkDialog = (actionId: string, actionTitle: string) => {
    setLinkingAction({ id: actionId, title: actionTitle });
    setLinkDialogOpen(true);
  };

  const handleLinkItems = (items: LinkableItem[]) => {
    console.log('Linked items to action:', items);
    // In real app, save the links
  };

  const getCaptureIcon = (mode: string) => {
    switch (mode) {
      case 'live-transcription':
        return <Wifi className="h-4 w-4 text-success animate-pulse" />;
      case 'post-meeting':
        return <Timer className="h-4 w-4 text-info" />;
      case 'manual-entry':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      default:
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      teams: 'bg-[#6264a7] text-white',
      zoom: 'bg-[#2d8cff] text-white',
      meet: 'bg-[#00897b] text-white',
      audio: 'bg-muted text-muted-foreground',
      manual: 'bg-muted text-muted-foreground',
    };
    return colors[source] || 'bg-muted text-muted-foreground';
  };

  const getDecisionTypeColor = (type: string) => {
    switch (type) {
      case 'irreversible':
        return 'destructive';
      case 'reversible':
        return 'success';
      case 'temporary':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <MeetingAISidebar 
        isOpen={showAISidebar} 
        onToggle={() => setShowAISidebar(!showAISidebar)} 
        meeting={selectedMeeting}
      />
      <div className={cn("flex h-full transition-all duration-300", showAISidebar && "mr-80")}>
      {/* Meeting List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">AI-Enhanced Meetings</h2>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Meetings with AI intelligence extraction</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {mockAIMeetings.map((meeting) => (
              <motion.div
                key={meeting.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedMeeting(meeting)}
                className={cn(
                  'p-3 rounded-lg border cursor-pointer transition-all',
                  selectedMeeting?.id === meeting.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center bg-muted rounded-lg p-2 min-w-[45px]">
                    <span className="text-xs text-muted-foreground">
                      {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold">{new Date(meeting.date).getDate()}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{meeting.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Clock className="h-3 w-3" />
                      {meeting.startTime}
                      <span className={cn('px-1.5 py-0.5 rounded text-xs', getSourceBadge(meeting.sourceType))}>
                        {meeting.sourceType}
                      </span>
                    </div>

                    {/* Capture Mode Indicator */}
                    <div className="flex items-center gap-2">
                      {getCaptureIcon(meeting.captureMode.mode)}
                      <Badge variant={
                        meeting.captureConfidence === 'high' ? 'success' :
                        meeting.captureConfidence === 'medium' ? 'warning' : 'destructive'
                      } className="text-xs">
                        {meeting.captureConfidence} confidence
                      </Badge>
                    </div>

                    {/* AI Extraction Summary */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {meeting.aiIntelligence.decisions.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {meeting.aiIntelligence.actionItems.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {meeting.aiIntelligence.risksIdentified.length}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Meeting Details */}
      {selectedMeeting && (
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{selectedMeeting.title}</h1>
                    <Badge variant={selectedMeeting.purpose.type === 'decision' ? 'destructive' : 'secondary'}>
                      {selectedMeeting.purpose.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedMeeting.startTime} - {selectedMeeting.endTime}
                    </span>
                    <span className={cn('px-2 py-0.5 rounded text-xs', getSourceBadge(selectedMeeting.sourceType))}>
                      {selectedMeeting.sourceType.toUpperCase()}
                    </span>
                    {getCaptureIcon(selectedMeeting.captureMode.mode)}
                    <span className="text-xs">{selectedMeeting.captureMode.mode}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowMoM(!showMoM)}>
                    <FileText className="h-4 w-4 mr-2" />
                    {showMoM ? 'Hide MoM' : 'Generate MoM'}
                  </Button>
                  <Button variant="glow">
                    <Video className="h-4 w-4 mr-2" />
                    Join
                  </Button>
                </div>
              </div>

              {/* Meeting Purpose */}
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Meeting Purpose
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{selectedMeeting.purpose.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Expected Outcomes</span>
                      <ul className="mt-1 space-y-1">
                        {selectedMeeting.purpose.expectedOutcomes.map((o, i) => (
                          <li key={i} className="text-sm flex items-center gap-1">
                            <CircleDot className="h-3 w-3 text-primary" />
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Success Criteria</span>
                      <ul className="mt-1 space-y-1">
                        {selectedMeeting.purpose.successCriteria.map((c, i) => (
                          <li key={i} className="text-sm flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-success" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Decision Scope */}
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Decision Scope
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <Badge variant="outline" className="mb-1">{selectedMeeting.decisionScope.type}</Badge>
                      <p className="text-xs text-muted-foreground">Scope Type</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <span className="text-lg font-semibold">
                        {selectedMeeting.decisionScope.budgetAuthority 
                          ? `$${(selectedMeeting.decisionScope.budgetAuthority / 1000).toFixed(0)}K` 
                          : 'N/A'}
                      </span>
                      <p className="text-xs text-muted-foreground">Budget Authority</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <span className="text-lg font-semibold">{selectedMeeting.decisionScope.requiredQuorum}</span>
                      <p className="text-xs text-muted-foreground">Required Quorum</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="flex justify-center gap-2 mb-1">
                        <Badge variant={selectedMeeting.decisionScope.resourceAuthority ? 'success' : 'secondary'}>
                          Resources
                        </Badge>
                        <Badge variant={selectedMeeting.decisionScope.scopeChangeAuthority ? 'success' : 'secondary'}>
                          Scope
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Authority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Tabs */}
              <Tabs defaultValue="intelligence" className="mt-6">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="intelligence">AI Intelligence</TabsTrigger>
                  <TabsTrigger value="decisions">Decisions</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                  <TabsTrigger value="risks">Risks</TabsTrigger>
                  <TabsTrigger value="follow-up">Follow-up</TabsTrigger>
                </TabsList>

                {/* AI Intelligence Tab */}
                <TabsContent value="intelligence" className="mt-4 space-y-4">
                  {/* Summary */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI-Generated Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedMeeting.aiIntelligence.summary}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline">{selectedMeeting.aiIntelligence.confidence * 100}% confidence</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Topics */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Key Topics Discussed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedMeeting.aiIntelligence.keyTopics.map((topic, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                            <div className="flex-1">
                              <span className="font-medium text-sm">{topic.topic}</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{topic.duration} min</span>
                                <span>•</span>
                                <span>{topic.participants.join(', ')}</span>
                              </div>
                            </div>
                            <Badge variant={
                              topic.sentiment === 'positive' ? 'success' :
                              topic.sentiment === 'negative' ? 'destructive' :
                              topic.sentiment === 'mixed' ? 'warning' : 'secondary'
                            }>
                              {topic.sentiment}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sentiment Analysis */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Sentiment Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Overall Sentiment</span>
                            <Badge variant={
                              selectedMeeting.aiIntelligence.sentimentAnalysis.overall === 'positive' ? 'success' :
                              selectedMeeting.aiIntelligence.sentimentAnalysis.overall === 'negative' ? 'destructive' : 'secondary'
                            }>
                              {selectedMeeting.aiIntelligence.sentimentAnalysis.overall}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">Engagement:</span>
                            <Progress value={selectedMeeting.aiIntelligence.sentimentAnalysis.engagement * 100} className="flex-1" />
                            <span className="text-xs">{Math.round(selectedMeeting.aiIntelligence.sentimentAnalysis.engagement * 100)}%</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-xs font-medium text-success">Positives:</span>
                            <ul className="mt-1 space-y-1">
                              {selectedMeeting.aiIntelligence.sentimentAnalysis.positives.map((p, i) => (
                                <li key={i} className="text-xs flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-success" />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-warning">Concerns:</span>
                            <ul className="mt-1 space-y-1">
                              {selectedMeeting.aiIntelligence.sentimentAnalysis.concerns.map((c, i) => (
                                <li key={i} className="text-xs flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-warning" />
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scope Changes */}
                  {selectedMeeting.aiIntelligence.scopeChanges.length > 0 && (
                    <Card className="border-warning/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4 text-warning" />
                          Scope Changes Detected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedMeeting.aiIntelligence.scopeChanges.map((change) => (
                            <div key={change.id} className="p-3 rounded-lg border border-warning/30 bg-warning/5">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={change.type === 'addition' ? 'success' : change.type === 'removal' ? 'destructive' : 'warning'}>
                                  {change.type}
                                </Badge>
                                <Badge variant={change.magnitude === 'major' ? 'destructive' : 'secondary'}>
                                  {change.magnitude}
                                </Badge>
                                {change.requiresApproval && (
                                  <Badge variant="warning">Requires Approval</Badge>
                                )}
                              </div>
                              <p className="text-sm">{change.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">Impact: {change.impact}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Conflicts */}
                  {selectedMeeting.aiIntelligence.conflicts.length > 0 && (
                    <Card className="border-destructive/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          Conflicts Detected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedMeeting.aiIntelligence.conflicts.map((conflict) => (
                            <div key={conflict.id} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={conflict.severity === 'high' ? 'destructive' : 'warning'}>
                                  {conflict.severity}
                                </Badge>
                                <Badge variant="outline">{conflict.type}</Badge>
                              </div>
                              <p className="text-sm">{conflict.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">Parties: {conflict.parties.join(', ')}</p>
                              <p className="text-xs text-success mt-2">
                                <Sparkles className="h-3 w-3 inline mr-1" />
                                Resolution: {conflict.suggestedResolution}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Decisions Tab */}
                <TabsContent value="decisions" className="mt-4">
                  <div className="space-y-3">
                    {selectedMeeting.aiIntelligence.decisions.map((decision) => (
                      <Card key={decision.id} className={cn(
                        decision.type === 'irreversible' ? 'border-destructive/30' : ''
                      )}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                              decision.type === 'irreversible' ? 'bg-destructive/10' : 'bg-primary/10'
                            )}>
                              <Target className={cn(
                                'h-5 w-5',
                                decision.type === 'irreversible' ? 'text-destructive' : 'text-primary'
                              )} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={getDecisionTypeColor(decision.type) as any}>
                                  {decision.type}
                                </Badge>
                                <Badge variant={
                                  decision.impact === 'high' ? 'destructive' :
                                  decision.impact === 'medium' ? 'warning' : 'secondary'
                                }>
                                  {decision.impact} impact
                                </Badge>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {decision.confidence * 100}% confident
                                </span>
                              </div>
                              <p className="font-medium">{decision.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Made by: {decision.madeBy}</span>
                                <span>Approved by: {decision.approvedBy.join(', ')}</span>
                                <span>@ {decision.timestamp}</span>
                              </div>
                              {decision.linkedRisks.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <AlertTriangle className="h-3 w-3 text-warning" />
                                  <span className="text-xs text-warning">
                                    Linked risks: {decision.linkedRisks.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Decision
                    </Button>
                  </div>
                </TabsContent>

                {/* Actions Tab */}
                <TabsContent value="actions" className="mt-4">
                  <div className="space-y-3">
                    {selectedMeeting.aiIntelligence.actionItems.map((action) => (
                      <Card key={action.id} className="group">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{action.title}</span>
                                <Badge variant={action.source === 'explicit' ? 'success' : 'secondary'}>
                                  {action.source}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Owner: {action.owner}</span>
                                <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                              </div>
                              {action.dependencies.length > 0 && (
                                <div className="flex items-center gap-1 mt-2 text-xs">
                                  <GitBranch className="h-3 w-3" />
                                  <span>Depends on: {action.dependencies.join(', ')}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="iconXs"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleOpenLinkDialog(action.id, action.title)}
                              >
                                <Link2 className="h-3 w-3" />
                              </Button>
                              <Badge variant={action.priority as any}>{action.priority}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Action Item
                    </Button>
                  </div>
                </TabsContent>

                {/* Risks Tab */}
                <TabsContent value="risks" className="mt-4">
                  <div className="space-y-3">
                    {selectedMeeting.aiIntelligence.risksIdentified.map((risk) => (
                      <Card key={risk.id} className="border-warning/30">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{risk.title}</span>
                                <Badge variant="outline">{risk.category}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">P: {risk.probability}</Badge>
                                <Badge variant="secondary">I: {risk.impact}</Badge>
                                <Badge variant={risk.source === 'explicit' ? 'success' : 'warning'}>
                                  {risk.source}
                                </Badge>
                              </div>
                              <div className="p-2 rounded bg-success/10 text-xs">
                                <Sparkles className="h-3 w-3 inline mr-1 text-success" />
                                Suggested mitigation: {risk.suggestedMitigation}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Follow-up Tab */}
                <TabsContent value="follow-up" className="mt-4 space-y-4">
                  {/* Progress */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Action Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Progress 
                          value={(selectedMeeting.followUpStatus.completedActions / selectedMeeting.followUpStatus.totalActions) * 100} 
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {selectedMeeting.followUpStatus.completedActions} / {selectedMeeting.followUpStatus.totalActions}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Decision Debt */}
                  {selectedMeeting.followUpStatus.decisionDebt.length > 0 && (
                    <Card className="border-warning/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          Decision Debt
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedMeeting.followUpStatus.decisionDebt.map((debt) => (
                            <div key={debt.id} className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                              <p className="font-medium text-sm">{debt.description}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span>Pending since: {debt.pendingSince}</span>
                                <Badge variant={
                                  debt.impact === 'blocking' ? 'destructive' :
                                  debt.impact === 'delaying' ? 'warning' : 'secondary'
                                }>
                                  {debt.impact}
                                </Badge>
                              </div>
                              {debt.blockedItems.length > 0 && (
                                <p className="text-xs text-destructive mt-1">
                                  Blocking: {debt.blockedItems.join(', ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Next Steps */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Next Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedMeeting.aiIntelligence.nextSteps.map((step, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CircleDot className="h-4 w-4 text-primary" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* AI Panel / MoM Panel */}
          <div className={cn(
            'w-96 border-l overflow-y-auto transition-all',
            !showMoM && 'bg-muted/20'
          )}>
            {showMoM ? (
              // MoM Generation Panel
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Minutes of Meeting
                  </h3>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>

                {/* Template Selection */}
                <div className="mb-4">
                  <label className="text-xs font-medium mb-1 block">Template</label>
                  <select className="w-full text-sm border rounded-md p-2 bg-background">
                    {mockMoMTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Generated MoM Preview */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Attendees & Roles</h4>
                      <div className="space-y-1">
                        {selectedMeeting.stakeholderRoles.map((s) => (
                          <div key={s.participantId} className="flex items-center justify-between text-xs">
                            <span>{s.name}</span>
                            <Badge variant="outline">{s.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Decisions Made</h4>
                      <ul className="space-y-1">
                        {selectedMeeting.aiIntelligence.decisions.map((d) => (
                          <li key={d.id} className="text-xs flex items-start gap-1">
                            <Target className="h-3 w-3 mt-0.5 text-primary" />
                            {d.description}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Action Items</h4>
                      <ul className="space-y-1">
                        {selectedMeeting.aiIntelligence.actionItems.map((a) => (
                          <li key={a.id} className="text-xs flex items-start gap-1">
                            <CheckCircle2 className="h-3 w-3 mt-0.5 text-success" />
                            {a.title} ({a.owner}, due {a.dueDate})
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Risks Identified</h4>
                      <ul className="space-y-1">
                        {selectedMeeting.aiIntelligence.risksIdentified.map((r) => (
                          <li key={r.id} className="text-xs flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 mt-0.5 text-warning" />
                            {r.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Approval Workflow */}
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Approval Workflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Required:</span>
                        <Badge variant={selectedMeeting.momTemplate.approvalWorkflow.required ? 'warning' : 'secondary'}>
                          {selectedMeeting.momTemplate.approvalWorkflow.required ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Approvers:</span>
                        <span>{selectedMeeting.momTemplate.approvalWorkflow.approvers.join(', ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Deadline:</span>
                        <span>{selectedMeeting.momTemplate.approvalWorkflow.deadline}h</span>
                      </div>
                    </div>
                    <Button className="w-full mt-3" size="sm">
                      <Send className="h-4 w-4 mr-1" />
                      Send for Approval
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // AI Panel
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">AI Meeting Intelligence</h3>
                </div>

                {/* Recording Status */}
                <Card variant="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Capture Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Mode</span>
                        <span className="font-medium">{selectedMeeting.captureMode.mode}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Source</span>
                        <Badge className={getSourceBadge(selectedMeeting.sourceType)}>
                          {selectedMeeting.sourceType}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Quality</span>
                        <Badge variant={
                          selectedMeeting.recordingStatus.quality === 'excellent' ? 'success' :
                          selectedMeeting.recordingStatus.quality === 'good' ? 'secondary' : 'warning'
                        }>
                          {selectedMeeting.recordingStatus.quality}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {selectedMeeting.captureMode.audioAvailable && (
                          <Badge variant="outline"><Volume2 className="h-3 w-3 mr-1" /> Audio</Badge>
                        )}
                        {selectedMeeting.captureMode.videoAvailable && (
                          <Badge variant="outline"><Video className="h-3 w-3 mr-1" /> Video</Badge>
                        )}
                        {selectedMeeting.captureMode.transcriptAvailable && (
                          <Badge variant="outline"><FileText className="h-3 w-3 mr-1" /> Transcript</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Linked Workstreams */}
                <Card variant="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Linked Workstreams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {selectedMeeting.linkedWorkstreams.map((ws, i) => (
                        <Badge key={i} variant="secondary">{ws}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Relevance */}
                {selectedMeeting.riskRelevance.length > 0 && (
                  <Card variant="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Related Risks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedMeeting.riskRelevance.map((risk) => (
                          <div key={risk.riskId} className="flex items-center justify-between text-sm">
                            <span className="truncate">{risk.riskTitle}</span>
                            <Badge variant="outline" className="text-xs">{risk.relevanceType}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Participants */}
                <Card variant="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Stakeholder Roles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedMeeting.stakeholderRoles.map((p) => (
                        <div key={p.participantId} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">
                              {p.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{p.name}</p>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">{p.role}</Badge>
                              <Badge variant={
                                p.powerLevel === 'high' ? 'destructive' :
                                p.powerLevel === 'medium' ? 'warning' : 'secondary'
                              } className="text-xs">
                                {p.powerLevel}
                              </Badge>
                            </div>
                          </div>
                          <div className={cn(
                            'h-2 w-2 rounded-full',
                            p.status === 'accepted' ? 'bg-success' :
                            p.status === 'tentative' ? 'bg-warning' :
                            p.status === 'declined' ? 'bg-destructive' : 'bg-muted'
                          )} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Link Dialog for Actions */}
      {linkingAction && (
        <LinkDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          sourceItem={{ id: linkingAction.id, title: linkingAction.title, type: 'action' }}
          onLink={handleLinkItems}
          allowedTypes={['task', 'decision', 'risk', 'meeting']}
        />
      )}
    </>
  );
}
