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
import { mockProject, mockRisks, mockMeetings } from '@/data/mockData';

import {
  BriefingSectionCard,
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

// Mock data for sections (will be replaced by real data and AI generation)
const mockCriticalAlerts = [
  {
    id: '1',
    type: 'critical' as const,
    title: 'Data Migration Risk Escalated',
    description: 'Risk level increased from MEDIUM to HIGH due to complexity findings',
    source: 'Risk Register',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'warning' as const,
    title: 'Milestone Deadline Approaching',
    description: 'Implementation Phase milestone due in 14 days',
    source: 'Schedule',
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'warning' as const,
    title: 'Overdue Actions',
    description: '3 action items require immediate attention',
    source: 'Action Log',
    timestamp: new Date().toISOString(),
  },
];

const mockActions = [
  { id: '1', title: 'Review API Gateway configuration', assignee: 'Mike Johnson', dueDate: new Date().toISOString(), status: 'open' as const, priority: 'high' as const, source: 'Meeting' },
  { id: '2', title: 'Complete data validation scripts', assignee: 'Emily Brown', dueDate: new Date(Date.now() - 86400000).toISOString(), status: 'overdue' as const, priority: 'critical' as const, source: 'Sprint' },
  { id: '3', title: 'Update stakeholder presentation', assignee: 'Sarah Mitchell', dueDate: new Date(Date.now() + 86400000).toISOString(), status: 'in-progress' as const, priority: 'medium' as const, source: 'Task' },
];

const mockIssues = [
  { id: '1', title: 'API Integration timeout issues', severity: 'high' as const, status: 'open' as const, owner: 'Mike Johnson', createdDate: new Date().toISOString(), trending: 'escalating' as const },
  { id: '2', title: 'Database performance degradation', severity: 'critical' as const, status: 'in-progress' as const, owner: 'Emily Brown', createdDate: new Date().toISOString(), trending: 'stable' as const },
];

const mockDecisions = [
  { id: '1', title: 'Adopt microservices architecture', description: 'Team voted to move forward with microservices for Phase 2', status: 'approved' as const, owner: 'John Doe', date: new Date().toISOString(), impact: 'high' as const },
  { id: '2', title: 'Extend testing phase by 1 week', description: 'Requires stakeholder approval for timeline adjustment', status: 'pending' as const, owner: 'Jane Smith', date: new Date().toISOString(), impact: 'medium' as const },
];

const mockTeamMembers = [
  { id: '1', name: 'John Doe', role: 'Project Manager', status: 'available' as const, workload: 85, tasksAssigned: 12, hoursAllocated: 40 },
  { id: '2', name: 'Jane Smith', role: 'Tech Lead', status: 'busy' as const, workload: 110, tasksAssigned: 18, hoursAllocated: 48 },
  { id: '3', name: 'Mike Johnson', role: 'Developer', status: 'available' as const, workload: 70, tasksAssigned: 8, hoursAllocated: 32 },
  { id: '4', name: 'Emily Brown', role: 'QA Lead', status: 'away' as const, workload: 50, tasksAssigned: 5, hoursAllocated: 20 },
];

const mockMeetingsToday = [
  { id: '1', title: 'Daily Standup', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 1800000).toISOString(), type: 'online' as const, participants: 8, status: 'in-progress' as const, meetingLink: 'https://meet.google.com' },
  { id: '2', title: 'Stakeholder Review', startTime: new Date(Date.now() + 7200000).toISOString(), endTime: new Date(Date.now() + 10800000).toISOString(), type: 'hybrid' as const, participants: 12, status: 'upcoming' as const, location: 'Conference Room A' },
  { id: '3', title: 'Sprint Planning', startTime: new Date(Date.now() + 14400000).toISOString(), endTime: new Date(Date.now() + 18000000).toISOString(), type: 'online' as const, participants: 6, status: 'upcoming' as const, meetingLink: 'https://zoom.us' },
];

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

const mockRiskAssessmentData = {
  totalRisks: 12,
  criticalRisks: 3,
  newRisksIdentified: [
    { id: '1', title: 'Third-party API deprecation', category: 'Technical', probability: 'medium' as const, impact: 'high' as const, status: 'new', trending: 'up' as const },
  ],
  escalatedRisks: [
    { id: '2', title: 'Key resource availability', category: 'Resource', probability: 'high' as const, impact: 'high' as const, status: 'escalated', trending: 'up' as const },
  ],
  mitigationSuggestions: [
    { riskId: '2', riskTitle: 'Key resource availability', suggestion: 'Consider cross-training team members or engaging backup contractors to reduce single-point-of-failure risk.' },
  ],
  riskScore: { current: 72, previous: 65, trend: 'worsening' as const },
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

export function MorningBriefingView() {
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  // Local preferences state for when user is not authenticated
  const [localEnabledSections, setLocalEnabledSections] = useState<BriefingSectionId[]>(
    BRIEFING_SECTIONS.filter(s => s.defaultEnabled).map(s => s.id)
  );
  const [localSectionOrder, setLocalSectionOrder] = useState<BriefingSectionId[]>(
    BRIEFING_SECTIONS.map(s => s.id)
  );

  // Preferences hook - using null for global preferences (not project-specific for now)
  const {
    preferences,
    loading: preferencesLoading,
    saving,
    toggleSection,
    reorderSections,
    savePreferences,
    resetToDefaults,
    getOrderedSections,
  } = useBriefingPreferences(null);

  // AI generation hook
  const { loading: generating, briefingData, generateBriefing } = useBriefingGeneration();
  
  // Use local state if preferences not loaded (e.g., user not authenticated)
  const effectiveEnabledSections = preferences?.enabled_sections ?? localEnabledSections;
  const effectiveSectionOrder = preferences?.section_order ?? localSectionOrder;

  const isLoading = preferencesLoading;
  const isGenerating = generating;

  // Handle refresh - triggers AI generation
  const handleRefresh = async () => {
    setLastUpdated(new Date());
    
    if (!preferences) return;

    // Gather project data for AI analysis
    const projectData = {
      project: mockProject,
      tasks: [], // Would come from real data
      risks: mockRisks,
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

  // Get section config by ID
  const getSectionConfig = (id: BriefingSectionId) => {
    return BRIEFING_SECTIONS.find(s => s.id === id);
  };

  // Render section content based on ID
  const renderSectionContent = (sectionId: BriefingSectionId) => {
    switch (sectionId) {
      case 'critical-alerts':
        return <CriticalAlertsSection alerts={mockCriticalAlerts} />;
      case 'ai-insights':
        return <AIInsightsSection insights={mockAIInsights} summary="Here's what AI predicts for your project based on current trends and historical data." />;
      case 'profit-loss':
        return <ProfitLossSection data={mockProfitLossData} />;
      case 'schedule-slippage':
        return <ScheduleSlippageSection data={mockScheduleSlippageData} />;
      case 'budget-analysis':
        return <BudgetAnalysisSection data={mockBudgetData} />;
      case 'risk-assessment':
        return <RiskAssessmentSection data={mockRiskAssessmentData} />;
      case 'actions-due':
        return <ActionsSection actions={mockActions} />;
      case 'issues-summary':
        return <IssuesSection issues={mockIssues} summary={{ total: 8, critical: 2, new: 3, resolved: 5 }} />;
      case 'meetings-today':
        return <MeetingsSection meetings={mockMeetingsToday} />;
      case 'recent-decisions':
        return <DecisionsSection decisions={mockDecisions} />;
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
