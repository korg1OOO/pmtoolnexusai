// Briefing section definitions and types

export type BriefingSectionId =
  | 'critical-alerts'
  | 'ai-insights'
  | 'profit-loss'
  | 'schedule-slippage'
  | 'budget-analysis'
  | 'risk-assessment'
  | 'actions-due'
  | 'issues-summary'
  | 'meetings-today'
  | 'recent-decisions'
  | 'team-availability'
  | 'communication-intelligence'
  | 'milestone-tracker'
  | 'resource-utilization';

export interface BriefingSection {
  id: BriefingSectionId;
  title: string;
  description: string;
  icon: string;
  isAIPowered: boolean;
  defaultEnabled: boolean;
  detailsRoute?: string;
}

export const BRIEFING_SECTIONS: BriefingSection[] = [
  {
    id: 'critical-alerts',
    title: 'Critical Alerts',
    description: 'Urgent items requiring immediate attention',
    icon: 'AlertTriangle',
    isAIPowered: false,
    defaultEnabled: true,
  },
  {
    id: 'ai-insights',
    title: 'AI Insights & Predictions',
    description: 'Schedule forecasts, bottleneck warnings, pattern recognition',
    icon: 'Brain',
    isAIPowered: true,
    defaultEnabled: true,
  },
  {
    id: 'profit-loss',
    title: 'Expected Profit/Loss',
    description: 'AI-calculated projection based on resource burn',
    icon: 'TrendingUp',
    isAIPowered: true,
    defaultEnabled: true,
  },
  {
    id: 'schedule-slippage',
    title: 'Schedule Slippage',
    description: 'Tasks slipping from baseline, critical path changes',
    icon: 'Clock',
    isAIPowered: true,
    defaultEnabled: true,
  },
  {
    id: 'budget-analysis',
    title: 'Budget & Financial Analysis',
    description: 'Burn rate, CV/SV, forecast to completion',
    icon: 'DollarSign',
    isAIPowered: true,
    defaultEnabled: true,
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment',
    description: 'Escalated risks with AI-suggested mitigations',
    icon: 'Shield',
    isAIPowered: true,
    defaultEnabled: true,
  },
  {
    id: 'actions-due',
    title: 'Actions Due',
    description: 'Overdue actions with SLA breach indicators',
    icon: 'CheckSquare',
    isAIPowered: false,
    defaultEnabled: true,
    detailsRoute: 'actions',
  },
  {
    id: 'issues-summary',
    title: 'Issues Summary',
    description: 'Open issues by severity with trending',
    icon: 'AlertCircle',
    isAIPowered: false,
    defaultEnabled: true,
    detailsRoute: 'issues',
  },
  {
    id: 'meetings-today',
    title: "Today's Meetings",
    description: 'Calendar for the day',
    icon: 'Calendar',
    isAIPowered: false,
    defaultEnabled: true,
    detailsRoute: 'meetings',
  },
  {
    id: 'recent-decisions',
    title: 'Recent Decisions',
    description: 'Decisions made and pending approval',
    icon: 'Gavel',
    isAIPowered: false,
    defaultEnabled: true,
    detailsRoute: 'decisions',
  },
  {
    id: 'team-availability',
    title: 'Team Availability',
    description: 'Member status and workload overview',
    icon: 'Users',
    isAIPowered: false,
    defaultEnabled: true,
    detailsRoute: 'resources',
  },
  {
    id: 'communication-intelligence',
    title: 'Communication Intelligence',
    description: 'Email/chat patterns and sentiment analysis',
    icon: 'MessageSquare',
    isAIPowered: true,
    defaultEnabled: false,
    detailsRoute: 'communications',
  },
  {
    id: 'milestone-tracker',
    title: 'Milestone Tracker',
    description: 'Upcoming and at-risk milestones',
    icon: 'Flag',
    isAIPowered: false,
    defaultEnabled: false,
    detailsRoute: 'milestones',
  },
  {
    id: 'resource-utilization',
    title: 'Resource Utilization',
    description: 'Team capacity heatmap',
    icon: 'BarChart3',
    isAIPowered: false,
    defaultEnabled: false,
    detailsRoute: 'resources',
  },
];

export const DEFAULT_ENABLED_SECTIONS: BriefingSectionId[] = BRIEFING_SECTIONS
  .filter(s => s.defaultEnabled)
  .map(s => s.id);

export const DEFAULT_SECTION_ORDER: BriefingSectionId[] = BRIEFING_SECTIONS.map(s => s.id);

export interface BriefingPreferences {
  id: string;
  user_id: string;
  project_id: string | null;
  enabled_sections: BriefingSectionId[];
  section_order: BriefingSectionId[];
  created_at: string;
  updated_at: string;
}

export interface BriefingData {
  sectionId: BriefingSectionId;
  loading: boolean;
  error?: string;
  data?: any;
  aiConfidence?: number;
  generatedAt?: string;
}

export interface AIBriefingResponse {
  sections: {
    [key in BriefingSectionId]?: {
      summary: string;
      insights: string[];
      recommendations: string[];
      metrics?: Record<string, number | string>;
      confidence: number;
    };
  };
  generatedAt: string;
  projectContext: {
    projectName: string;
    healthStatus: string;
    daysRemaining: number;
  };
}
