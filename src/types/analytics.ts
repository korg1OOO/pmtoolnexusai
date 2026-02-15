// Analytics Types for Drill-Down Views and Advanced Features

// ============================================================================
// DRILL-DOWN DETAIL TYPES
// ============================================================================

export interface BudgetVariance {
    projectId: string;
    projectName: string;
    portfolioId?: string;
    portfolioName?: string;
    plannedBudget: number;
    actualSpend: number;
    forecast: number;
    variance: number;
    variancePercent: number;
    status: 'under' | 'on-track' | 'over';
    breakdown: LineItem[];
    trend: VarianceTrend[];
}

export interface LineItem {
    id: string;
    category: string;
    subcategory?: string;
    planned: number;
    actual: number;
    variance: number;
    variancePercent: number;
    notes?: string;
}

export interface VarianceTrend {
    month: string;
    planned: number;
    actual: number;
    variance: number;
}

export interface TimelineSlippage {
    projectId: string;
    projectName: string;
    baselineStart: Date;
    baselineEnd: Date;
    currentStart: Date;
    currentEnd: Date;
    slippageDays: number;
    criticalPath: boolean;
    impactedMilestones: SlippedMilestone[];
    rootCauses: RootCause[];
    recoveryPlan?: RecoveryPlan;
    status: 'minor' | 'moderate' | 'severe';
}

export interface SlippedMilestone {
    id: string;
    name: string;
    baselineDate: Date;
    currentDate: Date;
    slippageDays: number;
    impact: 'low' | 'medium' | 'high';
    dependencies: string[];
}

export interface RootCause {
    category: 'resource' | 'technical' | 'external' | 'scope-change' | 'other';
    description: string;
    impact: number; // days of slippage attributed
}

export interface RecoveryPlan {
    id: string;
    description: string;
    actions: RecoveryAction[];
    targetDate: Date;
    status: 'draft' | 'approved' | 'in-progress' | 'completed';
    owner: string;
}

export interface RecoveryAction {
    id: string;
    description: string;
    daysToRecover: number;
    status: 'pending' | 'in-progress' | 'completed';
    assignedTo: string;
}

export interface RiskAssessment {
    riskId: string;
    projectId: string;
    projectName: string;
    title: string;
    description: string;
    category: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    score: number; // 1-25
    status: 'open' | 'mitigating' | 'closed' | 'accepted';
    owner: string;
    identifiedDate: Date;
    lastReviewDate: Date;
    mitigationPlan?: MitigationPlan;
    escalated: boolean;
    trend: 'increasing' | 'stable' | 'decreasing';
}

export interface MitigationPlan {
    id: string;
    strategy: 'avoid' | 'mitigate' | 'transfer' | 'accept';
    actions: string[];
    targetProbability?: 'low' | 'medium' | 'high';
    targetImpact?: 'low' | 'medium' | 'high';
    budget?: number;
    timeline?: string;
    status: 'draft' | 'approved' | 'in-progress' | 'completed';
}

// ============================================================================
// GOVERNANCE TYPES
// ============================================================================

export interface GovernancePanelData {
    entityId: string;
    entityType: 'project' | 'portfolio' | 'program' | 'workspace';
    policies: PolicyDocument[];
    approvals: ApprovalWorkflow[];
    compliance: ComplianceChecklist[];
}

export interface PolicyDocument {
    id: string;
    title: string;
    category: string;
    version: string;
    lastReviewed: Date;
    nextReview: Date;
    applicableTo: string[];
    documentUrl: string;
    mandatory: boolean;
    status: 'active' | 'draft' | 'archived';
    owner: string;
}

export interface ApprovalWorkflow {
    id: string;
    type: string;
    title: string;
    status: 'pending' | 'approved' | 'rejected' | 'escalated';
    currentApprover: string;
    approvalChain: Approver[];
    submittedDate: Date;
    submittedBy: string;
    completedDate?: Date;
    comments?: string;
    attachments?: string[];
}

export interface Approver {
    userId: string;
    name: string;
    role: string;
    order: number;
    status: 'pending' | 'approved' | 'rejected';
    actionDate?: Date;
    comments?: string;
}

export interface ComplianceChecklist {
    id: string;
    framework: string; // e.g., "ISO 27001", "SOC 2", "GDPR"
    entityId: string;
    entityType: string;
    items: ChecklistItem[];
    completionPercent: number;
    lastAudit: Date;
    nextAudit: Date;
    auditor?: string;
    status: 'compliant' | 'non-compliant' | 'in-progress';
}

export interface ChecklistItem {
    id: string;
    requirement: string;
    description?: string;
    status: 'compliant' | 'non-compliant' | 'in-progress' | 'not-applicable';
    evidence?: string[];
    verifiedBy?: string;
    verifiedDate?: Date;
    notes?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface FilterConfig {
    dateRange?: {
        start: Date;
        end: Date;
        preset?: 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter' | 'thisYear' | 'custom';
    };
    projects?: string[];
    portfolios?: string[];
    programs?: string[];
    status?: string[];
    riskLevel?: ('low' | 'medium' | 'high')[];
    budgetRange?: {
        min: number;
        max: number;
    };
    owners?: string[];
    tags?: string[];
}

export interface FilterPreset {
    id: string;
    name: string;
    description?: string;
    filters: FilterConfig;
    createdBy: string;
    createdDate: Date;
    updatedDate?: Date;
    shared: boolean;
    isDefault: boolean;
    category?: string;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface PDFExportOptions {
    title: string;
    subtitle?: string;
    includeCharts: boolean;
    includeData: boolean;
    orientation: 'portrait' | 'landscape';
    pageSize: 'a4' | 'letter' | 'legal';
    watermark?: string;
    header?: string;
    footer?: string;
    author?: string;
}

export interface ExcelExportOptions {
    fileName: string;
    sheets: ExcelSheet[];
    includeCharts: boolean;
    author?: string;
    company?: string;
}

export interface ExcelSheet {
    name: string;
    data: any[];
    columns?: ExcelColumn[];
    charts?: ChartConfig[];
    formatting?: SheetFormatting;
}

export interface ExcelColumn {
    header: string;
    key: string;
    width?: number;
    style?: any;
}

export interface ChartConfig {
    type: 'bar' | 'line' | 'pie' | 'area';
    title: string;
    dataRange: string;
    position?: { x: number; y: number };
}

export interface SheetFormatting {
    headerStyle?: any;
    alternateRows?: boolean;
    freezeHeader?: boolean;
}

export interface ScheduledReport {
    id: string;
    name: string;
    description?: string;
    schedule: ReportSchedule;
    recipients: string[];
    format: 'pdf' | 'excel' | 'both';
    filters: FilterConfig;
    template: string;
    active: boolean;
    createdBy: string;
    createdDate: Date;
    lastRun?: Date;
    nextRun?: Date;
}

export interface ReportSchedule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:mm format
    timezone?: string;
}

// ============================================================================
// REAL-TIME UPDATE TYPES
// ============================================================================

export interface WebSocketMessage {
    event: string;
    data: any;
    timestamp: Date;
    userId?: string;
}

export interface LiveDataUpdate {
    entityId: string;
    entityType: string;
    updateType: 'create' | 'update' | 'delete';
    data: any;
    timestamp: Date;
    userId: string;
}

export interface NotificationData {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
    actionLabel?: string;
}

// ============================================================================
// DRILL-DOWN NAVIGATION TYPES
// ============================================================================

export interface DrillDownContext {
    source: string; // e.g., "budget-chart", "timeline-chart"
    filters: FilterConfig;
    returnPath: string;
    breadcrumbs: Breadcrumb[];
}

export interface Breadcrumb {
    label: string;
    path: string;
    active: boolean;
}

// ============================================================================
// CHART INTERACTION TYPES
// ============================================================================

export interface ChartClickData {
    chartType: string;
    dataPoint: any;
    filters?: Partial<FilterConfig>;
    drillDownPath?: string;
}

// ============================================================================
// DELEGATION TYPES
// ============================================================================

export interface Delegation {
    id: string;
    delegatorId: string;
    delegateId: string;
    approvalId: string | null;
    entityId: string;
    entityType: 'project' | 'portfolio' | 'program' | 'workspace';
    delegationType: 'temporary' | 'permanent';
    reason: string;
    status: 'active' | 'revoked' | 'completed';
    createdAt: Date;
    revokedAt?: Date;
    revokedReason?: string;
    delegatorName?: string;
    delegateName?: string;
}

export interface DelegatedApproval extends ApprovalWorkflow {
    delegationId: string;
    delegatorId: string;
    delegatorName: string;
}

export interface DelegationRequest {
    delegateId: string;
    delegationType: 'temporary' | 'permanent';
    approvalId: string | null;
    reason: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NotificationPreferences {
    id: string;
    userId: string;
    // Channel enablement
    emailEnabled: boolean;
    slackEnabled: boolean;
    pushEnabled: boolean;
    // Event subscriptions
    approvalAssigned: boolean;
    approvalApproved: boolean;
    approvalRejected: boolean;
    approvalDelegated: boolean;
    delegationReceived: boolean;
    delegationRevoked: boolean;
    adminOverride: boolean;
    // Slack integration
    slackWebhookUrl?: string;
    slackChannel?: string;
    slackUserId?: string;
    // Digest settings
    digestEnabled: boolean;
    digestFrequency: 'daily' | 'weekly';
    digestTime: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface NotificationLog {
    id: string;
    userId: string;
    eventType: string;
    eventId: string;
    channel: 'email' | 'slack' | 'push';
    subject: string;
    body: string;
    metadata?: any;
    status: 'pending' | 'sent' | 'failed' | 'bounced';
    sentAt?: Date;
    failedAt?: Date;
    errorMessage?: string;
    openedAt?: Date;
    clickedAt?: Date;
    createdAt: Date;
}

export interface NotificationTemplate {
    id: string;
    eventType: string;
    channel: 'email' | 'slack' | 'push';
    subjectTemplate: string;
    bodyTemplate: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface NotificationData {
    userName?: string;
    approvalTitle?: string;
    approvalUrl?: string;
    entityName?: string;
    entityType?: string;
    dueDate?: string;
    requesterName?: string;
    approverName?: string;
    approvedAt?: string;
    rejectedAt?: string;
    comments?: string;
    delegatorName?: string;
    delegationType?: string;
    delegationReason?: string;
    adminName?: string;
    overrideReason?: string;
    [key: string]: any;
}

export interface NotificationFilters {
    channel?: 'email' | 'slack' | 'push';
    status?: 'pending' | 'sent' | 'failed' | 'bounced';
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export interface SendNotificationRequest {
    userId: string;
    eventType: string;
    eventId: string;
    data: NotificationData;
}

// ============================================================================
// DELEGATION TYPES (ADVANCED)
// ============================================================================

export interface DelegationTemplate {
    id: string;
    userId: string;
    name: string;
    delegateId: string;
    delegationType: 'temporary' | 'permanent';
    reason?: string;
    durationDays?: number;
    canSubdelegate: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DelegationHistoryItem {
    id: string;
    approvalId?: string;
    approvalTitle?: string;
    delegatorId: string;
    delegatorName: string;
    delegatorEmail: string;
    delegateId: string;
    delegateName: string;
    delegateEmail: string;
    delegationType: 'temporary' | 'permanent';
    reason?: string;
    status: 'active' | 'completed' | 'revoked' | 'expired';
    createdAt: string;
    revokedAt?: string;
    expiresAt?: string;
    parentDelegationId?: string;
    delegationDepth: number;
    canSubdelegate: boolean;
}

export interface DelegationHistoryFilters {
    status?: 'active' | 'completed' | 'revoked' | 'expired';
    delegationType?: 'temporary' | 'permanent';
    startDate?: string;
    endDate?: string;
}

// ============================================================================
// ADVANCED FILTERING TYPES
// ============================================================================

export interface FilterState {
    dateRange?: {
        start: Date | null;
        end: Date | null;
    };
    projects?: string[];
    users?: string[];
    statuses?: string[];
    categories?: string[];
    priorities?: string[];
    customFilters?: Record<string, any>;
}

export interface FilterOption {
    value: string;
    label: string;
    count?: number;
    disabled?: boolean;
    icon?: string;
}

export interface FilterPreset {
    id: string;
    name: string;
    description?: string;
    filters: FilterState;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    type: 'date-range' | 'multi-select' | 'single-select' | 'text' | 'number';
    options?: FilterOption[];
    placeholder?: string;
    required?: boolean;
    defaultValue?: any;
}

export interface DateRangePreset {
    label: string;
    getValue: () => { start: Date; end: Date };
}
