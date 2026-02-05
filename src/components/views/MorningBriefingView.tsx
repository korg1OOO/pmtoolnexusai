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
import { mockProject, mockMeetings, mockResources as mockTeamMembers } from '@/data/mockData'; // Keeping some mocks for non-scoped items

import {
  BriefingSettingsPanel,
  useBriefingPreferences,
  BRIEFING_SECTIONS,
  BriefingSectionId,
} from '@/components/briefing';
import { useBriefingGeneration } from '@/components/briefing/hooks/useBriefingGeneration';
import { FlexibleBriefingGrid } from '@/components/briefing/FlexibleBriefingGrid';

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
import { useRisks, Risk as DbRisk } from '@/hooks/useRisks';
import { useIssues, Issue as DbIssue } from '@/hooks/useIssues';
import { useDecisions, Decision as DbDecision } from '@/hooks/useDecisions';
import { useActions, Action as DbAction } from '@/hooks/useActions';

// Mocks for sections not yet wired
const mockProfitLossData = {
  expectedProfit: 125000,
  expectedLoss: 45000,
  currentBurnRate: 28500,
  projectedCompletion: 450000,
  scenarios: { optimistic: 95000, likely: 80000, pessimistic: 45000 },
  riskFactors: ['Resource overallocation increasing costs', 'Scope creep adding unplanned work', 'Vendor delays affecting timeline'],
  budgetUtilization: 72,
};

const mockScheduleSlippageData = {
  totalSlippageDays: 5,
  criticalPathChanged: true,
  slippingTasks: [
    { id: '1', name: 'API Integration', baselineEnd: new Date(Date.now() - 172800000).toISOString(), currentEnd: new Date(Date.now() + 259200000).toISOString(), slippageDays: 5, isCritical: true, impact: 'Delaying downstream testing phase' },
    { id: '2', name: 'Data Migration Scripts', baselineEnd: new Date(Date.now()).toISOString(), currentEnd: new Date(Date.now() + 172800000).toISOString(), slippageDays: 2, isCritical: false, impact: 'Minor impact on UAT start' },
  ],
  atRiskMilestones: [
    { name: 'Go-Live', date: new Date(Date.now() + 2592000000).toISOString(), riskLevel: 'medium' as const },
    { name: 'UAT Complete', date: new Date(Date.now() + 1728000000).toISOString(), riskLevel: 'high' as const },
  ],
  cascadingDelays: ['API Integration → Integration Testing → UAT', 'Data Migration → System Testing'],
};

const mockBudgetData = {
  totalBudget: 500000,
  spent: 225000,
  committed: 75000,
  remaining: 200000,
  burnRate: 28500,
  costVariance: -15000,
  scheduleVariance: -22000,
  estimateAtCompletion: 520000,
  estimateToComplete: 295000,
  forecasts: { optimistic: 480000, likely: 520000, pessimistic: 580000 },
};

const mockAIInsights = [
  { id: '1', category: 'prediction' as const, title: 'Sprint Completion Forecast', description: 'Based on current velocity, Sprint 12 is likely to complete 2 days ahead of schedule.', trend: 'up' as const, confidence: 0.85 },
  { id: '2', category: 'recommendation' as const, title: 'Resource Reallocation', description: 'Consider reallocating resources from Phase 3 to Phase 4 to mitigate testing risks.', confidence: 0.78 },
  { id: '3', category: 'warning' as const, title: 'Integration Bottleneck', description: 'Integration testing bottleneck predicted in Week 3 - recommend starting early.', trend: 'down' as const, confidence: 0.82 },
  { id: '4', category: 'pattern' as const, title: 'Historical Trend', description: 'Similar projects have experienced 15-20% scope creep at this stage. Monitor change requests closely.', confidence: 0.75 },
];

const mockMeetingsToday = [
  { id: '1', title: 'Daily Standup', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 1800000).toISOString(), type: 'online' as const, participants: 8, status: 'in-progress' as const, meetingLink: 'https://meet.google.com' },
  { id: '2', title: 'Stakeholder Review', startTime: new Date(Date.now() + 7200000).toISOString(), endTime: new Date(Date.now() + 10800000).toISOString(), type: 'hybrid' as const, participants: 12, status: 'upcoming' as const, location: 'Conference Room A' },
  { id: '3', title: 'Sprint Planning', startTime: new Date(Date.now() + 14400000).toISOString(), endTime: new Date(Date.now() + 18000000).toISOString(), type: 'online' as const, participants: 6, status: 'upcoming' as const, meetingLink: 'https://zoom.us' },
];

interface MorningBriefingViewProps {
  demo?: boolean;
}

export function MorningBriefingView({ demo = false }: MorningBriefingViewProps) {
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Hook Data
  const { risks, criticalRisks, openRisks } = useRisks();
  const { issues, criticalIssues, openIssues } = useIssues();
  const { decisions, pendingDecisions } = useDecisions();
  const { actions, overdueActions } = useActions();

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
  const { loading: generating, generateBriefing } = useBriefingGeneration();

  // Use local state if preferences not loaded (e.g., user not authenticated)
  const effectiveEnabledSections = demo ? BRIEFING_SECTIONS.map(s => s.id) : (preferences?.enabled_sections ?? localEnabledSections);
  const effectiveSectionOrder = demo ? BRIEFING_SECTIONS.map(s => s.id) : (preferences?.section_order ?? localSectionOrder);

  const isLoading = !demo && preferencesLoading;
  const isGenerating = !demo && generating;

  // --- Data Mapping Logic ---

  // 1. Critical Alerts (Aggregated from Risks, Issues, Actions)
  const criticalAlerts = useMemo(() => {
    const alerts: any[] = [];

    // Critical Risks
    criticalRisks.forEach(r => {
      alerts.push({
        id: `risk-${r.id}`,
        type: r.impact === 'critical' ? 'critical' : 'warning',
        title: `Risk: ${r.title}`,
        description: r.description || `High impact risk in ${r.category || 'project'}`,
        source: 'Risk Register',
        timestamp: r.created_at,
      });
    });

    // Critical Issues
    criticalIssues.forEach(i => {
      alerts.push({
        id: `issue-${i.id}`,
        type: i.severity === 'critical' ? 'critical' : 'warning',
        title: `Issue: ${i.title}`,
        description: i.description || `Critical issue reported by ${i.reporter_name}`,
        source: 'Issue Tracker',
        timestamp: i.created_at,
      });
    });

    // Overdue Actions
    overdueActions.forEach(a => {
      alerts.push({
        id: `action-${a.id}`,
        type: 'warning',
        title: `Overdue: ${a.title}`,
        description: `Action overdue since ${new Date(a.due_date!).toLocaleDateString()}`,
        source: 'Action Log',
        timestamp: a.updated_at,
      });
    });

    return alerts.slice(0, 5); // Limit to top 5
  }, [criticalRisks, criticalIssues, overdueActions]);

  // 2. Risk Assessment Data
  const riskAssessmentData = useMemo(() => {
    const newRisks = risks.filter(r => {
      const created = new Date(r.created_at);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return created > oneWeekAgo;
    });

    return {
      totalRisks: risks.length,
      criticalRisks: criticalRisks.length,
      newRisksIdentified: newRisks.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        probability: r.probability,
        impact: r.impact,
        status: r.status,
        trending: 'stable' as const, // Placeholder logic
      })),
      escalatedRisks: criticalRisks.slice(0, 2).map(r => ({ // Show top critical as escalated for now
        id: r.id,
        title: r.title,
        category: r.category || 'General',
        probability: r.probability,
        impact: r.impact,
        status: r.status,
        trending: 'up' as const,
      })),
      mitigationSuggestions: [], // AI suggested, keeping empty for now
      riskScore: { current: 100 - (risks.length * 2), previous: 90, trend: 'worsening' as const }, // Mock scoring
    };
  }, [risks, criticalRisks]);

  // 3. Issues Data
  const issuesData = useMemo(() => {
    return issues.map(i => ({
      id: i.id,
      title: i.title,
      severity: i.severity as any,
      status: i.status as any,
      owner: i.assignee_name || 'Unassigned',
      createdDate: i.created_at,
      trending: 'stable' as const,
    }));
  }, [issues]);

  const issuesSummary = {
    total: issues.length,
    critical: criticalIssues.length,
    new: issues.filter(i => new Date(i.created_at) > new Date(Date.now() - 86400000)).length,
    resolved: issues.filter(i => i.status === 'resolved' || i.status === 'closed').length,
  };

  // 4. Decisions Data
  const decisionsMap = useMemo(() => {
    return decisions.map(d => ({
      id: d.id,
      title: d.title,
      description: d.decision,
      status: d.status,
      owner: d.owner_name || 'Unassigned',
      date: d.date,
      impact: d.impact ? (d.impact.toLowerCase().includes('high') ? 'high' : 'medium') : 'medium',
    }));
  }, [decisions]);

  // 5. Actions Data
  const actionsMap = useMemo(() => {
    return actions.map(a => ({
      id: a.id,
      title: a.title,
      assignee: a.owner_name || 'Unassigned',
      dueDate: a.due_date || new Date().toISOString(),
      status: a.status,
      priority: a.priority,
      source: a.source_type || 'Manual',
    }));
  }, [actions]);

  // Handle refresh - triggers AI generation
  const handleRefresh = async () => {
    setLastUpdated(new Date());

    if (!preferences) return;

    // Gather project data for AI analysis
    const projectData = {
      project: mockProject,
      tasks: [], // Would come from real data
      risks: risks,
      issues: issues,
      decisions: decisions,
      meetings: mockMeetings,
      resources: mockTeamMembers,
      financials: mockBudgetData,
    };

    await generateBriefing(
      mockProject.id,
      preferences.enabled_sections,
      projectData
    );
  };

  // Handle save preferences
  const handleSavePreferences = () => {
    if (preferences) {
      savePreferences(preferences.enabled_sections, preferences.section_order);
    }
  };

  // Handle local toggle when not authenticated
  const handleLocalToggle = (sectionId: BriefingSectionId) => {
    if (preferences) {
      toggleSection(sectionId);
    } else {
      setLocalEnabledSections(prev =>
        prev.includes(sectionId)
          ? prev.filter(id => id !== sectionId)
          : [...prev, sectionId]
      );
    }
  };

  // Handle local reorder when not authenticated
  const handleLocalReorder = (newOrder: BriefingSectionId[]) => {
    if (preferences) {
      reorderSections(newOrder);
    } else {
      setLocalSectionOrder(newOrder);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (preferences) {
      resetToDefaults();
    } else {
      setLocalEnabledSections(BRIEFING_SECTIONS.filter(s => s.defaultEnabled).map(s => s.id));
      setLocalSectionOrder(BRIEFING_SECTIONS.map(s => s.id));
    }
  };

  // Render section content based on ID
  const renderSectionContent = (sectionId: BriefingSectionId) => {
    switch (sectionId) {
      case 'critical-alerts':
        return <CriticalAlertsSection alerts={criticalAlerts} />;
      case 'ai-insights':
        return <AIInsightsSection insights={mockAIInsights} summary="Here's what AI predicts for your project based on current trends and historical data." />;
      case 'profit-loss':
        return <ProfitLossSection data={mockProfitLossData} />;
      case 'schedule-slippage':
        return <ScheduleSlippageSection data={mockScheduleSlippageData} />;
      case 'budget-analysis':
        return <BudgetAnalysisSection data={mockBudgetData} />;
      case 'risk-assessment':
        return <RiskAssessmentSection data={riskAssessmentData} />;
      case 'actions-due':
        return <ActionsSection actions={actionsMap as any} />;
      case 'issues-summary':
        return <IssuesSection issues={issuesData as any} summary={issuesSummary} />;
      case 'meetings-today':
        return <MeetingsSection meetings={mockMeetingsToday} />;
      case 'recent-decisions':
        return <DecisionsSection decisions={decisionsMap as any} />;
      case 'team-availability':
        return <TeamAvailabilitySection members={mockTeamMembers} summary={{ totalMembers: 12, available: 8, overloaded: 2, averageWorkload: 78 }} />;
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
                Good morning! Here's your daily briefing for {mockProject.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <FlexibleBriefingGrid
              sections={orderedSections}
              renderContent={renderSectionContent}
              isGenerating={isGenerating}
              lastUpdated={lastUpdated}
              onRefresh={handleRefresh}
              isCustomizing={isCustomizing}
            />
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
