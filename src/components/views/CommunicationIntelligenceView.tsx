import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Mail,
  MessageSquare,
  FileText,
  Upload,
  AlertTriangle,
  Clock,
  TrendingDown,
  DollarSign,
  Shield,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Download,
  Users,
  Target,
  BarChart3,
  Send,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CommunicationAISidebar } from '@/components/ai/CommunicationAISidebar';
import type { CommunicationIngest, ExecutiveStatus, CommunicationAnalysis } from '@/types/ai-pm';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';
import { useEmails, Email } from '@/hooks/useEmails';
import { aiService } from '@/services/aiService';
import { supabase } from '@/integrations/supabase/client';
import { mockExecutiveStatus } from '@/data/aiMockData';

export function CommunicationIntelligenceView() {
  const { settings: project } = useProjectContext();
  const { accounts, syncAccount, isLoading: isLoadingAccounts } = useEmailAccounts(project?.id);

  // History State
  const [reportHistory, setReportHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch History on Mount
  useEffect(() => {
    if (project?.id) {
      fetchHistory();
    }
  }, [project?.id]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    const { data } = await supabase
      .from('project_status_reports')
      .select('id, title, audience, report_date, content')
      .eq('project_id', project?.id)
      .order('report_date', { ascending: false })
      .limit(5);

    if (data) setReportHistory(data);
    setIsLoadingHistory(false);
  };

  const loadReport = (report: any) => {
    setExecutiveStatus(report.content);
    setStatusAudience(report.audience);
    toast.info(`Loaded report: ${report.title}`);
  };

  const accountIds = useMemo(() => accounts.map(a => a.id), [accounts]);
  const { emails, isLoading: isLoadingEmails, fetchEmails } = useEmails(accountIds);

  // Map Email to CommunicationIngest
  const items = useMemo((): CommunicationIngest[] => {
    return emails.map(email => {
      const metadata = (email as any).metadata || {};
      const aiAnalysis: CommunicationAnalysis = metadata.ai_analysis || {
        delaySignals: [],
        blockerPatterns: [],
        scopeCreepIndicators: [],
        budgetPressureSignals: [],
        complianceRisks: [],
        actionableItems: [],
        sentiment: 'neutral',
        confidence: 0,
      };

      return {
        id: email.id,
        type: 'email',
        source: email.from_name || email.from_address,
        timestamp: email.received_at,
        participants: email.to_addresses.map(a => a.name || a.email),
        content: email.body_text || email.snippet || '',
        aiAnalysis,
      };
    });
  }, [emails]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedCommItems = items;
  const selectedComm = useMemo(() => items.find(i => i.id === selectedId) || items[0], [items, selectedId]);

  const [statusAudience, setStatusAudience] = useState<string>('steering-committee');
  const [emailContent, setEmailContent] = useState('');
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [isGeneratingStatus, setIsGeneratingStatus] = useState(false);
  const [isAnalyzingContent, setIsAnalyzingContent] = useState(false);
  const [executiveStatus, setExecutiveStatus] = useState<ExecutiveStatus | null>(null);

  // Use mock only if no status generated yet
  const displayStatus = executiveStatus || (mockExecutiveStatus as unknown as ExecutiveStatus);

  const handleSync = async () => {
    if (accountIds.length > 0) {
      for (const id of accountIds) {
        await syncAccount(id);
      }
      fetchEmails();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-success text-success-foreground';
      case 'negative':
        return 'bg-destructive text-destructive-foreground';
      case 'urgent':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRAGColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'bg-success';
      case 'amber':
        return 'bg-warning';
      case 'red':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  return (
    <>
      <CommunicationAISidebar isOpen={showAISidebar} onToggle={() => setShowAISidebar(!showAISidebar)} />
      <div className={cn("p-6 space-y-6 overflow-y-auto h-full transition-all duration-300", showAISidebar && "mr-80")}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Communication Intelligence
            </h1>
            <p className="text-muted-foreground">AI-powered analysis of project communications</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toast.success('Communications imported from linked sources')}
            >
              <Upload className="h-4 w-4" />
              Import Communications
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleSync}
              disabled={isLoadingAccounts || accountIds.length === 0}
            >
              {isLoadingAccounts ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync
            </Button>
          </div>
        </div>

        <Tabs defaultValue="ingestion" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="ingestion">Email Ingestion</TabsTrigger>
            <TabsTrigger value="patterns">Pattern Extraction</TabsTrigger>
            <TabsTrigger value="status">Executive Status</TabsTrigger>
          </TabsList>

          {/* Email Ingestion Tab */}
          <TabsContent value="ingestion" className="space-y-4">
            <div className="flex gap-4 h-[calc(100vh-280px)]">
              {/* Communication List */}
              <div className="w-80 border rounded-lg overflow-hidden flex flex-col">
                <div className="p-3 border-b bg-muted/30">
                  <h3 className="font-medium">Ingested Communications</h3>
                  <p className="text-xs text-muted-foreground">
                    {isLoadingEmails ? 'Loading...' : `${items.length} items analyzed`}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {items.length === 0 && !isLoadingEmails && (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <Mail className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground">No communications found.</p>
                    </div>
                  )}
                  {items.map((comm) => (
                    <motion.div
                      key={comm.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedId(comm.id)}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-all',
                        selectedComm?.id === comm.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(comm.type)}
                        <span className="text-sm font-medium truncate">{comm.source}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{comm.content.slice(0, 100)}...</p>
                      <div className="flex items-center justify-between">
                        <Badge className={getSentimentColor(comm.aiAnalysis.sentiment)}>
                          {comm.aiAnalysis.sentiment}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comm.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Communication Detail & Analysis */}
              {selectedComm ? (
                <div className="flex-1 space-y-4 overflow-y-auto">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {getTypeIcon(selectedComm.type)}
                          Communication Details
                        </CardTitle>
                        {selectedComm.aiAnalysis.confidence > 0 && (
                          <Badge variant="outline">{Math.round(selectedComm.aiAnalysis.confidence * 100)}% confidence</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 rounded-lg bg-muted/30 mb-4">
                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <span>From: {selectedComm.source}</span>
                          <span>•</span>
                          <span>{new Date(selectedComm.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{selectedComm.content}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mb-4">
                        <span className="text-sm text-muted-foreground">Participants:</span>
                        {selectedComm.participants.map((p, i) => (
                          <Badge key={i} variant="secondary">{p}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Analysis */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Delay Signals */}
                    {selectedComm.aiAnalysis.delaySignals.length > 0 && (
                      <Card className="border-warning/30 bg-warning/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-warning" />
                            Delay Signals Detected
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedComm.aiAnalysis.delaySignals.map((signal, i) => (
                              <div key={i} className="p-2 rounded bg-card border">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={signal.severity === 'critical' ? 'destructive' : 'warning'}>
                                    {signal.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm mb-1">{signal.description}</p>
                                <p className="text-xs text-success">Action: {signal.suggestedAction}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Scope Creep */}
                    {selectedComm.aiAnalysis.scopeCreepIndicators.length > 0 && (
                      <Card className="border-info/30 bg-info/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-info" />
                            Scope Creep Indicators
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedComm.aiAnalysis.scopeCreepIndicators.map((ind, i) => (
                              <div key={i} className="p-2 rounded bg-card border">
                                <p className="text-sm mb-1">{ind.description}</p>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline">{ind.impact}</Badge>
                                  <span className="text-muted-foreground">Source: {ind.source}</span>
                                </div>
                                <p className="text-xs text-success mt-1">Recommendation: {ind.recommendation}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Budget Pressure */}
                    {selectedComm.aiAnalysis.budgetPressureSignals.length > 0 && (
                      <Card className="border-destructive/30 bg-destructive/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-destructive" />
                            Budget Pressure Signals
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedComm.aiAnalysis.budgetPressureSignals.map((signal, i) => (
                              <div key={i} className="p-2 rounded bg-card border">
                                <Badge variant={signal.severity === 'critical' ? 'destructive' : 'warning'} className="mb-1">
                                  {signal.severity}
                                </Badge>
                                <p className="text-sm">{signal.description}</p>
                                <p className="text-xs text-success mt-1">{signal.recommendation}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Actionable Items */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Extracted Action Items
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedComm.aiAnalysis.actionableItems.length > 0 ? (
                            selectedComm.aiAnalysis.actionableItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{item.owner}</span>
                                    {item.dueDate && (
                                      <>
                                        <span>•</span>
                                        <span>{item.dueDate}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Badge variant={item.priority as any}>{item.priority}</Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No actionable items extracted.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10">
                  <Sparkles className="h-12 w-12 text-primary/20 mb-4" />
                  <h3 className="text-lg font-medium">Select a communication</h3>
                  <p className="text-sm text-muted-foreground">Choose an item from the list to see AI analysis</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pattern Extraction Tab */}
          <TabsContent value="patterns" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-warning/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    Delay Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning mb-1">
                    {items.reduce((acc, curr) => acc + curr.aiAnalysis.delaySignals.length, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Active delay signals</p>
                </CardContent>
              </Card>

              <Card className="border-info/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-info" />
                    Scope Creep
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-info mb-1">
                    {items.reduce((acc, curr) => acc + curr.aiAnalysis.scopeCreepIndicators.length, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Scope expansion indicators</p>
                </CardContent>
              </Card>

              <Card className="border-destructive/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-destructive" />
                    Budget Pressure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive mb-1">
                    {items.reduce((acc, curr) => acc + curr.aiAnalysis.budgetPressureSignals.length, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Pressure signals detected</p>
                </CardContent>
              </Card>

              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Compliance Risks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {items.reduce((acc, curr) => acc + curr.aiAnalysis.complianceRisks.length, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Compliance issues</p>
                </CardContent>
              </Card>
            </div>

            {/* What Changed Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  What Changed Since Last Update?
                </CardTitle>
                <CardDescription>AI-detected changes from project communications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <h4 className="font-medium text-sm">New Decisions</h4>
                    </div>
                    <div className="space-y-2">
                      {/* In a real implementation, we would extract these from all communications */}
                      <div className="text-xs p-2 rounded bg-card italic text-muted-foreground">
                        No new decisions extracted
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-warning/5">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <h4 className="font-medium text-sm">New Risks</h4>
                    </div>
                    <div className="space-y-2">
                      {items.flatMap(i => i.aiAnalysis.delaySignals).slice(0, 2).map((s, idx) => (
                        <div key={idx} className="text-xs p-2 rounded bg-card">
                          {s.description}
                        </div>
                      ))}
                      {items.flatMap(i => i.aiAnalysis.delaySignals).length === 0 && (
                        <div className="text-xs p-2 rounded bg-card italic text-muted-foreground">
                          No new risks detected
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-info/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-info" />
                      <h4 className="font-medium text-sm">Changed Dates</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs p-2 rounded bg-card italic text-muted-foreground">
                        No date changes detected
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-destructive/5">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="h-4 w-4 text-destructive" />
                      <h4 className="font-medium text-sm">Escalations Required</h4>
                    </div>
                    <div className="space-y-2">
                      {items.flatMap(i => i.aiAnalysis.budgetPressureSignals).slice(0, 2).map((s, idx) => (
                        <div key={idx} className="text-xs p-2 rounded bg-card">
                          {s.description}
                        </div>
                      ))}
                      {items.flatMap(i => i.aiAnalysis.budgetPressureSignals).length === 0 && (
                        <div className="text-xs p-2 rounded bg-card italic text-muted-foreground">
                          No escalations required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Executive Status Tab */}
          <TabsContent value="status" className="space-y-4">
            <div className="flex gap-4">
              {/* Status Generator */}
              <div className="flex-1 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Executive Status Generator
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <select
                          value={statusAudience}
                          onChange={(e) => setStatusAudience(e.target.value)}
                          className="text-sm border rounded-md px-2 py-1 bg-background"
                        >
                          <option value="steering-committee">Steering Committee</option>
                          <option value="sponsor">Sponsor</option>
                          <option value="board">Board</option>
                          <option value="team">Team</option>
                        </select>
                        <button
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                            "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          )}
                          onClick={async () => {
                            if (!project?.id) return;
                            setIsGeneratingStatus(true);
                            const { data, error } = await aiService.generateExecutiveStatus(project.id, statusAudience);
                            setIsGeneratingStatus(false);

                            if (error) {
                              toast.error('Failed to generate status: ' + error);
                            } else {
                              setExecutiveStatus(data);
                              toast.success(`Executive Status generated for ${statusAudience}`);
                            }
                          }}
                          disabled={isGeneratingStatus || !project?.id}
                        >
                          {isGeneratingStatus ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Generate
                        </button>
                      </div>
                    </div>
                    <CardDescription>
                      One-click generation of audience-appropriate status reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* RAG Status */}
                    <div className="grid grid-cols-6 gap-2 mb-6">
                      {Object.entries(displayStatus.ragStatus).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className={cn('w-8 h-8 rounded-full mx-auto mb-1', getRAGColor(value))} />
                          <span className="text-xs capitalize">{key}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status Sections */}
                    <div className="space-y-4">
                      {displayStatus.sections.map((section, i) => (
                        <div key={i} className="p-4 rounded-lg border">
                          <h4 className="font-medium mb-2">{section.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{section.content}</p>

                          {section.highlights.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-success">Highlights:</span>
                              <ul className="mt-1 space-y-1">
                                {section.highlights.map((h: any, j: number) => (
                                  <li key={j} className="text-xs flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-success" />
                                    {String(h)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {section.concerns.length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-warning">Concerns:</span>
                              <ul className="mt-1 space-y-1">
                                {section.concerns.map((c: any, j: number) => (
                                  <li key={j} className="text-xs flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 text-warning" />
                                    {String(c)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Key Changes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Changes This Period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {displayStatus.keyChanges.map((change, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <Badge variant={
                            change.category === 'decision' ? 'info' :
                              change.category === 'risk' ? 'warning' :
                                change.category === 'milestone' ? 'success' : 'secondary'
                          }>
                            {change.category}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{change.description}</p>
                            <p className="text-xs text-muted-foreground">{change.impact}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{change.date}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions & Export */}
              <div className="w-80 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">AI Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {displayStatus.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-primary/5 border border-primary/20">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Export & Share</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => toast.success('Status Report exported as PDF')}
                    >
                      <Download className="h-4 w-4" />
                      Download as PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => toast.success('Status Report exported to PowerPoint')}
                    >
                      <FileText className="h-4 w-4" />
                      Export to PowerPoint
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => toast.success('Status Report sent via Email')}
                    >
                      <Send className="h-4 w-4" />
                      Send via Email
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Draft</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Paste email content for AI analysis..."
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      className="min-h-[100px] mb-2"
                    />
                    <Button
                      className="w-full gap-2"
                      disabled={isAnalyzingContent || !emailContent.trim()}
                      onClick={async () => {
                        if (!emailContent.trim()) {
                          toast.error('Please paste content to analyze');
                          return;
                        }

                        setIsAnalyzingContent(true);
                        toast.info('Analyzing communication content...');

                        const { data, error } = await aiService.processCommunication(project?.id || 'manual', emailContent);
                        setIsAnalyzingContent(false);

                        if (error) {
                          toast.error('Analysis failed: ' + error);
                        } else {
                          // For now, we just toast the success and keep the data in mind
                          // In a full implementation, we'd update the UI to show this specific analysis
                          toast.success('Analysis complete! Sentiment: ' + data.sentiment);
                          console.log('Analysis result:', data);
                        }
                      }}
                    >
                      {isAnalyzingContent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Analyze Content
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
