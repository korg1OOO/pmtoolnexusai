import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Users, 
  DollarSign,
  Target,
  Calendar,
  FileText,
  Gauge,
  Zap,
  Shield
} from 'lucide-react';

export type EmbeddableComponentCategory = 
  | 'dashboard' 
  | 'executive' 
  | 'strategic' 
  | 'briefing' 
  | 'reports' 
  | 'financial';

export type EmbeddableComponentType = 
  | 'chart' 
  | 'kpi' 
  | 'table' 
  | 'list' 
  | 'gauge' 
  | 'timeline';

export interface EmbeddableComponent {
  id: string;
  name: string;
  description: string;
  category: EmbeddableComponentCategory;
  type: EmbeddableComponentType;
  icon: React.ElementType;
  sourceModule: string;
  defaultSize: { width: number; height: number };
  dataKeys?: string[];
  refreshable: boolean;
  previewImage?: string;
}

export interface EmbeddedComponentData {
  componentId: string;
  componentType: string;
  sourceModule: string;
  position: { x: number; y: number; width: number; height: number };
  dataSnapshot: Record<string, unknown>;
  snapshotAt: string;
  isLive: boolean;
}

// Registry of all embeddable components
export const embeddableComponents: EmbeddableComponent[] = [
  // Dashboard Components
  {
    id: 'project-health-pie',
    name: 'Project Health Distribution',
    description: 'Pie chart showing project status breakdown (On Track, At Risk, Critical)',
    category: 'dashboard',
    type: 'chart',
    icon: PieChart,
    sourceModule: 'dashboard',
    defaultSize: { width: 400, height: 300 },
    dataKeys: ['projectStatus'],
    refreshable: true,
  },
  {
    id: 'budget-progress',
    name: 'Budget Progress',
    description: 'Progress bar showing budget utilization vs allocated',
    category: 'dashboard',
    type: 'gauge',
    icon: DollarSign,
    sourceModule: 'dashboard',
    defaultSize: { width: 300, height: 150 },
    dataKeys: ['budgetSpent', 'budgetTotal'],
    refreshable: true,
  },
  {
    id: 'schedule-progress',
    name: 'Schedule Progress',
    description: 'Progress ring showing project completion percentage',
    category: 'dashboard',
    type: 'gauge',
    icon: Clock,
    sourceModule: 'dashboard',
    defaultSize: { width: 200, height: 200 },
    dataKeys: ['completedTasks', 'totalTasks'],
    refreshable: true,
  },
  {
    id: 'active-risks-list',
    name: 'Active Risks',
    description: 'List of current active risks with severity indicators',
    category: 'dashboard',
    type: 'list',
    icon: AlertTriangle,
    sourceModule: 'dashboard',
    defaultSize: { width: 350, height: 250 },
    dataKeys: ['risks'],
    refreshable: true,
  },
  {
    id: 'in-progress-tasks',
    name: 'In-Progress Work',
    description: 'List of currently active tasks and their owners',
    category: 'dashboard',
    type: 'list',
    icon: Activity,
    sourceModule: 'dashboard',
    defaultSize: { width: 400, height: 300 },
    dataKeys: ['inProgressTasks'],
    refreshable: true,
  },

  // Executive Dashboard Components
  {
    id: 'portfolio-kpis',
    name: 'Portfolio KPIs',
    description: 'Key performance indicators across all projects',
    category: 'executive',
    type: 'kpi',
    icon: Gauge,
    sourceModule: 'executive-dashboard',
    defaultSize: { width: 600, height: 150 },
    dataKeys: ['portfolioMetrics'],
    refreshable: true,
  },
  {
    id: 'budget-trend-chart',
    name: 'Budget vs Actuals Trend',
    description: 'Area chart showing budget trends over time',
    category: 'executive',
    type: 'chart',
    icon: TrendingUp,
    sourceModule: 'executive-dashboard',
    defaultSize: { width: 500, height: 300 },
    dataKeys: ['budgetTrend'],
    refreshable: true,
  },
  {
    id: 'program-performance',
    name: 'Program Performance',
    description: 'Bar chart comparing program-level metrics',
    category: 'executive',
    type: 'chart',
    icon: BarChart3,
    sourceModule: 'executive-dashboard',
    defaultSize: { width: 500, height: 300 },
    dataKeys: ['programMetrics'],
    refreshable: true,
  },
  {
    id: 'resource-utilization-heatmap',
    name: 'Resource Utilization',
    description: 'Heatmap showing team capacity and allocation',
    category: 'executive',
    type: 'chart',
    icon: Users,
    sourceModule: 'executive-dashboard',
    defaultSize: { width: 600, height: 350 },
    dataKeys: ['resourceUtilization'],
    refreshable: true,
  },

  // Strategic Dashboard Components
  {
    id: 'business-case-summary',
    name: 'Business Case Summary',
    description: 'Overview of project business justification and ROI',
    category: 'strategic',
    type: 'kpi',
    icon: Target,
    sourceModule: 'strategic-dashboard',
    defaultSize: { width: 400, height: 200 },
    dataKeys: ['businessCase'],
    refreshable: true,
  },
  {
    id: 'ai-risk-discovery',
    name: 'AI Risk Discovery',
    description: 'AI-identified risks and recommendations',
    category: 'strategic',
    type: 'list',
    icon: Zap,
    sourceModule: 'strategic-dashboard',
    defaultSize: { width: 400, height: 300 },
    dataKeys: ['aiRisks'],
    refreshable: true,
  },
  {
    id: 'value-engineering',
    name: 'Value Engineering Score',
    description: 'Project value optimization metrics',
    category: 'strategic',
    type: 'gauge',
    icon: TrendingUp,
    sourceModule: 'strategic-dashboard',
    defaultSize: { width: 300, height: 200 },
    dataKeys: ['valueScore'],
    refreshable: true,
  },
  {
    id: 'stakeholder-map',
    name: 'Stakeholder Influence Map',
    description: 'Visual mapping of stakeholder power and interest',
    category: 'strategic',
    type: 'chart',
    icon: Users,
    sourceModule: 'strategic-dashboard',
    defaultSize: { width: 450, height: 350 },
    dataKeys: ['stakeholders'],
    refreshable: true,
  },

  // Morning Briefing Components
  {
    id: 'critical-alerts',
    name: 'Critical Alerts',
    description: 'High-priority items requiring immediate attention',
    category: 'briefing',
    type: 'list',
    icon: AlertTriangle,
    sourceModule: 'morning-briefing',
    defaultSize: { width: 400, height: 250 },
    dataKeys: ['criticalAlerts'],
    refreshable: true,
  },
  {
    id: 'schedule-slippage',
    name: 'Schedule Slippage',
    description: 'Tasks at risk of missing deadlines',
    category: 'briefing',
    type: 'list',
    icon: Clock,
    sourceModule: 'morning-briefing',
    defaultSize: { width: 400, height: 250 },
    dataKeys: ['slippingTasks'],
    refreshable: true,
  },
  {
    id: 'ai-insights',
    name: 'AI Insights',
    description: 'AI-generated project insights and recommendations',
    category: 'briefing',
    type: 'list',
    icon: Zap,
    sourceModule: 'morning-briefing',
    defaultSize: { width: 400, height: 300 },
    dataKeys: ['aiInsights'],
    refreshable: true,
  },
  {
    id: 'todays-meetings',
    name: "Today's Meetings",
    description: 'Scheduled meetings for the day',
    category: 'briefing',
    type: 'list',
    icon: Calendar,
    sourceModule: 'morning-briefing',
    defaultSize: { width: 350, height: 250 },
    dataKeys: ['todayMeetings'],
    refreshable: true,
  },
  {
    id: 'profit-loss-forecast',
    name: 'Profit/Loss Forecast',
    description: 'Financial projection based on current burn rate',
    category: 'briefing',
    type: 'chart',
    icon: DollarSign,
    sourceModule: 'morning-briefing',
    defaultSize: { width: 450, height: 300 },
    dataKeys: ['profitLoss'],
    refreshable: true,
  },

  // Reports Components
  {
    id: 'sprint-velocity',
    name: 'Sprint Velocity',
    description: 'Bar chart showing sprint-over-sprint velocity',
    category: 'reports',
    type: 'chart',
    icon: BarChart3,
    sourceModule: 'reports',
    defaultSize: { width: 500, height: 300 },
    dataKeys: ['sprintVelocity'],
    refreshable: true,
  },
  {
    id: 'burndown-chart',
    name: 'Burndown Chart',
    description: 'Sprint or release burndown visualization',
    category: 'reports',
    type: 'chart',
    icon: TrendingUp,
    sourceModule: 'reports',
    defaultSize: { width: 500, height: 300 },
    dataKeys: ['burndown'],
    refreshable: true,
  },
  {
    id: 'risk-register-summary',
    name: 'Risk Register Summary',
    description: 'Summary table of all project risks',
    category: 'reports',
    type: 'table',
    icon: Shield,
    sourceModule: 'reports',
    defaultSize: { width: 600, height: 350 },
    dataKeys: ['riskRegister'],
    refreshable: true,
  },

  // Financial Components
  {
    id: 'evm-metrics',
    name: 'EVM Metrics',
    description: 'Earned Value Management KPIs (SPI, CPI, EAC)',
    category: 'financial',
    type: 'kpi',
    icon: Gauge,
    sourceModule: 'evm',
    defaultSize: { width: 500, height: 150 },
    dataKeys: ['evmMetrics'],
    refreshable: true,
  },
  {
    id: 'cost-variance-chart',
    name: 'Cost Variance Analysis',
    description: 'Chart showing cost performance over time',
    category: 'financial',
    type: 'chart',
    icon: DollarSign,
    sourceModule: 'financials',
    defaultSize: { width: 500, height: 300 },
    dataKeys: ['costVariance'],
    refreshable: true,
  },
  {
    id: 'resource-burn-rate',
    name: 'Resource Burn Rate',
    description: 'Current spending rate vs planned',
    category: 'financial',
    type: 'gauge',
    icon: Activity,
    sourceModule: 'financials',
    defaultSize: { width: 300, height: 200 },
    dataKeys: ['burnRate'],
    refreshable: true,
  },
];

// Helper functions
export function getComponentsByCategory(category: EmbeddableComponentCategory): EmbeddableComponent[] {
  return embeddableComponents.filter(c => c.category === category);
}

export function getComponentById(id: string): EmbeddableComponent | undefined {
  return embeddableComponents.find(c => c.id === id);
}

export function getComponentsByType(type: EmbeddableComponentType): EmbeddableComponent[] {
  return embeddableComponents.filter(c => c.type === type);
}

export function getRefreshableComponents(): EmbeddableComponent[] {
  return embeddableComponents.filter(c => c.refreshable);
}

export const categoryLabels: Record<EmbeddableComponentCategory, string> = {
  dashboard: 'Project Dashboard',
  executive: 'Executive Dashboard',
  strategic: 'Strategic Dashboard',
  briefing: 'Morning Briefing',
  reports: 'Reports',
  financial: 'Financial',
};

export const typeLabels: Record<EmbeddableComponentType, string> = {
  chart: 'Chart',
  kpi: 'KPI Card',
  table: 'Table',
  list: 'List',
  gauge: 'Gauge/Progress',
  timeline: 'Timeline',
};
