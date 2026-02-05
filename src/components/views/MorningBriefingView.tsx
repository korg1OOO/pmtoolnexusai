import React, { useState, useMemo } from 'react';
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

// Section Components
import { CriticalAlertsSection } from '@/components/briefing/sections/CriticalAlertsSection';
import { AIInsightsSection } from '@/components/briefing/sections/AIInsightsSection';
import { ProfitLossSection } from '@/components/briefing/sections/ProfitLossSection';
import { ScheduleSlippageSection } from '@/components/briefing/sections/ScheduleSlippageSection';
import { RiskAssessmentSection } from '@/components/briefing/sections/RiskAssessmentSection';
import { ActionsSection } from '@/components/briefing/sections/ActionsSection';
import { IssuesSection } from '@/components/briefing/sections/IssuesSection';
import { MeetingsSection } from '@/components/briefing/sections/MeetingsSection';
import { DecisionsSection } from '@/components/briefing/sections/DecisionsSection';
import { TeamAvailabilitySection } from '@/components/briefing/sections/TeamAvailabilitySection';
import { BudgetAnalysisSection } from '@/components/briefing/sections/BudgetAnalysisSection';

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

// Mocks for sections not yet wired (Static only)
const mockAIInsights = [
  { id: '1', category: 'prediction' as const, title: 'Sprint Completion Forecast', description: 'Based on current velocity, Sprint 12 is likely to complete 2 days ahead of schedule.', trend: 'up' as const, confidence: 0.85 },
  { id: '2', category: 'recommendation' as const, title: 'Resource Reallocation', description: 'Consider reallocating resources from Phase 3 to Phase 4 to mitigate testing risks.', confidence: 0.78 },
  { id: '3', category: 'warning' as const, title: 'Integration Bottleneck', description: 'Integration testing bottleneck predicted in Week 3 - recommend starting early.', trend: 'down' as const, confidence: 0.82 },
  { id: '4', category: 'pattern' as const, title: 'Historical Trend', description: 'Similar projects have experienced 15-20% scope creep at this stage. Monitor change requests closely.', confidence: 0.75 },
];

interface MorningBriefingViewProps {
  demo?: boolean;
}

export function MorningBriefingView({ demo = false }: MorningBriefingViewProps) {
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
  const { budget, isLoading: loadingFinancials } = useFinancials(settings.id);
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(settings.id);
  const { meetings, isLoading: loadingMeetings } = useMeetings(settings.id);
  const { teamMembers } = useTeamMembers(settings.id);
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
    const burnRate = 25000; // Hardcoded default for calculation until time-series data

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
  }, [budget]);

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
          isCritical: t.priority === 'high' || t.priority === 'urgent',
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
  const effectiveEnabledSections = preferences?.enabledSections || localEnabledSections;
  const effectiveSectionOrder = preferences?.sectionOrder || localSectionOrder;

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
      savePreferences().then(() => setIsCustomizing(false));
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
    await generateBriefing({
      risks: criticalRisks,
      issues: criticalIssues,
      project: settings // Wired to real project context
    });
    setLastUpdated(new Date());
  };

  // Convert map-based data to arrays for display
  const criticalAlerts = [
    ...criticalRisks.map(r => ({ id: r.id, type: 'risk' as const, severity: 'critical' as const, message: r.title, timestamp: r.created_at })),
    ...criticalIssues.map(i => ({ id: i.id, type: 'issue' as const, severity: 'critical' as const, message: i.title, timestamp: i.created_at })),
    ...overdueActionsList.map(a => ({ id: a.id, type: 'blocker' as const, severity: 'high' as const, message: `Action Overdue: ${a.title}`, timestamp: a.created_at })),
  ];

  const riskAssessmentData = {
    totalRisks: risks.length,
    criticalRisks: criticalRisks.length,
    newRisksIdentified: [], // Wired to API in future, placeholder for now to prevent crash
    escalatedRisks: [], // Wired to API in future
    mitigationSuggestions: [], // Wired to API in future
    riskScore: {
      current: 65,
      previous: 62,
      trend: 'worsening' as const
    }
  };

  const issuesData = openIssues.map(i => ({
    id: i.id,
    title: i.title,
    priority: i.priority,
    status: i.status,
    assignee: i.assignee_id || 'Unassigned',
    dueDate: i.due_date || undefined
  }));
  const issuesSummary = { totalOpen: openIssues.length, criticalCount: criticalIssues.length, avgResolutionTime: '3.2 days' };

  // Convert arrays to Record<string, T> for sections expecting maps if needed, or update sections to accept arrays
  // NOTE: Maps removed as sections now accept arrays directly

  // Render section content based on ID
  const renderSectionContent = (sectionId: BriefingSectionId) => {
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
          ] : mockAIInsights;

        return (
          <AIInsightsSection
            insights={insights}
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
          assignee: a.assignee_id || 'Unassigned',
          dueDate: a.due_date || new Date().toISOString(),
          status: mapActionStatus(a.status),
          priority: mapActionPriority(a.priority),
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
          description: d.description || '',
          status: mapDecisionStatus(d.status),
          owner: d.owner?.full_name || 'Project Manager',
          date: d.decision_date || d.created_at,
          impact: mapDecisionImpact(d.impact)
        }));
        return <DecisionsSection decisions={uiDecisions} />;
      case 'team-availability':
        return <TeamAvailabilitySection members={teamAvailability.members} summary={teamAvailability.summary} />;
      default:
        return <p className="text-sm text-muted-foreground">Section content coming soon...</p>;
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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Sun className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Morning Briefing
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </h1>
              <p className="text-muted-foreground">
                Good morning! Here's your daily briefing for {settings.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResizable(prev => !prev)}
              className={cn(isResizable && "bg-primary/10 border-primary/30 text-primary")}
            >
              <Layout className="h-4 w-4 mr-2" />
              {isResizable ? 'Standard View' : 'Resizable View'}
            </Button>
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
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {orderedSections.length > 0 ? (
            isResizable ? (
              <ResizableBriefingLayout
                sections={orderedSections}
                renderContent={renderSectionContent}
                isGenerating={isGenerating}
                preferences={preferences}
              />
            ) : (
              <FlexibleBriefingGrid
                sections={orderedSections}
                renderContent={renderSectionContent}
                isGenerating={isGenerating}
                lastUpdated={lastUpdated}
                onRefresh={handleRefresh}
                isCustomizing={isCustomizing}
              />
            )
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
