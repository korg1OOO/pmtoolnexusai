import React from 'react';
import {
  BarChart3,
  Calendar,
  GitBranch,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  Target,
  CheckCircle2,
  Clock,
  MessageSquare,
  Folder,
  Presentation,
  Settings,
  Layout,
  ListTodo,
  Flag,
  Shield,
  Scale,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PageContextPanelProps {
  currentView: string;
  className?: string;
}

// View metadata mapping
const VIEW_CONTEXT: Record<string, {
  title: string;
  icon: React.ElementType;
  description: string;
  relevantData: string[];
  suggestedQuestions: string[];
}> = {
  'dashboard': {
    title: 'Project Dashboard',
    icon: Layout,
    description: 'Overview of project health, progress, and key metrics',
    relevantData: ['Overall progress', 'Key milestones', 'Team workload', 'Recent activity'],
    suggestedQuestions: [
      'How is the project performing overall?',
      'What are the main risks right now?',
      'Are we on track for the next milestone?',
    ],
  },
  'gantt': {
    title: 'Gantt Chart',
    icon: BarChart3,
    description: 'Task scheduling, dependencies, and critical path',
    relevantData: ['Critical path tasks', 'Task dependencies', 'Schedule float', 'Constraint violations'],
    suggestedQuestions: [
      'What tasks are on the critical path?',
      'Are there any scheduling conflicts?',
      'Which tasks have negative float?',
      'Optimize the schedule for earliest completion',
    ],
  },
  'project-plan': {
    title: 'Project Plan',
    icon: ListTodo,
    description: 'Task breakdown, assignments, and progress tracking',
    relevantData: ['Task hierarchy', 'Resource assignments', 'Progress status', 'Effort estimates'],
    suggestedQuestions: [
      'Which tasks are behind schedule?',
      'Who has the most workload?',
      'Auto-assign unassigned tasks',
      'Suggest task breakdown for this phase',
    ],
  },
  'sprints': {
    title: 'Sprint Board',
    icon: Target,
    description: 'Agile sprint management and team velocity',
    relevantData: ['Sprint backlog', 'Story points', 'Burndown trend', 'Team velocity'],
    suggestedQuestions: [
      'What is our sprint velocity trend?',
      'Are we on track to complete the sprint?',
      'Which stories are at risk?',
    ],
  },
  'risks': {
    title: 'Risk Register',
    icon: AlertTriangle,
    description: 'Project risks, impacts, and mitigation strategies',
    relevantData: ['Active risks', 'Risk scores', 'Mitigation actions', 'Risk trends'],
    suggestedQuestions: [
      'What are the top 5 risks by impact?',
      'Which risks need immediate attention?',
      'Suggest mitigation strategies',
      'Analyze risk exposure by category',
    ],
  },
  'issues': {
    title: 'Issues Register',
    icon: AlertTriangle,
    description: 'Active issues, resolutions, and escalations',
    relevantData: ['Open issues', 'Blocked items', 'Escalation status', 'Resolution history'],
    suggestedQuestions: [
      'What issues are blocking progress?',
      'Which issues need escalation?',
      'Summarize issue resolution trends',
    ],
  },
  'financials': {
    title: 'Financial Management',
    icon: DollarSign,
    description: 'Budget tracking, costs, and financial forecasting',
    relevantData: ['Budget status', 'Actual vs planned costs', 'Cost forecasts', 'Variance analysis'],
    suggestedQuestions: [
      'What is the current budget status?',
      'Where are we overspending?',
      'Forecast costs for the next quarter',
      'Analyze cost variance by work package',
    ],
  },
  'evm': {
    title: 'Earned Value Management',
    icon: TrendingUp,
    description: 'EVM metrics, performance indices, and forecasts',
    relevantData: ['CPI & SPI', 'EAC & ETC', 'Variance trends', 'Performance indices'],
    suggestedQuestions: [
      'What is our cost performance index?',
      'Calculate estimate at completion',
      'Explain the EVM trends',
    ],
  },
  'resources': {
    title: 'Resource Management',
    icon: Users,
    description: 'Team capacity, allocation, and workload balancing',
    relevantData: ['Resource allocation', 'Capacity utilization', 'Skills matrix', 'Availability'],
    suggestedQuestions: [
      'Who is overallocated?',
      'Suggest resource leveling options',
      'Which skills are we missing?',
      'Optimize resource assignments',
    ],
  },
  'meetings': {
    title: 'Meetings',
    icon: Calendar,
    description: 'Meeting management, notes, and action tracking',
    relevantData: ['Upcoming meetings', 'Action items', 'Decisions made', 'Meeting notes'],
    suggestedQuestions: [
      'What action items are overdue?',
      'Summarize recent meeting decisions',
      'Generate meeting minutes',
      'What decisions are pending?',
    ],
  },
  'calendar': {
    title: 'Calendar',
    icon: Calendar,
    description: 'Project calendar, milestones, and scheduling',
    relevantData: ['Upcoming milestones', 'Key dates', 'Holidays', 'Team availability'],
    suggestedQuestions: [
      'What milestones are coming up?',
      'Show me the project timeline',
      'Are there any scheduling conflicts?',
    ],
  },
  'communications': {
    title: 'Communications',
    icon: MessageSquare,
    description: 'Email, messages, and communication analysis',
    relevantData: ['Email threads', 'Stakeholder communications', 'Sentiment trends', 'Response times'],
    suggestedQuestions: [
      'Analyze stakeholder communication patterns',
      'Are there any concerning communication trends?',
      'Summarize key email threads',
    ],
  },
  'documents': {
    title: 'Document Center',
    icon: Folder,
    description: 'Project documentation and file management',
    relevantData: ['Recent documents', 'Pending approvals', 'Version history', 'Document categories'],
    suggestedQuestions: [
      'What documents need approval?',
      'Find documents related to architecture',
      'Generate a project status report',
    ],
  },
  'notes': {
    title: 'Project Notes',
    icon: FileText,
    description: 'Meeting notes, decisions, and knowledge base',
    relevantData: ['Recent notes', 'Linked items', 'Tags', 'Contributors'],
    suggestedQuestions: [
      'Summarize notes from last week',
      'Find notes mentioning security',
      'What decisions were documented?',
    ],
  },
  'presentations': {
    title: 'Presentations',
    icon: Presentation,
    description: 'Project presentations and slides',
    relevantData: ['Recent presentations', 'Slides', 'Templates'],
    suggestedQuestions: [
      'Generate an executive summary slide',
      'Create a status presentation',
      'Update the project timeline slide',
    ],
  },
  'stakeholders': {
    title: 'Stakeholder Register',
    icon: Users,
    description: 'Stakeholder analysis and engagement',
    relevantData: ['Key stakeholders', 'Power/interest matrix', 'Engagement strategies', 'Communication preferences'],
    suggestedQuestions: [
      'Who are the key decision makers?',
      'Analyze stakeholder engagement levels',
      'Suggest engagement strategies',
    ],
  },
  'milestones': {
    title: 'Milestones',
    icon: Flag,
    description: 'Project milestones and key deliverables',
    relevantData: ['Upcoming milestones', 'Milestone status', 'Dependencies', 'Completion criteria'],
    suggestedQuestions: [
      'Which milestones are at risk?',
      'What needs to happen for the next milestone?',
      'Show milestone dependencies',
    ],
  },
  'deliverables': {
    title: 'Deliverables',
    icon: CheckCircle2,
    description: 'Project deliverables and acceptance criteria',
    relevantData: ['Deliverable status', 'Acceptance criteria', 'Dependencies', 'Sign-offs'],
    suggestedQuestions: [
      'What deliverables are pending approval?',
      'Show deliverable dependencies',
      'Which deliverables are at risk?',
    ],
  },
  'change-requests': {
    title: 'Change Requests',
    icon: GitBranch,
    description: 'Change control and impact analysis',
    relevantData: ['Pending changes', 'Impact assessments', 'Approvals needed', 'Change history'],
    suggestedQuestions: [
      'What changes are pending approval?',
      'Analyze impact of pending changes',
      'Summarize change request history',
    ],
  },
  'tracking': {
    title: 'Project Tracking',
    icon: TrendingUp,
    description: 'Baseline comparison and variance analysis',
    relevantData: ['Baseline comparison', 'Variance analysis', 'Trend data', 'Performance metrics'],
    suggestedQuestions: [
      'How does current progress compare to baseline?',
      'What are the main variances?',
      'Explain the project trends',
    ],
  },
  'portfolio': {
    title: 'Portfolio View',
    icon: Layout,
    description: 'Multi-project portfolio overview',
    relevantData: ['Project status', 'Resource allocation', 'Portfolio health', 'Strategic alignment'],
    suggestedQuestions: [
      'Which projects are at risk?',
      'Show portfolio resource allocation',
      'Analyze portfolio health',
    ],
  },
  'strategic': {
    title: 'Strategic Dashboard',
    icon: Target,
    description: 'Strategic alignment and executive metrics',
    relevantData: ['Strategic objectives', 'KPIs', 'Executive summary', 'Value metrics'],
    suggestedQuestions: [
      'Generate an executive summary',
      'Analyze strategic alignment',
      'What are the key KPIs?',
    ],
  },
  'team-chat': {
    title: 'Team Chat',
    icon: MessageSquare,
    description: 'Team collaboration and messaging',
    relevantData: ['Recent messages', 'Active discussions', 'Mentions', 'Shared files'],
    suggestedQuestions: [
      'Summarize recent discussions',
      'What topics are being discussed?',
      'Find messages about deployment',
    ],
  },
  'decisions': {
    title: 'Decisions Log',
    icon: Scale,
    description: 'Project decisions and rationale',
    relevantData: ['Recent decisions', 'Pending decisions', 'Decision makers', 'Impact'],
    suggestedQuestions: [
      'What decisions are pending?',
      'Summarize recent decisions',
      'Who made what decisions?',
    ],
  },
  'actions': {
    title: 'Action Items',
    icon: CheckCircle2,
    description: 'Action items and task tracking',
    relevantData: ['Open actions', 'Overdue items', 'Owners', 'Due dates'],
    suggestedQuestions: [
      'What actions are overdue?',
      'Who has the most open actions?',
      'Show action completion trends',
    ],
  },
  'settings': {
    title: 'Settings',
    icon: Settings,
    description: 'Project and user settings',
    relevantData: ['Project configuration', 'User preferences', 'Integrations'],
    suggestedQuestions: [
      'What are the current project settings?',
      'Help me configure notifications',
    ],
  },
};

// Default context for unknown views
const DEFAULT_CONTEXT = {
  title: 'Project View',
  icon: Layout,
  description: 'General project management view',
  relevantData: ['Project data', 'Team activity', 'Recent changes'],
  suggestedQuestions: [
    'What is the project status?',
    'Show me recent activity',
    'What needs attention?',
  ],
};

export function PageContextPanel({ currentView, className }: PageContextPanelProps) {
  const context = VIEW_CONTEXT[currentView] || DEFAULT_CONTEXT;
  const IconComponent = context.icon;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Current Context Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <IconComponent className="h-4 w-4 text-primary" />
            {context.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <p className="text-xs text-muted-foreground mb-2">
            {context.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {context.relevantData.slice(0, 4).map((item, i) => (
              <Badge key={i} variant="secondary" className="text-xs py-0">
                {item}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export for use in GlobalAISidebar
export function getViewContext(view: string) {
  return VIEW_CONTEXT[view] || DEFAULT_CONTEXT;
}

export function getSuggestedQuestions(view: string): string[] {
  const context = VIEW_CONTEXT[view] || DEFAULT_CONTEXT;
  return context.suggestedQuestions;
}
