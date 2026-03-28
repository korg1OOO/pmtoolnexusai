// AI-Enabled PM Types

import type { Priority, RiskLevel } from './project';

// Enhanced Meeting Types
export interface AIEnhancedMeeting {
  id: string;
  title: string;
  type: 'online' | 'in-person' | 'offline';
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  
  // Meeting as First-Class AI Object
  purpose: MeetingPurpose;
  stakeholderRoles: StakeholderRole[];
  decisionScope: DecisionScope;
  riskRelevance: RiskRelevance[];
  linkedWorkstreams: string[];
  
  // Multi-Mode Capture
  captureMode: CaptureMode;
  recordingStatus: RecordingStatus;
  sourceType: 'zoom' | 'teams' | 'meet' | 'audio' | 'manual';
  captureConfidence: 'high' | 'medium' | 'low';
  
  // AI Intelligence Extraction
  aiIntelligence: AIIntelligence;
  
  // MoM & Follow-up
  momTemplate: MoMTemplate;
  followUpStatus: FollowUpStatus;
}

export interface MeetingPurpose {
  type: 'decision' | 'status-update' | 'planning' | 'review' | 'escalation' | 'kickoff';
  description: string;
  expectedOutcomes: string[];
  successCriteria: string[];
}

export interface StakeholderRole {
  participantId: string;
  name: string;
  role: 'decision-maker' | 'contributor' | 'observer' | 'subject-matter-expert' | 'approver';
  powerLevel: 'high' | 'medium' | 'low';
  interest: 'high' | 'medium' | 'low';
  status: 'accepted' | 'tentative' | 'declined' | 'pending';
}

export interface DecisionScope {
  type: 'strategic' | 'tactical' | 'operational';
  budgetAuthority: number | null;
  resourceAuthority: boolean;
  scopeChangeAuthority: boolean;
  requiredQuorum: number;
}

export interface RiskRelevance {
  riskId: string;
  riskTitle: string;
  relevanceType: 'review' | 'mitigation' | 'escalation' | 'closure';
}

export interface CaptureMode {
  mode: 'live-transcription' | 'post-meeting' | 'manual-entry';
  audioAvailable: boolean;
  videoAvailable: boolean;
  transcriptAvailable: boolean;
}

export interface RecordingStatus {
  isRecording: boolean;
  duration: number;
  quality: 'excellent' | 'good' | 'poor' | 'none';
  source: string;
}

// AI Intelligence Extraction
export interface AIIntelligence {
  decisions: ExtractedDecision[];
  actionItems: ExtractedActionItem[];
  risksIdentified: ExtractedRisk[];
  scopeChanges: ExtractedScopeChange[];
  conflicts: ExtractedConflict[];
  keyTopics: KeyTopic[];
  sentimentAnalysis: SentimentAnalysis;
  summary: string;
  nextSteps: string[];
  confidence: number;
}

export interface ExtractedDecision {
  id: string;
  description: string;
  type: 'irreversible' | 'reversible' | 'temporary';
  madeBy: string;
  approvedBy: string[];
  impact: 'high' | 'medium' | 'low';
  linkedRisks: string[];
  linkedTasks: string[];
  timestamp: string;
  confidence: number;
}

export interface ExtractedActionItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  priority: Priority;
  dependencies: string[];
  blockedBy: string[];
  source: 'explicit' | 'inferred';
  confidence: number;
}

export interface ExtractedRisk {
  id: string;
  title: string;
  description: string;
  probability: RiskLevel;
  impact: RiskLevel;
  category: string;
  suggestedMitigation: string;
  source: 'explicit' | 'inferred';
  confidence: number;
}

export interface ExtractedScopeChange {
  id: string;
  description: string;
  type: 'addition' | 'removal' | 'modification';
  impact: 'schedule' | 'budget' | 'resources' | 'quality';
  magnitude: 'major' | 'minor';
  requiresApproval: boolean;
  confidence: number;
}

export interface ExtractedConflict {
  id: string;
  description: string;
  parties: string[];
  severity: 'high' | 'medium' | 'low';
  type: 'resource' | 'priority' | 'scope' | 'timeline' | 'technical' | 'stakeholder';
  suggestedResolution: string;
  confidence: number;
}

export interface KeyTopic {
  topic: string;
  duration: number;
  participants: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative' | 'mixed';
  engagement: number;
  concerns: string[];
  positives: string[];
}

// MoM Templates
export interface MoMTemplate {
  id: string;
  name: string;
  organization: string;
  sections: MoMSection[];
  formatting: MoMFormatting;
  approvalWorkflow: ApprovalWorkflow;
  version: number;
}

export interface MoMSection {
  id: string;
  title: string;
  type: 'attendees' | 'agenda' | 'discussion' | 'decisions' | 'actions' | 'risks' | 'next-meeting';
  required: boolean;
  autoPopulate: boolean;
}

export interface MoMFormatting {
  headerLogo: boolean;
  dateFormat: string;
  includeTimestamps: boolean;
  includeParticipantRoles: boolean;
  includeAIConfidence: boolean;
}

export interface ApprovalWorkflow {
  required: boolean;
  approvers: string[];
  deadline: number; // hours
  autoApprove: boolean;
}

// Follow-up Enforcement
export interface FollowUpStatus {
  totalActions: number;
  completedActions: number;
  overdueActions: OverdueAction[];
  repeatDeferrals: RepeatDeferral[];
  decisionDebt: DecisionDebt[];
  escalations: Escalation[];
}

export interface OverdueAction {
  actionId: string;
  title: string;
  owner: string;
  dueDate: string;
  daysOverdue: number;
  escalationLevel: number;
}

export interface RepeatDeferral {
  actionId: string;
  title: string;
  deferralCount: number;
  originalDueDate: string;
  currentDueDate: string;
  pattern: 'weekly' | 'bi-weekly' | 'monthly';
}

export interface DecisionDebt {
  id: string;
  description: string;
  pendingSince: string;
  impact: 'blocking' | 'delaying' | 'accumulating-risk';
  blockedItems: string[];
}

export interface Escalation {
  id: string;
  type: 'overdue-action' | 'repeat-deferral' | 'decision-debt' | 'risk-escalation';
  severity: 'critical' | 'high' | 'medium';
  description: string;
  recommendedAction: string;
  escalatedTo: string[];
  escalatedAt: string;
}

// AI PM Coach Types
export interface PMCoachContext {
  currentView: string;
  projectData: ProjectInsight;
  recentActions: UserAction[];
  commonMistakes: CommonMistake[];
  learningPath: LearningPath;
}

export interface ProjectInsight {
  criticalPath: CriticalPathInsight;
  dependencies: DependencyInsight;
  constraints: ConstraintInsight;
  patterns: PatternInsight[];
}

export interface CriticalPathInsight {
  tasks: string[];
  totalDuration: number;
  slippageRisk: 'high' | 'medium' | 'low';
  recentChanges: CriticalPathChange[];
}

export interface CriticalPathChange {
  date: string;
  change: string;
  cause: string;
  impact: string;
}

export interface DependencyInsight {
  totalDependencies: number;
  circularRisks: string[];
  bottlenecks: string[];
  negativeFloat: NegativeFloatItem[];
}

export interface NegativeFloatItem {
  taskId: string;
  taskName: string;
  floatDays: number;
  cause: string;
}

export interface ConstraintInsight {
  hardConstraints: Constraint[];
  softConstraints: Constraint[];
  violations: ConstraintViolation[];
}

export interface Constraint {
  id: string;
  type: 'must-start-on' | 'must-finish-on' | 'no-earlier-than' | 'no-later-than';
  taskId: string;
  date: string;
  reason: string;
}

export interface ConstraintViolation {
  constraintId: string;
  severity: 'critical' | 'warning';
  description: string;
  suggestedResolution: string;
}

export interface PatternInsight {
  type: 'slippage' | 'scope-creep' | 'resource-conflict' | 'estimation-error';
  description: string;
  frequency: number;
  impact: string;
  recommendation: string;
}

export interface UserAction {
  timestamp: string;
  action: string;
  context: string;
}

export interface CommonMistake {
  id: string;
  category: 'scheduling' | 'dependencies' | 'resources' | 'scope' | 'risk';
  description: string;
  detection: string;
  correction: string;
  prevention: string;
}

export interface LearningPath {
  currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  completedModules: string[];
  nextRecommendations: LearningRecommendation[];
}

export interface LearningRecommendation {
  id: string;
  title: string;
  type: 'video' | 'article' | 'interactive' | 'quiz';
  duration: number;
  relevance: string;
}

// Tool Translation Layer
export interface ToolTranslation {
  sourceField: string;
  sourceTool: 'kiroxys' | 'ms-project' | 'jira' | 'primavera' | 'excel';
  targetTool: 'kiroxys' | 'ms-project' | 'jira' | 'primavera' | 'excel';
  targetField: string;
  transformationNotes: string;
  potentialIssues: string[];
}

// Communication Intelligence Types
export interface CommunicationIngest {
  id: string;
  type: 'email' | 'chat' | 'document' | 'meeting-notes';
  source: string;
  timestamp: string;
  participants: string[];
  content: string;
  aiAnalysis: CommunicationAnalysis;
}

export interface CommunicationAnalysis {
  delaySignals: DelaySignal[];
  blockerPatterns: BlockerPattern[];
  scopeCreepIndicators: ScopeCreepIndicator[];
  budgetPressureSignals: BudgetPressureSignal[];
  complianceRisks: ComplianceRisk[];
  actionableItems: ActionableItem[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  confidence: number;
}

export interface DelaySignal {
  description: string;
  severity: 'critical' | 'warning' | 'info';
  affectedItems: string[];
  suggestedAction: string;
}

export interface BlockerPattern {
  description: string;
  frequency: number;
  owner: string;
  resolution: string;
}

export interface ScopeCreepIndicator {
  description: string;
  source: string;
  impact: 'schedule' | 'budget' | 'resources';
  recommendation: string;
}

export interface BudgetPressureSignal {
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  recommendation: string;
}

export interface ComplianceRisk {
  description: string;
  regulation: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  deadline: string | null;
}

export interface ActionableItem {
  title: string;
  owner: string;
  dueDate: string | null;
  priority: Priority;
  source: string;
}

// Executive Status Types
export interface ExecutiveStatus {
  id: string;
  generatedAt: string;
  period: string;
  audience: 'steering-committee' | 'sponsor' | 'board' | 'team';
  sections: StatusSection[];
  ragStatus: RAGStatus;
  keyChanges: KeyChange[];
  recommendations: string[];
}

export interface StatusSection {
  title: string;
  content: string;
  highlights: string[];
  concerns: string[];
}

export interface RAGStatus {
  overall: 'red' | 'amber' | 'green';
  schedule: 'red' | 'amber' | 'green';
  budget: 'red' | 'amber' | 'green';
  scope: 'red' | 'amber' | 'green';
  quality: 'red' | 'amber' | 'green';
  resources: 'red' | 'amber' | 'green';
}

export interface KeyChange {
  category: 'decision' | 'risk' | 'milestone' | 'budget' | 'scope';
  description: string;
  impact: string;
  date: string;
}

// Strategic Artifacts Types
export interface ProjectContext {
  id: string;
  projectId: string;
  
  // Structured Intake
  businessCase: BusinessCase;
  regulatoryFrameworks: RegulatoryFramework[];
  operatingConstraints: OperatingConstraint[];
  stakeholderPowerMap: StakeholderPowerMap;
  
  // AI Quality Input
  aiReadiness: number;
  dataCompleteness: number;
  contextQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface BusinessCase {
  objectives: string[];
  successCriteria: SuccessCriterion[];
  benefits: Benefit[];
  assumptions: Assumption[];
  constraints: string[];
}

export interface SuccessCriterion {
  id: string;
  description: string;
  metric: string;
  target: string;
  currentValue: string;
  status: 'on-track' | 'at-risk' | 'off-track';
}

export interface Benefit {
  id: string;
  description: string;
  type: 'financial' | 'operational' | 'strategic' | 'compliance';
  quantified: boolean;
  value: number | null;
  realizationDate: string;
}

export interface Assumption {
  id: string;
  description: string;
  status: 'valid' | 'invalid' | 'uncertain';
  validationDate: string | null;
  impact: string;
}

export interface RegulatoryFramework {
  id: string;
  name: string;
  jurisdiction: string;
  requirements: string[];
  complianceStatus: 'compliant' | 'partially-compliant' | 'non-compliant' | 'not-assessed';
  deadline: string | null;
}

export interface OperatingConstraint {
  id: string;
  type: 'resource' | 'budget' | 'timeline' | 'technical' | 'organizational' | 'environmental';
  description: string;
  impact: 'schedule' | 'cost' | 'scope' | 'quality';
  flexibility: 'fixed' | 'negotiable' | 'flexible';
}

export interface StakeholderPowerMap {
  stakeholders: StakeholderMapping[];
  relationships: StakeholderRelationship[];
}

export interface StakeholderMapping {
  id: string;
  name: string;
  role: string;
  power: 'high' | 'medium' | 'low';
  interest: 'high' | 'medium' | 'low';
  influence: 'high' | 'medium' | 'low';
  attitude: 'champion' | 'supporter' | 'neutral' | 'critic' | 'blocker';
  engagementStrategy: string;
}

export interface StakeholderRelationship {
  from: string;
  to: string;
  type: 'reports-to' | 'influences' | 'conflicts-with' | 'depends-on';
  strength: 'strong' | 'moderate' | 'weak';
}

// AI Risk Discovery
export interface AIRiskDiscovery {
  discoveredRisks: DiscoveredRisk[];
  hiddenRisks: HiddenRisk[];
  riskConnections: RiskConnection[];
  timingRisks: TimingRisk[];
  contractorRisks: ContractorRisk[];
}

export interface DiscoveredRisk {
  id: string;
  title: string;
  description: string;
  source: 'data-analysis' | 'pattern-matching' | 'dependency-analysis' | 'historical';
  probability: RiskLevel;
  impact: RiskLevel;
  linkedItems: string[];
  confidence: number;
  explanation: string;
  dataSupport: DataSupport[];
}

export interface HiddenRisk {
  id: string;
  title: string;
  inference: string;
  indicators: string[];
  potentialImpact: string;
  recommendation: string;
  confidence: number;
}

export interface RiskConnection {
  riskId: string;
  connectedTo: string;
  connectionType: 'scope-item' | 'contractor' | 'milestone' | 'resource' | 'external';
  relationship: string;
}

export interface TimingRisk {
  id: string;
  type: 'seasonal' | 'regulatory-deadline' | 'resource-availability' | 'market-timing';
  description: string;
  period: string;
  impact: string;
  mitigation: string;
}

export interface ContractorRisk {
  id: string;
  contractorName: string;
  riskType: 'performance' | 'financial' | 'capacity' | 'dependency';
  description: string;
  indicators: string[];
  recommendation: string;
}

export interface DataSupport {
  type: 'metric' | 'trend' | 'comparison' | 'historical';
  description: string;
  value: string;
}

// Value Engineering & Option Analysis
export interface ValueEngineering {
  id: string;
  projectId: string;
  options: ValueOption[];
  tradeoffAnalysis: TradeoffAnalysis;
  recommendation: ValueRecommendation;
}

export interface ValueOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  benefit: number;
  roi: number;
  riskScore: number;
  timeImpact: number;
  qualityImpact: 'positive' | 'neutral' | 'negative';
  pros: string[];
  cons: string[];
  dependencies: string[];
  assumptions: string[];
}

export interface TradeoffAnalysis {
  costVsTime: TradeoffCurve;
  costVsRisk: TradeoffCurve;
  timeVsQuality: TradeoffCurve;
  optimalPoint: string;
}

export interface TradeoffCurve {
  points: TradeoffPoint[];
  recommendation: string;
}

export interface TradeoffPoint {
  x: number;
  y: number;
  label: string;
  isOptimal: boolean;
}

export interface ValueRecommendation {
  selectedOption: string;
  justification: string;
  confidence: number;
  assumptions: string[];
  risks: string[];
  nextSteps: string[];
}

// AI Confidence & Explainability
export interface AIExplanation {
  confidence: number;
  reasoning: string[];
  dataPoints: DataPoint[];
  assumptions: string[];
  limitations: string[];
  alternativeInterpretations: string[];
}

export interface DataPoint {
  source: string;
  value: string;
  relevance: string;
  reliability: 'high' | 'medium' | 'low';
}
