// Project Template Types for Enterprise PM Platform

export type Methodology = 'waterfall' | 'agile-scrum' | 'agile-kanban' | 'hybrid' | 'safe' | 'custom';
export type TemplateCategory = 'marketing' | 'software' | 'erp' | 'operations' | 'infrastructure';
export type ComplexityLevel = 'low' | 'medium' | 'high' | 'enterprise';
export type GovernanceLevel = 'light' | 'standard' | 'enterprise';

export interface TemplatePhase {
  id: string;
  name: string;
  description: string;
  order: number;
  durationDays: number;
  milestones: TemplateMilestone[];
  tasks: TemplateTask[];
  gateApproval?: boolean;
}

export interface TemplateMilestone {
  id: string;
  name: string;
  description: string;
  offsetDays: number;
  isCritical: boolean;
}

export interface TemplateTask {
  id: string;
  name: string;
  description: string;
  type: 'task' | 'milestone' | 'summary';
  durationDays: number;
  effort: 'low' | 'medium' | 'high';
  defaultRole?: string;
  dependencies?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface TemplateRole {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  responsibilities: string[];
}

export interface TemplateRisk {
  id: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  mitigation: string;
}

export interface TemplateMeeting {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'milestone';
  duration: number;
  participants: string[];
}

export interface TemplateDecision {
  id: string;
  title: string;
  description: string;
  phase: string;
  stakeholders: string[];
}

export interface AIMetadata {
  typicalDuration: { min: number; max: number; unit: 'days' | 'weeks' | 'months' };
  riskPatterns: string[];
  effortBenchmarks: { min: number; max: number; unit: 'person-days' | 'story-points' };
  failureSignals: string[];
  governanceIntensity: 'light' | 'standard' | 'heavy';
  successIndicators: string[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  methodology: Methodology;
  industry: string[];
  complexity: ComplexityLevel;
  phases: TemplatePhase[];
  roles: TemplateRole[];
  risks: TemplateRisk[];
  meetings: TemplateMeeting[];
  decisions: TemplateDecision[];
  aiMetadata: AIMetadata;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  usageCount: number;
  tags: string[];
  icon: string;
  color: string;
}

export interface ProjectCreationData {
  name: string;
  description: string;
  code: string;
  organizationId: string;
  portfolioId?: string;
  owner: string;
  sponsor?: string;
  startDate: string;
  targetEndDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  visibility: 'private' | 'organization' | 'cross-org';
  tags: string[];
  methodology: Methodology;
  templateId?: string;
  governanceLevel: GovernanceLevel;
  enabledPhases?: string[];
  teamMembers?: { userId: string; roleId: string }[];
}
