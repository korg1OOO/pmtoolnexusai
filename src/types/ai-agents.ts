// =============================================================================
// AI Agent System Types
// =============================================================================

export type ProjectRole = 'admin' | 'pm' | 'lead' | 'developer' | 'analyst' | 'viewer';

export type IntentCategory =
  | 'SCHEDULE_QUERY'
  | 'SCHEDULE_MODIFY'
  | 'BUDGET_QUERY'
  | 'BUDGET_ANALYSIS'
  | 'RISK_QUERY'
  | 'RISK_ANALYZE'
  | 'RESOURCE_QUERY'
  | 'RESOURCE_ASSIGN'
  | 'MEETING_QUERY'
  | 'MEETING_GENERATE'
  | 'REPORT_GENERATE'
  | 'INSIGHT_REQUEST'
  | 'STRATEGIC_ANALYSIS'
  | 'COMMUNICATION_SCAN'
  | 'GENERAL_CHAT';

export type AgentType =
  | 'scheduler'
  | 'finance'
  | 'risk'
  | 'assignment'
  | 'meeting'
  | 'document'
  | 'insight'
  | 'strategic'
  | 'communication'
  | 'system'
  | 'multi-agent';

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent_type?: AgentType;
  metadata?: AIMessageMetadata;
  created_at: string;
}

export interface AIMessageMetadata {
  intent?: IntentClassification;
  actions?: AIAction[];
  confidence?: number;
  executionTime?: number;
  agentsUsed?: AgentType[];
  permissionDenied?: boolean;
  creditsDeducted?: number;
  tokensDeducted?: number;
}

export interface IntentClassification {
  primary_intent: IntentCategory;
  secondary_intents: IntentCategory[];
  requires_modification: boolean;
  confidence: number;
}

export interface AIAction {
  type: 'confirm' | 'navigate' | 'create' | 'update' | 'delete';
  description: string;
  data?: Record<string, unknown>;
  confirmed?: boolean;
}

export interface AIConversation {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIOrchestratorRequest {
  message: string;
  projectId: string;
  conversationId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  options: Array<{ id: string; label: string; description?: string }>;
  multiSelect?: boolean;
  context?: string;
}

export interface AIOrchestratorResponse {
  response: string;
  agentType: AgentType;
  agentsUsed?: AgentType[];
  intent?: IntentClassification;
  confidence?: number;
  actions?: AIAction[];
  executionTime?: number;
  permissionDenied?: boolean;
  needsClarification?: boolean;
  clarifyingQuestion?: ClarifyingQuestion;
  error?: string;
  requiresConfirmation?: boolean;
  pendingActionId?: string;
  toolName?: string;
  toolResult?: unknown;
  diff?: Record<string, unknown>;
  summary?: string;
}

// Agent display configuration
// @deprecated This is now loaded from the database via useAIAgents() hook.
// Kept for backward compatibility and type definitions only.
// Use src/hooks/useAIAgents.ts instead for dynamic agent configuration.
export const AGENT_DISPLAY_INFO: Record<AgentType, { label: string; icon: string; color: string }> = {
  scheduler: { label: 'Scheduler', icon: 'Calendar', color: 'text-blue-500' },
  finance: { label: 'Finance', icon: 'DollarSign', color: 'text-green-500' },
  risk: { label: 'Risk', icon: 'AlertTriangle', color: 'text-orange-500' },
  assignment: { label: 'Assignment', icon: 'Users', color: 'text-purple-500' },
  meeting: { label: 'Meeting', icon: 'Video', color: 'text-pink-500' },
  document: { label: 'Document', icon: 'FileText', color: 'text-indigo-500' },
  insight: { label: 'Insight', icon: 'Lightbulb', color: 'text-yellow-500' },
  strategic: { label: 'Strategic', icon: 'Target', color: 'text-red-500' },
  communication: { label: 'Communication', icon: 'MessageCircle', color: 'text-cyan-500' },
  system: { label: 'System', icon: 'Bot', color: 'text-muted-foreground' },
  'multi-agent': { label: 'Multi-Agent', icon: 'Network', color: 'text-primary' },
};

// Role permissions for UI display
export const ROLE_PERMISSIONS: Record<ProjectRole, string[]> = {
  admin: ['SCHEDULE_EDIT', 'FINANCE_VIEW', 'FINANCE_EDIT', 'RISK_MANAGE', 'TEAM_MANAGE', 'MEETING_MANAGE', 'DOC_GENERATE', 'VIEW_ALL'],
  pm: ['SCHEDULE_EDIT', 'FINANCE_VIEW', 'FINANCE_EDIT', 'RISK_MANAGE', 'TEAM_MANAGE', 'MEETING_MANAGE', 'DOC_GENERATE', 'VIEW_ALL'],
  lead: ['SCHEDULE_EDIT', 'RISK_MANAGE', 'TEAM_MANAGE', 'MEETING_MANAGE', 'DOC_GENERATE', 'VIEW_ALL'],
  developer: ['MEETING_MANAGE', 'DOC_GENERATE', 'VIEW_ALL'],
  analyst: ['MEETING_MANAGE', 'DOC_GENERATE', 'VIEW_ALL'],
  viewer: ['VIEW_ALL'],
};

export const ROLE_DISPLAY_NAMES: Record<ProjectRole, string> = {
  admin: 'Administrator',
  pm: 'Project Manager',
  lead: 'Team Lead',
  developer: 'Developer',
  analyst: 'Analyst',
  viewer: 'Viewer',
};
