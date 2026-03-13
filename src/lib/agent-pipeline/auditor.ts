// =============================================================================
// Agent Pipeline — Pre-Execution Auditor
// =============================================================================
//
// Runs BEFORE every AI action to validate:
// 1. Role — does the user's project role permit this action?
// 2. Project — is a project selected (if required)?
// 3. Prerequisites — do required entities exist (phases, members, etc.)?
//
// This is a pure-function module with no Supabase or React dependencies.
// All context is received as arguments, making it fully testable.
// =============================================================================

import { ROLE_PERMISSIONS } from '@/types/ai-agents';
import type { ProjectRole } from '@/types/ai-agents';
import type { ActionContext, FeasibilityReport } from './types';
import {
    ACTION_REQUIRED_PERMISSIONS,
    ACTIONS_REQUIRING_PHASES,
    ACTIONS_REQUIRING_MEMBERS,
    ACTIONS_REQUIRING_ISSUES,
    PROJECT_INDEPENDENT_ACTIONS,
} from './types';

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Audit an action intent before execution.
 *
 * @param intent  - The action intent string (e.g. "create_phase", "log_risk")
 * @param context - Current user/project context
 * @returns A feasibility report indicating whether the action should proceed
 *
 * @example
 * ```ts
 * const report = auditAction('create_activities', {
 *   userRole: 'viewer',
 *   projectId: 'proj-123',
 *   projectData: { hasPhases: false },
 * });
 * // → { feasible: false, reason: '...', failedCheck: 'role' }
 * ```
 */
export function auditAction(
    intent: string,
    context: ActionContext,
): FeasibilityReport {
    // 1. Project check (most actions require a selected project)
    const projectCheck = checkProject(intent, context);
    if (!projectCheck.feasible) return projectCheck;

    // 2. Role / permission check
    const roleCheck = checkRole(intent, context);
    if (!roleCheck.feasible) return roleCheck;

    // 3. Prerequisites check
    const prereqCheck = checkPrerequisites(intent, context);
    if (!prereqCheck.feasible) return prereqCheck;

    return { feasible: true };
}

// ─── Individual Checks ───────────────────────────────────────────────────────

function checkProject(
    intent: string,
    context: ActionContext,
): FeasibilityReport {
    if (PROJECT_INDEPENDENT_ACTIONS.includes(intent)) {
        return { feasible: true };
    }

    if (!context.projectId) {
        return {
            feasible: false,
            reason: 'No project selected. Please select or create a project first.',
            suggestedAction: 'Select a project from the sidebar, or say "create a new project".',
            failedCheck: 'project',
        };
    }

    return { feasible: true };
}

function checkRole(
    intent: string,
    context: ActionContext,
): FeasibilityReport {
    const requiredPerms = ACTION_REQUIRED_PERMISSIONS[intent];

    // If no permissions mapped for this action, allow it (read-only or unknown)
    if (!requiredPerms || requiredPerms.length === 0) {
        return { feasible: true };
    }

    const userRole = context.userRole as ProjectRole;
    const userPerms = ROLE_PERMISSIONS[userRole] || [];

    // User needs at least one of the required permissions
    const hasPermission = requiredPerms.some(perm => userPerms.includes(perm));

    if (!hasPermission) {
        const actionLabel = intent.replace(/_/g, ' ');
        const roleLabel = userRole || 'unknown';

        return {
            feasible: false,
            reason: `Your role (${roleLabel}) does not have permission to ${actionLabel}. Required: ${requiredPerms.join(' or ')}.`,
            suggestedAction: `Ask a project admin or PM to perform this action, or request elevated access.`,
            failedCheck: 'role',
        };
    }

    return { feasible: true };
}

function checkPrerequisites(
    intent: string,
    context: ActionContext,
): FeasibilityReport {
    const pd = context.projectData;

    // Skip prerequisite checks if no project data was loaded
    // (this means the caller chose not to pre-fetch — we allow the action
    //  and let the executor handle any DB errors)
    if (!pd) {
        return { feasible: true };
    }

    // Actions that need existing phases
    if (ACTIONS_REQUIRING_PHASES.includes(intent) && !pd.hasPhases) {
        return {
            feasible: false,
            reason: 'This action requires existing phases. Create phases first before adding activities or milestones.',
            suggestedAction: 'Say "create 5 phases" to set up the project structure first.',
            failedCheck: 'prerequisite',
        };
    }

    // Actions that need existing team members
    if (ACTIONS_REQUIRING_MEMBERS.includes(intent) && !pd.hasMembers) {
        return {
            feasible: false,
            reason: 'This action requires team members to be assigned to the project.',
            suggestedAction: 'Say "assign 5 team members" to add people to the project first.',
            failedCheck: 'prerequisite',
        };
    }

    // Actions that need existing issues
    if (ACTIONS_REQUIRING_ISSUES.includes(intent) && !pd.hasIssues) {
        return {
            feasible: false,
            reason: 'No issues found to resolve. Log issues first.',
            suggestedAction: 'Say "log 5 issues" to create issues first.',
            failedCheck: 'prerequisite',
        };
    }

    return { feasible: true };
}
