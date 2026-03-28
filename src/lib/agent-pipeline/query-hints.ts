// =============================================================================
// Agent Pipeline — Refresh Query Hints
// =============================================================================
//
// Maps AI action types to React Query cache keys that should be invalidated
// after the action executes. This ensures the UI shows fresh data without
// requiring manual page refreshes.
//
// Design:
// - Pure mapping: no React or Supabase dependencies
// - Returns query keys in the same format used by useQueryClient()
// - Supports project-scoped and global query keys
// =============================================================================

/**
 * Maps action intents to the React Query keys they invalidate.
 *
 * Key format matches the existing codebase convention:
 * - ['tasks', projectId]       — project-scoped task list
 * - ['projects']               — global project list
 * - ['team-members', projectId] — project-scoped members
 */
const ACTION_QUERY_KEYS: Record<string, string[][]> = {
    // ── Project-level ────────────────────────────────────────────────────
    create_project: [
        ['projects'],
        ['project-stats'],
    ],

    // ── Schedule / Tasks ─────────────────────────────────────────────────
    create_phase: [
        ['tasks'],
        ['project-phases'],
    ],
    create_activities: [
        ['tasks'],
    ],
    create_phases_and_activities: [
        ['tasks'],
        ['project-phases'],
    ],
    build_phase_from_description: [
        ['tasks'],
        ['project-phases'],
    ],
    create_milestone: [
        ['tasks'],
        ['milestones'],
    ],

    // ── Team ─────────────────────────────────────────────────────────────
    assign_members: [
        ['team-members'],
        ['user-roles'],
    ],
    log_leave: [
        ['team-members'],
        ['leave-records'],
    ],

    // ── Finance ──────────────────────────────────────────────────────────
    set_budget: [
        ['budgets'],
        ['project-financials'],
    ],
    log_expense: [
        ['expenses'],
        ['project-financials'],
    ],
    setup_financials: [
        ['budgets'],
        ['expenses'],
        ['project-financials'],
    ],

    // ── Risk & Issues ────────────────────────────────────────────────────
    log_issue: [
        ['issues'],
        ['project-issues'],
    ],
    log_risk: [
        ['risks'],
        ['project-risks'],
    ],
    resolve_issue: [
        ['issues'],
        ['project-issues'],
    ],
    log_project_controls: [
        ['issues'],
        ['risks'],
        ['milestones'],
    ],

    // ── Agile ────────────────────────────────────────────────────────────
    create_epic: [
        ['epics'],
        ['agile-backlog'],
    ],
    create_story: [
        ['stories'],
        ['agile-backlog'],
    ],
    create_sprint: [
        ['sprints'],
        ['agile-backlog'],
    ],
    complete_sprint: [
        ['sprints'],
        ['stories'],
        ['agile-backlog'],
    ],
    setup_agile_backlog: [
        ['epics'],
        ['stories'],
        ['sprints'],
        ['agile-backlog'],
    ],
    close_sprint_cycle: [
        ['sprints'],
        ['stories'],
        ['issues'],
        ['agile-backlog'],
    ],

    // ── Governance ───────────────────────────────────────────────────────
    schedule_meeting: [
        ['meetings'],
        ['calendar-events'],
    ],
    log_decision: [
        ['decisions'],
        ['meetings'],
    ],
    log_governance_meetings: [
        ['meetings'],
        ['decisions'],
    ],

    // ── Requirements & Documents ─────────────────────────────────────────
    log_requirement: [
        ['requirements'],
        ['traceability'],
    ],
    validate_requirements: [
        ['requirements'],
    ],
    create_change_request: [
        ['change-requests'],
        ['requirements'],
    ],
    create_charter: [
        ['documents'],
        ['project-charter'],
    ],
    create_deliverables: [
        ['deliverables'],
    ],
    map_traceability: [
        ['traceability'],
        ['requirements'],
    ],
    create_stakeholder: [
        ['stakeholders'],
    ],
    log_lesson_learned: [
        ['lessons-learned'],
    ],
    generate_presentation: [
        ['documents'],
        ['presentations'],
    ],
    generate_final_report: [
        ['documents'],
        ['reports'],
    ],
    generate_charter_and_deliverables: [
        ['documents'],
        ['project-charter'],
        ['deliverables'],
    ],

    // ── Update operations ────────────────────────────────────────────────
    update_task_status: [
        ['tasks'],
    ],
    update_task: [
        ['tasks'],
    ],
    update_risk_status: [
        ['risks'],
        ['project-risks'],
    ],
    update_issue_status: [
        ['issues'],
        ['project-issues'],
    ],
    update_project: [
        ['projects'],
        ['project-stats'],
    ],

    // ── Delete operations ────────────────────────────────────────────────
    delete_task: [
        ['tasks'],
    ],
    delete_phase: [
        ['tasks'],
        ['project-phases'],
    ],
    delete_risk: [
        ['risks'],
        ['project-risks'],
    ],
    delete_issue: [
        ['issues'],
        ['project-issues'],
    ],
    delete_member: [
        ['team-members'],
        ['user-roles'],
    ],

    // ── Phase 2: Extended operations ─────────────────────────────────────
    move_story_to_sprint: [
        ['backlog_items'],
        ['sprints'],
        ['agile-backlog'],
    ],
    update_story_status: [
        ['backlog_items'],
        ['agile-backlog'],
    ],
    update_budget: [
        ['budgets'],
        ['project-financials'],
    ],

    // ── Phase 3: Extended operations ─────────────────────────────────────
    query_documents: [], update_document_status: [['documents']], delete_document: [['documents']],
    query_deliverables: [], update_deliverable: [['deliverables']], delete_deliverable: [['deliverables']],
    query_change_requests: [], update_change_request: [['change-requests']],
    query_approvals: [], approve_item: [['approvals']], reject_item: [['approvals']],
    query_stakeholders: [], delete_stakeholder: [['stakeholders']],
    query_requirements: [], delete_requirement: [['requirements'], ['traceability']],
    query_quality_items: [], create_quality_item: [['quality_items']],
    query_notes: [], create_note: [['notes']], delete_note: [['notes']],
    query_calendar: [],
    query_lessons_learned: [], delete_lesson_learned: [['lessons-learned']],
    query_resources: [],
    query_action_items: [], update_action_item: [['meeting_action_items'], ['action-items']],
    update_meeting: [['meetings']], cancel_meeting: [['meetings']],
};

/**
 * Get the React Query keys that should be invalidated after an action.
 *
 * @param actionType - The action intent (e.g., 'create_project')
 * @param projectId  - Optional project ID for scoped keys
 * @returns Array of query key arrays to pass to queryClient.invalidateQueries()
 *
 * @example
 * ```ts
 * const keys = getQueryHints('create_phase', 'proj-123');
 * // → [['tasks', 'proj-123'], ['project-phases', 'proj-123']]
 *
 * keys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
 * ```
 */
export function getQueryHints(
    actionType: string,
    projectId?: string | null,
): string[][] {
    const baseKeys = ACTION_QUERY_KEYS[actionType] || [];

    if (!projectId) return baseKeys;

    // Append projectId to scoped keys (most keys are project-scoped)
    return baseKeys.map(key => {
        // Global keys like ['projects'] stay global
        const globalKeys = ['projects', 'project-stats'];
        if (globalKeys.includes(key[0])) return key;
        // Everything else gets project-scoped
        return [...key, projectId];
    });
}

/**
 * Check if an action type has any query hints defined.
 */
export function hasQueryHints(actionType: string): boolean {
    return actionType in ACTION_QUERY_KEYS;
}
