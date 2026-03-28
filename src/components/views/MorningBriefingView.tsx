import React, { useState, useMemo, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';
import {
  Sun,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
// mockProject removed - fully wired

import {
  BriefingSettingsPanel,
  useBriefingPreferences,
  BRIEFING_SECTIONS,
  BriefingSectionId,
} from '@/components/briefing';
import { useBriefingGeneration } from '@/components/briefing/hooks/useBriefingGeneration';
import { FlexibleBriefingGrid } from '@/components/briefing/FlexibleBriefingGrid';
import { ResizableBriefingLayout } from '@/components/briefing/ResizableBriefingLayout';
import { Layout } from 'lucide-react';

// Lazy-loaded Section Components for better performance
const CriticalAlertsSection = lazy(() => import('@/components/briefing/sections/CriticalAlertsSection').then(m => ({ default: m.CriticalAlertsSection })));
const AIInsightsSection = lazy(() => import('@/components/briefing/sections/AIInsightsSection').then(m => ({ default: m.AIInsightsSection })));
const ProfitLossSection = lazy(() => import('@/components/briefing/sections/ProfitLossSection').then(m => ({ default: m.ProfitLossSection })));
const ScheduleSlippageSection = lazy(() => import('@/components/briefing/sections/ScheduleSlippageSection').then(m => ({ default: m.ScheduleSlippageSection })));
const RiskAssessmentSection = lazy(() => import('@/components/briefing/sections/RiskAssessmentSection').then(m => ({ default: m.RiskAssessmentSection })));
const ActionsSection = lazy(() => import('@/components/briefing/sections/ActionsSection').then(m => ({ default: m.ActionsSection })));
const IssuesSection = lazy(() => import('@/components/briefing/sections/IssuesSection').then(m => ({ default: m.IssuesSection })));
const MeetingsSection = lazy(() => import('@/components/briefing/sections/MeetingsSection').then(m => ({ default: m.MeetingsSection })));
const DecisionsSection = lazy(() => import('@/components/briefing/sections/DecisionsSection').then(m => ({ default: m.DecisionsSection })));
const TeamAvailabilitySection = lazy(() => import('@/components/briefing/sections/TeamAvailabilitySection').then(m => ({ default: m.TeamAvailabilitySection })));
const BudgetAnalysisSection = lazy(() => import('@/components/briefing/sections/BudgetAnalysisSection').then(m => ({ default: m.BudgetAnalysisSection })));

// Hooks
import { useProjectContext } from '@/contexts/ProjectContext';
import { useRisks } from '@/hooks/useRisks';
import { useIssues } from '@/hooks/useIssues';
import { useDecisions } from '@/hooks/useDecisions';
import { useActions } from '@/hooks/useActions';
import { useFinancials } from '@/hooks/useFinancials';
import { useTasks } from '@/hooks/useTasks';
import { useMeetings } from '@/hooks/useMeetings';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useAIInsights } from '@/hooks/useAIInsights';

// Mock data removed - AI insights now from database

interface MorningBriefingViewProps {
  demo?: boolean;
}

export default function MorningBriefingView({ demo = false }: MorningBriefingViewProps) {
  const { toast } = useToast();
  const { settings } = useProjectContext();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isResizable, setIsResizable] = useState(false);

  // Hook Data
  const { risks, criticalRisks, openRisks } = useRisks();
  const { issues, criticalIssues, openIssues } = useIssues();
  const { decisions, pendingDecisions } = useDecisions();
  const { actions, overdueActions: overdueActionsList } = useActions();

  // New Wired Hooks
  const { budget, invoices, isLoading: loadingFinancials } = useFinancials(settings.id);
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(settings.id);
  const { meetings, isLoading: loadingMeetings } = useMeetings(settings.id);
  const { data: teamMembers = [], isLoading: loadingTeam } = useTeamMembers(settings.id);
  const { data: aiInsights = [], isLoading: loadingAIInsights } = useAIInsights(settings.id);
  // Helper functions to map DB statuses to UI types safely
  const mapActionStatus = (status: string): 'open' | 'in-progress' | 'overdue' | 'completed' => {
    const valid = ['open', 'in-progress', 'overdue', 'completed'];
    return valid.includes(status) ? (status as any) : 'open';
  };

  const mapActionPriority = (priority: string): 'low' | 'medium' | 'high' | 'critical' => {
    const valid = ['low', 'medium', 'high', 'critical'];
    return valid.includes(priority) ? (priority as any) : 'medium';
  };

  const mapDecisionStatus = (status: string): 'pending' | 'approved' | 'rejected' => {
    const valid = ['pending', 'approved', 'rejected'];
    return valid.includes(status) ? (status as any) : 'pending';
  };

  const mapDecisionImpact = (impact: string): 'low' | 'medium' | 'high' => {
    const valid = ['low', 'medium', 'high'];
    return valid.includes(impact) ? (impact as any) : 'medium';
  };

  // --- Derived Metrics ---

  // 1. Budget Analysis & Profit/Loss (Adapted)
  const budgetData = useMemo(() => {
    const totalBudget = budget.reduce((sum, item) => sum + (item.planned || 0), 0);
    const totalSpent = budget.reduce((sum, item) => sum + (item.actual || 0), 0);
    const totalRemaining = totalBudget - totalSpent;

    // Calculate Burn Rate
    // Method 1: Spend in last 30 days based on invoices (most accurate for "current operational tempo")
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // We need invoices to calculate precise periodic burn.
    // Ensure useFinancials returns invoices (it does).
    // Note: If invoices are missing from the destructuring above, we need to add them.
    // Assuming 'invoices' is available in scope (we will ensure it is added to the hook call).
    const recentSpend = (invoices || [])
      .filter(inv => new Date(inv.date) >= thirtyDaysAgo && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Method 2: Average monthly spend if no recent invoices (fallback)
    let averageMonthlyBurn = 0;
    if (settings?.startDate) {
      const startDate = new Date(settings.startDate);
      const monthsActive = Math.max(1, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      averageMonthlyBurn = totalSpent / monthsActive;
    }

    // Use recent spend if available and significant, otherwise fallback to average
    // If project is brand new (no spend), burn is 0.
    const burnRate = recentSpend > 0 ? recentSpend : averageMonthlyBurn;

    // Variance: Positive means Under Budget (Good)
    const costVariance = totalBudget - totalSpent;

    // Simple EAC (Estimate at Completion) basic projection
    const cpi = totalSpent > 0 ? (totalBudget / totalSpent) : 1;
    const estimateAtCompletion = totalSpent > 0 ? totalBudget / cpi : totalBudget;

    return {
      totalBudget,
      spent: totalSpent,
      committed: 0, // Not tracking committed yet
      remaining: totalRemaining,
      burnRate,
      costVariance,
      scheduleVariance: 0, // Needs EVM
      estimateAtCompletion,
      estimateToComplete: estimateAtCompletion - totalSpent,
      forecasts: { optimistic: estimateAtCompletion * 0.9, likely: estimateAtCompletion, pessimistic: estimateAtCompletion * 1.2 },
    };
  }, [budget, invoices, settings?.startDate]);

  // Adapt Budget to P&L shape for the ProfitLoss component
  const profitLossData = useMemo(() => ({
    expectedProfit: budgetData.remaining, // Treating remaining budget as "Profit" bucket for visual
    expectedLoss: 0,
    currentBurnRate: budgetData.burnRate,
    projectedCompletion: budgetData.estimateAtCompletion,
    scenarios: budgetData.forecasts,
    riskFactors: ['Budget data connected'],
    budgetUtilization: budgetData.totalBudget > 0 ? Math.round((budgetData.spent / budgetData.totalBudget) * 100) : 0,
  }), [budgetData]);


  // 2. Schedule Slippage
  const scheduleData = useMemo(() => {
    const today = new Date();
    // Find tasks that are overdue (end_date < today && status != completed)
    const slippingTasks = tasks
      .filter(t => t.status !== 'completed' && t.end_date && new Date(t.end_date) < today)
      .map(t => {
        const endDate = new Date(t.end_date);
        const slippageMs = today.getTime() - endDate.getTime();
        const slippageDays = Math.ceil(slippageMs / (1000 * 60 * 60 * 24));
        return {
          id: t.id,
          name: t.name,
          baselineEnd: t.end_date, // Using current end as ref since we don't have baseline loaded
          currentEnd: today.toISOString(), // "Effective" end is today+
          slippageDays,
          isCritical: t.priority === 'high' || t.priority === 'critical',
          impact: 'Task is overdue',
        };
      });

    const totalSlippageDays = slippingTasks.reduce((acc, t) => acc + t.slippageDays, 0);

    return {
      totalSlippageDays,
      criticalPathChanged: false,
      slippingTasks: slippingTasks.slice(0, 5), // Top 5
      atRiskMilestones: [], // Need milestone types
      cascadingDelays: slippingTasks.length > 0 ? [`${slippingTasks.length} tasks are overdue`] : [],
    };
  }, [tasks]);

  // 3. Meetings Today
  const todaysMeetings = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return meetings.filter(m => m.date === todayStr).map(m => ({
      id: m.id,
      title: m.title,
      startTime: new Date(`${m.date}T${m.start_time}`).toISOString(),
      endTime: m.end_time ? new Date(`${m.date}T${m.end_time}`).toISOString() : new Date(`${m.date}T${m.start_time}`).toISOString(), // Fallback
      type: m.meeting_type,
      participants: m.meeting_participants?.length || 0,
      status: m.status,
      meetingLink: m.meeting_link,
      location: m.location
    }));
  }, [meetings]);

  // 4. Team Availability
  const teamAvailability = useMemo(() => {
    const mappedMembers = (teamMembers || []).map(member => {
      // Find active tasks for this member
      const memberTasks = tasks.filter(t => t.assignee_id === member.id && t.status !== 'completed');
      const tasksAssigned = memberTasks.length;

      // Calculate derived status and workload
      let status: 'available' | 'busy' | 'away' | 'offline' = 'available';
      let workload = 0;

      if (tasksAssigned > 5) {
        status = 'busy';
        workload = 100; // Saturated
      } else if (tasksAssigned > 2) {
        status = 'busy';
        workload = 60 + (tasksAssigned * 10);
      } else if (tasksAssigned > 0) {
        status = 'available';
        workload = 10 + (tasksAssigned * 15);
      } else {
        status = 'available'; // or 'offline' if we had presence
        workload = 0;
      }

      // Check for overdue tasks
      const hasOverdue = memberTasks.some(t => t.end_date && new Date(t.end_date) < new Date());
      if (hasOverdue) {
        workload += 20; // Penalty
        status = 'busy';
      }

      return {
        id: member.id,
        name: member.full_name || member.email || 'Unknown',
        avatar: member.avatar_url,
        role: member.role,
        status,
        workload: Math.min(workload, 120), // Cap at 120%
        tasksAssigned,
        hoursAllocated: tasksAssigned * 8, // Rough estimate: 8h per task remaining
      };
    });

    const totalMembers = mappedMembers.length;
    const available = mappedMembers.filter(m => m.status === 'available').length;
    const overloaded = mappedMembers.filter(m => m.workload > 100).length;
    const totalLoad = mappedMembers.reduce((acc, m) => acc + m.workload, 0);
    const averageWorkload = totalMembers > 0 ? Math.round(totalLoad / totalMembers) : 0;

    return {
      members: mappedMembers,
      summary: {
        totalMembers,
        available,
        overloaded,
        averageWorkload
      }
    };
  }, [teamMembers, tasks]);

  // Local preferences state for when user is not authenticated
  const [localEnabledSections, setLocalEnabledSections] = useState<BriefingSectionId[]>(
    BRIEFING_SECTIONS.filter(s => s.defaultEnabled).map(s => s.id)
  );
  const [localSectionOrder, setLocalSectionOrder] = useState<BriefingSectionId[]>(
    BRIEFING_SECTIONS.map(s => s.id)
  );

  // Preferences hook
  const {
    preferences,
    loading: preferencesLoading,
    saving,
    toggleSection,
    reorderSections,
    savePreferences,
    resetToDefaults,
  } = useBriefingPreferences(null);

  // AI generation hook
  const { loading: generating, generateBriefing, briefingData } = useBriefingGeneration();

  const isGenerating = generating;

  // Combine local and remote preferences
  const effectiveEnabledSections = preferences?.enabled_sections || localEnabledSections;
  const effectiveSectionOrder = preferences?.section_order || localSectionOrder;

  const handleLocalToggle = (id: BriefingSectionId) => {
    if (preferences) {
      toggleSection(id);
    } else {
      setLocalEnabledSections(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    }
  };

  const handleLocalReorder = (newOrder: BriefingSectionId[]) => {
    if (preferences) {
      reorderSections(newOrder);
    } else {
      setLocalSectionOrder(newOrder);
    }
  };

  const handleSavePreferences = () => {
    if (!preferences) {
      // Simulate save for unauth
      toast({ title: "Preferences saved (Local)", description: "Settings saved to session." });
      setIsCustomizing(false);
    } else {
      savePreferences(effectiveEnabledSections, effectiveSectionOrder).then(() => setIsCustomizing(false));
    }
  };

  const handleReset = () => {
    if (preferences) resetToDefaults();
    else {
      setLocalEnabledSections(BRIEFING_SECTIONS.filter(s => s.defaultEnabled).map(s => s.id));
      setLocalSectionOrder(BRIEFING_SECTIONS.map(s => s.id));
    }
  };

  const handleRefresh = async () => {
    await generateBriefing(settings.id || '', effectiveEnabledSections, {
      risks: criticalRisks as unknown as Record<string, unknown>[],
      issues: criticalIssues as unknown as Record<string, unknown>[],
      project: settings as unknown as Record<string, unknown>
    });
    setLastUpdated(new Date());
  };

  // Convert map-based data to arrays for display - MEMOIZED for performance
  const criticalAlerts: any[] = useMemo(() => [
    ...criticalRisks.map(r => ({ id: r.id, type: 'warning', severity: 'critical', title: r.title, description: r.description || '', message: r.title, timestamp: r.created_at, source: 'Risk Register' })),
    ...criticalIssues.map(i => ({ id: i.id, type: 'critical', severity: 'critical', title: i.title, description: i.description || '', message: i.title, timestamp: i.created_at, source: 'Issue Register' })),
    ...overdueActionsList.map(a => ({ id: a.id, type: 'warning', severity: 'high', title: `Action Overdue: ${a.title}`, description: a.description || '', message: `Action Overdue: ${a.title}`, timestamp: a.created_at, source: 'Actions Register' })),
  ], [criticalRisks, criticalIssues, overdueActionsList]);

  const riskAssessmentData = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newRisks = risks.filter(r => r.created_at && new Date(r.created_at) > weekAgo);
    const escalated = risks.filter(r =>
      r.impact === 'critical' || r.impact === 'high'
    );
    return {
      totalRisks: risks.length,
      criticalRisks: criticalRisks.length,
      newRisksIdentified: newRisks as any[],
      escalatedRisks: escalated as any[],
      mitigationSuggestions: [],
      riskScore: {
        current: Math.min(100, Math.round(30 + criticalRisks.length * 10 + openRisks.length * 2)),
        previous: 62,
        trend: criticalRisks.length > 0 ? ('worsening' as const) : ('stable' as const)
      }
    };
  }, [risks, criticalRisks, openRisks]);

  const issuesData = useMemo(() => openIssues.map(i => ({
    id: i.id,
    title: i.title,
    priority: i.priority,
    status: i.status,
    assignee: i.assignee_name || 'Unassigned',
    dueDate: i.resolved_at || undefined
  })), [openIssues]);
  const issuesSummary = useMemo(() => ({ total: openIssues.length, critical: criticalIssues.length, new: 0, resolved: 0 }), [openIssues, criticalIssues]);

  // Convert arrays to Record<string, T> for sections expecting maps if needed, or update sections to accept arrays
  // NOTE: Maps removed as sections now accept arrays directly

  // Render section content based on ID
  const renderSectionContent = (sectionId: BriefingSectionId, isLoading: boolean = false) => {
    // Show skeleton while section is loading (sequential loading)
    if (isLoading) {
      return (
        <div className="space-y-3 p-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      );
    }

    switch (sectionId) {
      case 'critical-alerts':
        return <CriticalAlertsSection alerts={criticalAlerts} />;

      case 'ai-insights': {
        // Map API response to component props if available
        const aiSection = briefingData?.sections?.['ai-insights'];
        const insights = aiSection ?
          [
            // Map main summary as a prediction
            {
              id: 'summary',
              category: 'prediction' as const,
              title: 'AI Summary',
              description: aiSection.summary,
              confidence: aiSection.confidence
            },
            // Map individual insights
            ...aiSection.insights.map((insight: any, idx: number) => ({
              id: `insight-${idx}`,
              category: 'pattern' as const,
              title: 'Strategic Insight',
              description: insight,
              confidence: 0.85
            })),
            // Map recommendations
            ...aiSection.recommendations.map((rec: any, idx: number) => ({
              id: `rec-${idx}`,
              category: 'recommendation' as const,
              title: 'Recommendation',
              description: rec,
              confidence: 0.9
            }))
          ] : aiInsights.map(insight => ({
            ...insight,
            trend: insight.trend === 'neutral' ? 'stable' as const : insight.trend as 'up' | 'down' | 'stable' | undefined
          }));

        return (
          <AIInsightsSection
            insights={insights as any}
            summary={aiSection?.summary || "Here's what AI predicts for your project based on current trends and historical data."}
          />
        );
      }

      case 'profit-loss':
        return <ProfitLossSection data={profitLossData} />;
      case 'schedule-slippage':
        return <ScheduleSlippageSection data={scheduleData} />;
      case 'budget-analysis':
        return <BudgetAnalysisSection data={budgetData} />;
      case 'risk-assessment':
        return <RiskAssessmentSection data={riskAssessmentData} />;
      case 'actions-due':
        // Map DB actions to UI actions
        const uiActions = actions.map(a => ({
          id: a.id,
          title: a.title,
          assignee: a.owner_name || 'Unassigned',
          dueDate: a.due_date || new Date().toISOString(),
          status: mapActionStatus(a.status || 'pending'),
          priority: mapActionPriority(a.priority || 'medium'),
          source: 'Actions Register'
        }));
        return <ActionsSection actions={uiActions} />;
      case 'issues-summary':
        return <IssuesSection issues={issuesData as any} summary={issuesSummary} />;
      case 'meetings-today':
        return <MeetingsSection meetings={todaysMeetings as any} />;
      case 'recent-decisions':
        // Map DB decisions to UI decisions
        const uiDecisions = decisions.map(d => ({
          id: d.id,
          title: d.title,
          description: d.decision || '',
          status: mapDecisionStatus(d.status || 'pending'),
          owner: d.owner_name || 'Project Manager',
          date: d.date || d.created_at,
          impact: mapDecisionImpact(d.impact || 'medium')
        }));
        return <DecisionsSection decisions={uiDecisions} />;
      case 'team-availability':
        return <TeamAvailabilitySection members={teamAvailability.members} summary={teamAvailability.summary} />;
      default: {
        // Unknown section key — this means a persisted preference references a section that
        // no longer exists. Log it and guide the user to reset their preferences.
        console.warn(`[MorningBriefingView] Unknown section key: "${sectionId}". Valid keys: critical-alerts, ai-insights, profit-loss, schedule-slippage, budget-analysis, risk-assessment, actions-due, issues-summary, meetings-today, recent-decisions, team-availability`);
        return (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Unknown section: <code className="bg-muted px-1 rounded text-xs">{sectionId}</code></p>
            <p className="text-xs text-muted-foreground">This section may have been removed. Reset your briefing preferences to restore the default layout.</p>
          </div>
        );
      }
    }
  };

  // Ordered enabled sections
  const orderedSections = useMemo(() => {
    const order = effectiveSectionOrder;
    const enabled = effectiveEnabledSections;
    return order.filter(id => enabled.includes(id));
  }, [effectiveSectionOrder, effectiveEnabledSections]);

  const isLoading = loadingFinancials || loadingTasks || loadingMeetings || preferencesLoading || loadingTeam;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-auto p-6 space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 rounded-xl bg-primary/20 shrink-0 hidden sm:block">
              <Sun className="h-8 w-8 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Morning Briefing
                <Sparkles className="h-5 w-5 text-primary animate-pulse shrink-0" />
              </h1>
              <p className="text-muted-foreground truncate">
                Good morning! Here's your daily briefing for {settings.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BriefingSettingsPanel
              enabledSections={effectiveEnabledSections}
              sectionOrder={effectiveSectionOrder}
              onToggleSection={handleLocalToggle}
              onReorderSections={handleLocalReorder}
              onSave={handleSavePreferences}
              onReset={handleReset}
              saving={saving}
              isCustomizing={isCustomizing}
              onToggleCustomizing={() => setIsCustomizing(prev => !prev)}
            />
            <Button variant="default" onClick={handleRefresh} disabled={isGenerating}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isGenerating && 'animate-spin')} />
              Refresh Briefing
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="w-full"> {/* Removed max-w-7xl to utilize full width */}
          {orderedSections.length > 0 ? (
            <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div>}>
              {isResizable ? (
                <ResizableBriefingLayout
                  sections={orderedSections}
                  renderContent={renderSectionContent}
                  isGenerating={isGenerating}
                  lastUpdated={lastUpdated}
                  onRefresh={handleRefresh}
                />
              ) : (
                <FlexibleBriefingGrid
                  sections={orderedSections}
                  renderContent={renderSectionContent}
                  isGenerating={isGenerating}
                  lastUpdated={lastUpdated}
                  onRefresh={handleRefresh}
                  isCustomizing={isCustomizing}
                  emptySections={criticalAlerts.length === 0 ? ['critical-alerts'] : []}
                />
              )}
            </Suspense>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No sections enabled</h3>
              <p className="text-sm">Click "Customize" to select which sections to display in your briefing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
