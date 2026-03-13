// =============================================================================
// Agent Pipeline Types
// =============================================================================
//
// Shared type definitions for the pre-execution auditor, post-execution
// verifier, and the pipeline orchestration layer.
// =============================================================================

import type { ProjectRole } from '@/types/ai-agents';

// ─── Action Context ──────────────────────────────────────────────────────────

/** Context passed to the auditor and verifier for each action. */
export interface ActionContext {
    /** Current user's role on the active project */
    userRole: ProjectRole | string;
    /** Active project ID (null if no project selected) */
    projectId: string | null;
    /** Current user's ID */
    userId?: string;
    /** Pre-fetched project metadata for prerequisite checks */
    projectData?: {
        /** Existing phases / summary tasks */
        hasPhases?: boolean;
        /** Existing team members assigned */
        hasMembers?: boolean;
        /** Existing issues */
        hasIssues?: boolean;
        /** Existing sprints */
        hasSprints?: boolean;
        /** Existing epics */
        hasEpics?: boolean;
        /** Project name (for conflict detection) */
        projectName?: string;
    };
}

// ─── Feasibility Report ──────────────────────────────────────────────────────

export interface FeasibilityReport {
    /** Whether the action can proceed */
    feasible: boolean;
    /** Human-readable reason if not feasible */
    reason?: string;
    /** Suggested alternative action or message */
    suggestedAction?: string;
    /** Which check failed */
    failedCheck?: 'role' | 'project' | 'prerequisite' | 'conflict';
}

// ─── Verification Result ─────────────────────────────────────────────────────

export interface VerificationResult {
    /** Whether the entity was confirmed to exist in the database */
    verified: boolean;
    /** Canonical details of the entity after verification */
    entityDetails?: Record<string, unknown>;
    /** User-facing message describing the verification outcome */
    userMessage: string;
    /** Table that was queried for verification */
    tableName?: string;
    /** ID of the entity that was verified */
    entityId?: string;
}

// ─── Permissions ─────────────────────────────────────────────────────────────

/**
 * Maps each action intent to the permission(s) required to execute it.
 * Action names match the intents returned by `detectIntent()` in useAIActionDispatcher.
 */
export const ACTION_REQUIRED_PERMISSIONS: Record<string, string[]> = {
    // Project-level mutations
    create_project: ['SCHEDULE_EDIT'],
    assign_members: ['TEAM_MANAGE'],
    log_leave: ['TEAM_MANAGE'],

    // Schedule / Plan mutations
    create_phase: ['SCHEDULE_EDIT'],
    create_activities: ['SCHEDULE_EDIT'],
    create_phases_and_activities: ['SCHEDULE_EDIT'],
    build_phase_from_description: ['SCHEDULE_EDIT'],
    create_milestone: ['SCHEDULE_EDIT'],

    // Finance mutations
    set_budget: ['FINANCE_EDIT'],
    log_expense: ['FINANCE_EDIT'],
    setup_financials: ['FINANCE_EDIT'],

    // Risk & Issues
    log_issue: ['RISK_MANAGE'],
    log_risk: ['RISK_MANAGE'],
    resolve_issue: ['RISK_MANAGE'],
    log_project_controls: ['RISK_MANAGE'],

    // Agile artefacts
    create_epic: ['SCHEDULE_EDIT'],
    create_story: ['SCHEDULE_EDIT'],
    create_sprint: ['SCHEDULE_EDIT'],
    complete_sprint: ['SCHEDULE_EDIT'],
    setup_agile_backlog: ['SCHEDULE_EDIT'],

    // Governance
    schedule_meeting: ['MEETING_MANAGE'],
    log_decision: ['MEETING_MANAGE'],
    log_governance_meetings: ['MEETING_MANAGE'],

    // Requirements & Documents
    log_requirement: ['DOC_GENERATE'],
    validate_requirements: ['DOC_GENERATE'],
    create_change_request: ['DOC_GENERATE'],
    create_charter: ['DOC_GENERATE'],
    create_deliverables: ['DOC_GENERATE'],
    map_traceability: ['DOC_GENERATE'],
    create_stakeholder: ['DOC_GENERATE'],
    log_lesson_learned: ['DOC_GENERATE'],
    generate_presentation: ['DOC_GENERATE'],
    generate_final_report: ['DOC_GENERATE'],
    generate_charter_and_deliverables: ['DOC_GENERATE'],
    close_sprint_cycle: ['SCHEDULE_EDIT', 'RISK_MANAGE'],
};

/**
 * Actions that require existing phases/summary tasks as a prerequisite.
 */
export const ACTIONS_REQUIRING_PHASES: string[] = [
    'create_activities',
    'create_milestone',
];

/**
 * Actions that require existing team members as a prerequisite.
 */
export const ACTIONS_REQUIRING_MEMBERS: string[] = [
    'log_leave',
    'assign_members',
];

/**
 * Actions that require existing issues as a prerequisite.
 */
export const ACTIONS_REQUIRING_ISSUES: string[] = [
    'resolve_issue',
];

/**
 * Actions that do NOT require a project to be selected.
 */
export const PROJECT_INDEPENDENT_ACTIONS: string[] = [
    'create_project',
];

// ─── Multi-Step Execution Plans ──────────────────────────────────────────────

/** A single step in a multi-step execution plan */
export interface PlanStep {
    /** Unique step ID (1-indexed) */
    stepId: number;
    /** The action intent to execute */
    action: string;
    /** Human-readable description of what this step does */
    description: string;
    /** Parameters for the action */
    params: Record<string, unknown>;
    /**
     * Dependencies on other steps using $ref syntax.
     * Example: { "projectId": "$ref:step1.id" } means
     * use the "id" field from step 1's result.
     */
    dependsOn?: number[];
    /** Whether this step requires user confirmation before executing */
    requiresConfirmation?: boolean;
}

/** A complete multi-step execution plan */
export interface ExecutionPlan {
    /** Unique plan ID */
    planId: string;
    /** Human-readable plan title */
    title: string;
    /** Original user request that generated this plan */
    originalRequest: string;
    /** Ordered list of steps to execute */
    steps: PlanStep[];
    /** Overall risk level */
    risk: 'low' | 'medium' | 'high';
    /** Whether the entire plan requires user approval */
    requiresApproval: boolean;
    /** Estimated total credits cost */
    estimatedCredits?: number;
}

/** Status of a step during plan execution */
export interface PlanStepResult {
    stepId: number;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    result?: unknown;
    error?: string;
    /** Resolved output that can be referenced by later steps */
    output?: Record<string, unknown>;
}

/** Status of the entire plan execution */
export interface PlanExecutionStatus {
    planId: string;
    status: 'pending_approval' | 'running' | 'completed' | 'partial' | 'failed';
    stepResults: PlanStepResult[];
    summary: string;
}

// ─── Agent Memory ────────────────────────────────────────────────────────────

/** A log entry for agent memory / reconciliation */
export interface AgentMemoryEntry {
    /** Unique entry ID */
    id: string;
    /** Project ID */
    projectId: string;
    /** User ID who triggered the action */
    userId: string;
    /** The action intent that was executed */
    actionType: string;
    /** Whether the action succeeded */
    success: boolean;
    /** The input parameters */
    input: Record<string, unknown>;
    /** The output / result */
    output?: Record<string, unknown>;
    /** Verification result (if available) */
    verification?: VerificationResult;
    /** Error message if failed */
    error?: string;
    /** Timestamp */
    timestamp: string;
    /** Credits used */
    creditsUsed: number;
}

