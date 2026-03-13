// Agent Pipeline — Barrel Export
export { auditAction } from './auditor';
export { verifyAction, extractEntityIds } from './verifier';
export { classifyIntent } from './intent-classifier';
export { detectCompoundRequest, resolveRefs, formatPlanSummary } from './planner';
export { logAction, getRecentActions, getActionSummary } from './memory';
export { getQueryHints, hasQueryHints } from './query-hints';
export { classifyError, formatErrorForChat } from './error-handler';
export { withResilience, getActionTimeout, getCircuitState, resetCircuit } from './resilience';
export type {
    ActionContext,
    FeasibilityReport,
    VerificationResult,
    ExecutionPlan,
    PlanStep,
    PlanStepResult,
    PlanExecutionStatus,
    AgentMemoryEntry,
} from './types';
export type { ClassificationResult } from './intent-classifier';
export type { ErrorCategory, StructuredError } from './error-handler';
export type { RetryConfig } from './resilience';
