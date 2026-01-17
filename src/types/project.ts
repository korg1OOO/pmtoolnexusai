// Core Project Types for Enterprise PM Platform

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'on-hold';
export type TaskType = 'task' | 'milestone' | 'summary';
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';
export type SprintStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type MeetingType = 'online' | 'in-person' | 'hybrid';

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  methodology: 'waterfall' | 'agile' | 'hybrid';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  health: 'green' | 'amber' | 'red';
  progress: number;
  owner: string;
  team: string[];
}

export interface Task {
  id: string;
  wbs: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  assignee?: string;
  dependencies: Dependency[];
  children?: Task[];
  isCritical?: boolean;
  baselineStart?: string;
  baselineEnd?: string;
  notes?: string;
  expanded?: boolean;
  level: number;
}

export interface Dependency {
  taskId: string;
  type: DependencyType;
  lag?: number;
}

export interface SprintItem {
  id: string;
  key: string;
  title: string;
  type: 'epic' | 'story' | 'task' | 'bug' | 'tech-debt';
  status: SprintStatus;
  priority: Priority;
  storyPoints?: number;
  assignee?: string;
  sprint?: string;
  epic?: string;
  labels: string[];
  description?: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
  items: SprintItem[];
  velocity?: number;
  capacity: number;
}

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  participants: Participant[];
  agenda: AgendaItem[];
  notes: string;
  actionItems: ActionItem[];
  decisions: string[];
  risks: string[];
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'accepted' | 'tentative' | 'declined' | 'pending';
}

export interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  presenter?: string;
  completed: boolean;
}

export interface ActionItem {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: 'open' | 'in-progress' | 'completed';
  priority: Priority;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  probability: RiskLevel;
  impact: RiskLevel;
  status: 'identified' | 'analyzing' | 'mitigating' | 'closed';
  owner: string;
  mitigationPlan?: string;
  createdDate: string;
  dueDate?: string;
}

export interface Decision {
  id: string;
  title: string;
  context: string;
  alternatives: string[];
  decision: string;
  impact: string;
  owner: string;
  date: string;
  status: 'active' | 'superseded' | 'pending';
  linkedTasks: string[];
  linkedRisks: string[];
  linkedMeetings: string[];
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  email: string;
  skills: string[];
  availability: number;
  allocation: ResourceAllocation[];
  hourlyRate?: number;
}

export interface ResourceAllocation {
  projectId: string;
  projectName: string;
  allocation: number;
  startDate: string;
  endDate: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  planned: number;
  forecast: number;
  actual: number;
  variance: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  type: 'milestone' | 'time-material' | 'fixed';
  milestone?: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  notebook: string;
  section: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isShared: boolean;
  linkedItems: LinkedItem[];
}

export interface LinkedItem {
  type: 'task' | 'decision' | 'risk' | 'meeting' | 'note';
  id: string;
  title: string;
}

export interface Slide {
  id: string;
  title: string;
  template: 'title' | 'executive-summary' | 'timeline' | 'metrics' | 'risk-matrix' | 'comparison' | 'blank';
  content: SlideContent;
  order: number;
}

export interface SlideContent {
  heading?: string;
  subheading?: string;
  body?: string;
  bullets?: string[];
  chart?: ChartData;
  table?: TableData;
  linkedArtifacts?: LinkedItem[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'donut' | 'area';
  data: any;
  options?: any;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface Presentation {
  id: string;
  title: string;
  template: 'executive-status' | 'steering-committee' | 'client-update' | 'risk-review' | 'custom';
  slides: Slide[];
  theme: PresentationTheme;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PresentationTheme {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
}
