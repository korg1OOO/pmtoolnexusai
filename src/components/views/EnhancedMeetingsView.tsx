import React, { useState, useMemo } from 'react';
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
  FileText,
  Download,
  CircleDot,
  ArrowUpRight,
  GitBranch,
  Zap,
  MessageSquare,
  Send,
  Shield,
  Timer,
  Wifi,
  WifiOff,
  Volume2,
  Link2,
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MeetingAISidebar } from '@/components/ai/MeetingAISidebar';
import { LinkDialog, LinkableItem } from '@/components/linking/LinkDialog';
import { MeetingCreationDialog, TranscriptUploadDialog } from '@/components/meetings';
import { useMeetings, MeetingWithRelations, CreateMeetingInput, CreateParticipantInput, CreateAgendaItemInput } from '@/hooks/useMeetings';
import { useProjectContext } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Helper to convert DB meeting to display format
function mapMeetingToDisplay(meeting: MeetingWithRelations) {
  const participants = meeting.meeting_participants || [];
  const decisions = meeting.meeting_decisions || [];
  const actionItems = meeting.meeting_action_items || [];
  const risks = meeting.meeting_risks || [];
  const agendaItems = meeting.meeting_agenda_items || [];

  return {
    id: meeting.id,
    title: meeting.title,
    type: meeting.meeting_type,
    date: meeting.date,
    startTime: meeting.start_time,
    endTime: meeting.end_time || '',
    status: meeting.status,
    sourceType: meeting.source_type || 'manual',
    captureConfidence: meeting.capture_confidence || 'low',
    captureMode: {
      mode: meeting.capture_mode || 'manual-entry',
      audioAvailable: meeting.audio_available || false,
      videoAvailable: meeting.video_available || false,
      transcriptAvailable: meeting.transcript_available || false,
    },
    purpose: {
      type: meeting.purpose_type || 'status-update',
      description: meeting.purpose_description || '',
      expectedOutcomes: Array.isArray(meeting.expected_outcomes) ? meeting.expected_outcomes as string[] : [],
      successCriteria: Array.isArray(meeting.success_criteria) ? meeting.success_criteria as string[] : [],
    },
    decisionScope: {
      type: meeting.decision_scope_type || 'operational',
      budgetAuthority: meeting.budget_authority,
      resourceAuthority: meeting.resource_authority || false,
      scopeChangeAuthority: meeting.scope_change_authority || false,
      requiredQuorum: meeting.required_quorum || 2,
    },
    stakeholderRoles: participants.map((p) => ({
      participantId: p.id,
      name: p.name,
      role: p.role,
      powerLevel: p.power_level || 'medium',
      interest: p.interest_level || 'medium',
      status: p.attendance_status || 'pending',
    })),
    linkedWorkstreams: Array.isArray(meeting.linked_workstreams) ? meeting.linked_workstreams as string[] : [],
    aiIntelligence: {
      summary: meeting.ai_summary || 'No AI summary available yet. Upload a transcript to generate insights.',
      confidence: meeting.ai_confidence || 0,
      decisions: decisions.map((d) => ({
        id: d.id,
        description: d.description,
        type: d.decision_type || 'reversible',
        madeBy: d.made_by || 'Unknown',
        approvedBy: Array.isArray(d.approved_by) ? d.approved_by as string[] : [],
        impact: d.impact || 'medium',
        linkedRisks: Array.isArray(d.linked_risks) ? d.linked_risks as string[] : [],
        linkedTasks: Array.isArray(d.linked_tasks) ? d.linked_tasks as string[] : [],
        timestamp: d.timestamp_in_meeting || '',
        confidence: d.ai_confidence || 1,
      })),
      actionItems: actionItems.map((a) => ({
        id: a.id,
        title: a.title,
        owner: a.owner_name,
        dueDate: a.due_date || '',
        priority: a.priority || 'medium',
        dependencies: Array.isArray(a.dependencies) ? a.dependencies as string[] : [],
        blockedBy: Array.isArray(a.blocked_by) ? a.blocked_by as string[] : [],
        source: a.source || 'manual',
        confidence: a.ai_confidence || 1,
        status: a.status || 'pending',
      })),
      risksIdentified: risks.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        probability: r.probability || 'medium',
        impact: r.impact || 'medium',
        category: r.category || 'General',
        suggestedMitigation: r.suggested_mitigation || '',
        source: r.source || 'manual',
        confidence: r.ai_confidence || 1,
      })),
      keyTopics: Array.isArray(meeting.ai_key_topics) 
        ? (meeting.ai_key_topics as { topic: string; duration: number; participants: string[]; sentiment: string }[])
        : [],
      sentimentAnalysis: meeting.ai_sentiment as { overall: string; engagement: number; concerns: string[]; positives: string[] } || {
        overall: 'neutral',
        engagement: 0,
        concerns: [],
        positives: [],
      },
      nextSteps: Array.isArray(meeting.ai_next_steps) ? meeting.ai_next_steps as string[] : [],
      scopeChanges: [],
      conflicts: [],
    },
    agendaItems: agendaItems.map((a, idx) => ({
      id: a.id,
      title: a.title,
      description: a.description || '',
      duration: a.duration_minutes || 15,
      presenterName: a.presenter_name || '',
      sortOrder: a.sort_order || idx,
      status: a.status || 'pending',
    })),
    momGenerated: meeting.mom_generated || false,
    momContent: meeting.mom_content || null,
    momApproved: meeting.mom_approved || false,
  };
}

export function EnhancedMeetingsView() {
  const { settings } = useProjectContext();
  const projectId = settings.id; // Use project ID from context
  
  const { 
    meetings, 
    isLoading, 
    createMeeting, 
    addParticipant, 
    addAgendaItem,
    updateMeeting,
    processWithAI,
    generateMoM,
  } = useMeetings(projectId);

  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [showMoM, setShowMoM] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingAction, setLinkingAction] = useState<{ id: string; title: string } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [isGeneratingMoM, setIsGeneratingMoM] = useState(false);

  // Map meetings to display format
  const displayMeetings = useMemo(() => meetings.map(mapMeetingToDisplay), [meetings]);
  
  // Get selected meeting
  const selectedMeeting = useMemo(() => {
    if (!selectedMeetingId && displayMeetings.length > 0) {
      return displayMeetings[0];
    }
    return displayMeetings.find((m) => m.id === selectedMeetingId) || null;
  }, [selectedMeetingId, displayMeetings]);

  // Auto-select first meeting
  React.useEffect(() => {
    if (displayMeetings.length > 0 && !selectedMeetingId) {
      setSelectedMeetingId(displayMeetings[0].id);
    }
  }, [displayMeetings, selectedMeetingId]);

  const handleOpenLinkDialog = (actionId: string, actionTitle: string) => {
    setLinkingAction({ id: actionId, title: actionTitle });
    setLinkDialogOpen(true);
  };

  const handleLinkItems = (items: LinkableItem[]) => {
    console.log('Linked items to action:', items);
  };

  const handleCreateMeeting = async (
    meeting: CreateMeetingInput,
    participants: CreateParticipantInput[],
    agendaItems: CreateAgendaItemInput[]
  ) => {
    const createdMeeting = await createMeeting(meeting);
    if (createdMeeting) {
      // Add participants
      for (const p of participants) {
        await addParticipant({ ...p, meeting_id: createdMeeting.id });
      }
      // Add agenda items
      for (const a of agendaItems) {
        await addAgendaItem({ ...a, meeting_id: createdMeeting.id });
      }
      setSelectedMeetingId(createdMeeting.id);
    }
  };

  const handleUploadTranscript = async (transcript: string) => {
    if (!selectedMeeting) return;
    
    await updateMeeting(selectedMeeting.id, {
      // We need to store transcript - update the meeting record
    });

    // Store transcript in the meeting
    const { error } = await supabase
      .from('meetings')
      .update({ 
        transcript_text: transcript,
        transcript_available: true,
        capture_mode: 'post-meeting',
      })
      .eq('id', selectedMeeting.id);

    if (error) {
      toast.error('Failed to save transcript');
      throw error;
    }
  };

  const handleProcessWithAI = async () => {
    if (!selectedMeeting) return;
    await processWithAI(selectedMeeting.id);
  };

  const handleGenerateMoM = async () => {
    if (!selectedMeeting) return;
    setIsGeneratingMoM(true);
    try {
      await generateMoM(selectedMeeting.id);
      setShowMoM(true);
    } finally {
      setIsGeneratingMoM(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="w-80 border-r p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <MeetingAISidebar 
        isOpen={showAISidebar} 
        onToggle={() => setShowAISidebar(!showAISidebar)} 
        meeting={null}
      />
      <div className={cn("flex h-full transition-all duration-300", showAISidebar && "mr-80")}>
        {/* Meeting List */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">AI-Enhanced Meetings</h2>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {displayMeetings.length} meetings with AI intelligence extraction
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {displayMeetings.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Video className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium mb-1">No meetings yet</p>
                  <p className="text-xs">Create your first meeting to get started</p>
                </div>
              ) : (
                displayMeetings.map((meeting) => (
                  <motion.div
                    key={meeting.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedMeetingId(meeting.id)}
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

                        <div className="flex items-center gap-2">
                          {getCaptureIcon(meeting.captureMode.mode)}
                          <Badge variant={
                            meeting.captureConfidence === 'high' ? 'success' :
                            meeting.captureConfidence === 'medium' ? 'warning' : 'secondary'
                          } className="text-xs">
                            {meeting.captureConfidence} confidence
                          </Badge>
                        </div>

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
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Meeting Details */}
        {selectedMeeting ? (
          <div className="flex-1 flex overflow-hidden">
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
                        {selectedMeeting.startTime} - {selectedMeeting.endTime || 'TBD'}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded text-xs', getSourceBadge(selectedMeeting.sourceType))}>
                        {selectedMeeting.sourceType.toUpperCase()}
                      </span>
                      {getCaptureIcon(selectedMeeting.captureMode.mode)}
                      <span className="text-xs">{selectedMeeting.captureMode.mode}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowTranscriptDialog(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Transcript
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateMoM}
                      disabled={isGeneratingMoM}
                    >
                      {isGeneratingMoM ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
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
                    <p className="text-sm mb-3">{selectedMeeting.purpose.description || 'No purpose description'}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Expected Outcomes</span>
                        <ul className="mt-1 space-y-1">
                          {selectedMeeting.purpose.expectedOutcomes.length > 0 ? (
                            selectedMeeting.purpose.expectedOutcomes.map((o, i) => (
                              <li key={i} className="text-sm flex items-center gap-1">
                                <CircleDot className="h-3 w-3 text-primary" />
                                {o}
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-muted-foreground">None defined</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Success Criteria</span>
                        <ul className="mt-1 space-y-1">
                          {selectedMeeting.purpose.successCriteria.length > 0 ? (
                            selectedMeeting.purpose.successCriteria.map((c, i) => (
                              <li key={i} className="text-sm flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-success" />
                                {c}
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-muted-foreground">None defined</li>
                          )}
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
                    <TabsTrigger value="agenda">Agenda</TabsTrigger>
                  </TabsList>

                  {/* AI Intelligence Tab */}
                  <TabsContent value="intelligence" className="mt-4 space-y-4">
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
                          <Badge variant="outline">{Math.round(selectedMeeting.aiIntelligence.confidence * 100)}% confidence</Badge>
                          {selectedMeeting.aiIntelligence.confidence === 0 && (
                            <Button size="sm" variant="outline" onClick={() => setShowTranscriptDialog(true)}>
                              <Upload className="h-3 w-3 mr-1" />
                              Upload transcript to generate
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {selectedMeeting.aiIntelligence.keyTopics.length > 0 && (
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
                    )}

                    {selectedMeeting.aiIntelligence.sentimentAnalysis.engagement > 0 && (
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
                    )}

                    {selectedMeeting.aiIntelligence.nextSteps.length > 0 && (
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
                    )}
                  </TabsContent>

                  {/* Decisions Tab */}
                  <TabsContent value="decisions" className="mt-4">
                    <div className="space-y-3">
                      {selectedMeeting.aiIntelligence.decisions.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium mb-1">No decisions recorded</p>
                            <p className="text-xs">Upload a transcript to extract decisions with AI</p>
                          </CardContent>
                        </Card>
                      ) : (
                        selectedMeeting.aiIntelligence.decisions.map((decision) => (
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
                                      {Math.round(decision.confidence * 100)}% confident
                                    </span>
                                  </div>
                                  <p className="font-medium">{decision.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>Made by: {decision.madeBy}</span>
                                    {decision.approvedBy.length > 0 && (
                                      <span>Approved by: {decision.approvedBy.join(', ')}</span>
                                    )}
                                    {decision.timestamp && <span>@ {decision.timestamp}</span>}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Decision
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Actions Tab */}
                  <TabsContent value="actions" className="mt-4">
                    <div className="space-y-3">
                      {selectedMeeting.aiIntelligence.actionItems.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium mb-1">No action items</p>
                            <p className="text-xs">Upload a transcript to extract action items with AI</p>
                          </CardContent>
                        </Card>
                      ) : (
                        selectedMeeting.aiIntelligence.actionItems.map((action) => (
                          <Card key={action.id} className="group">
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className={cn(
                                  'h-5 w-5 mt-0.5',
                                  action.status === 'completed' ? 'text-success' : 'text-muted-foreground'
                                )} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{action.title}</span>
                                    <Badge variant={action.source === 'explicit' ? 'success' : 'secondary'}>
                                      {action.source}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>Owner: {action.owner}</span>
                                    {action.dueDate && (
                                      <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                                    )}
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
                        ))
                      )}
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Action Item
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Risks Tab */}
                  <TabsContent value="risks" className="mt-4">
                    <div className="space-y-3">
                      {selectedMeeting.aiIntelligence.risksIdentified.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium mb-1">No risks identified</p>
                            <p className="text-xs">Upload a transcript to identify risks with AI</p>
                          </CardContent>
                        </Card>
                      ) : (
                        selectedMeeting.aiIntelligence.risksIdentified.map((risk) => (
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
                                  {risk.suggestedMitigation && (
                                    <div className="p-2 rounded bg-success/10 text-xs">
                                      <Sparkles className="h-3 w-3 inline mr-1 text-success" />
                                      Suggested mitigation: {risk.suggestedMitigation}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Agenda Tab */}
                  <TabsContent value="agenda" className="mt-4">
                    <div className="space-y-3">
                      {selectedMeeting.agendaItems.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium mb-1">No agenda items</p>
                            <p className="text-xs">Add agenda items when creating or editing the meeting</p>
                          </CardContent>
                        </Card>
                      ) : (
                        selectedMeeting.agendaItems.map((item, index) => (
                          <Card key={item.id}>
                            <CardContent className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{item.title}</p>
                                  {item.presenterName && (
                                    <p className="text-xs text-muted-foreground">Presenter: {item.presenterName}</p>
                                  )}
                                </div>
                                <Badge variant="outline">{item.duration} min</Badge>
                                <Badge variant={item.status === 'completed' ? 'success' : 'secondary'}>
                                  {item.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Side Panel */}
            <div className={cn(
              'w-96 border-l overflow-y-auto transition-all',
              !showMoM && 'bg-muted/20'
            )}>
              {showMoM && selectedMeeting.momContent ? (
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
                  <Card>
                    <CardContent className="p-4">
                      <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: selectedMeeting.momContent.replace(/\n/g, '<br/>') }} />
                    </CardContent>
                  </Card>
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Approval Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant={selectedMeeting.momApproved ? 'success' : 'warning'}>
                        {selectedMeeting.momApproved ? 'Approved' : 'Pending Approval'}
                      </Badge>
                      <Button className="w-full mt-3" size="sm">
                        <Send className="h-4 w-4 mr-1" />
                        Send for Approval
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">AI Meeting Intelligence</h3>
                  </div>

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

                  {selectedMeeting.linkedWorkstreams.length > 0 && (
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
                  )}

                  <Card variant="glass">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Stakeholder Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedMeeting.stakeholderRoles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No participants added</p>
                      ) : (
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
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Video className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No meeting selected</h3>
              <p className="text-sm mb-4">Select a meeting from the list or create a new one</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Meeting
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <MeetingCreationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        projectId={projectId}
        onCreateMeeting={handleCreateMeeting}
      />

      {selectedMeeting && (
        <TranscriptUploadDialog
          open={showTranscriptDialog}
          onOpenChange={setShowTranscriptDialog}
          meetingId={selectedMeeting.id}
          meetingTitle={selectedMeeting.title}
          onUploadTranscript={handleUploadTranscript}
          onProcessWithAI={handleProcessWithAI}
        />
      )}

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
