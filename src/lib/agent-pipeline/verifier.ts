// =============================================================================
// Agent Pipeline — Post-Execution Verifier
// =============================================================================
//
// Runs AFTER every AI action to confirm:
// 1. The entity was actually persisted to the database
// 2. Returns structured verification results
// 3. Generates user-facing messages with contextual next-step suggestions
//
// Unlike the auditor (pure functions), the verifier requires Supabase access
// to re-query the database. The Supabase client is injected as a parameter.
// =============================================================================

import type { VerificationResult } from './types';

// ─── Table-to-query mapping ──────────────────────────────────────────────────

/**
 * Maps action intents to the Supabase table and select fields to verify.
 */
const VERIFICATION_CONFIG: Record<string, {
    table: string;
    idField: string;
    selectFields: string;
    labelField: string;
}> = {
    create_project: { table: 'projects', idField: 'id', selectFields: 'id, name, code, status', labelField: 'name' },
    create_phase: { table: 'tasks', idField: 'id', selectFields: 'id, title, status, wbs', labelField: 'title' },
    create_activities: { table: 'tasks', idField: 'id', selectFields: 'id, title, status, wbs, parent_id', labelField: 'title' },
    create_phases_and_activities: { table: 'tasks', idField: 'id', selectFields: 'id, title, status, wbs', labelField: 'title' },
    log_issue: { table: 'issues', idField: 'id', selectFields: 'id, title, status, priority', labelField: 'title' },
    log_risk: { table: 'risks', idField: 'id', selectFields: 'id, title, status, likelihood, impact', labelField: 'title' },
    create_milestone: { table: 'deliverables', idField: 'id', selectFields: 'id, name, status, due_date', labelField: 'name' },
    create_epic: { table: 'epics', idField: 'id', selectFields: 'id, title, status', labelField: 'title' },
    create_story: { table: 'stories', idField: 'id', selectFields: 'id, title, status', labelField: 'title' },
    create_sprint: { table: 'sprints', idField: 'id', selectFields: 'id, name, status, start_date, end_date', labelField: 'name' },
    schedule_meeting: { table: 'meetings', idField: 'id', selectFields: 'id, title, date, status', labelField: 'title' },
};

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Verify that an action's result was persisted to the database.
 *
 * @param intent     - The action intent (e.g. "create_project")
 * @param entityIds  - ID(s) of the created/updated entities
 * @param supabase   - Supabase client instance (injected, not imported)
 * @returns Verification result with user-facing message
 *
 * @example
 * ```ts
 * const result = await verifyAction('create_project', ['proj-abc'], supabase);
 * // → { verified: true, userMessage: 'Project "My Project" created and verified.' }
 * ```
 */
export async function verifyAction(
    intent: string,
    entityIds: string[],
    supabase: any,
): Promise<VerificationResult> {
    const config = VERIFICATION_CONFIG[intent];

    // If we don't have a verification config for this intent, trust the result
    if (!config || entityIds.length === 0) {
        return {
            verified: true,
            userMessage: `Action completed successfully.`,
        };
    }

    try {
        // Re-query the database to confirm entities exist
        const { data, error } = await supabase
            .from(config.table)
            .select(config.selectFields)
            .in(config.idField, entityIds);

        if (error) {
            return {
                verified: false,
                userMessage: formatVerificationFailure(intent, entityIds, `Database query failed: ${error.message}`),
                tableName: config.table,
            };
        }

        const foundCount = data?.length ?? 0;
        const expectedCount = entityIds.length;

        if (foundCount === 0) {
            return {
                verified: false,
                userMessage: formatVerificationFailure(intent, entityIds, 'No entities found in database after creation'),
                tableName: config.table,
            };
        }

        if (foundCount < expectedCount) {
            return {
                verified: false,
                entityDetails: { found: data, expected: expectedCount, actual: foundCount },
                userMessage: `⚠️ Partial success: ${foundCount} of ${expectedCount} ${intent.replace(/_/g, ' ')} items verified. Some may have failed silently.`,
                tableName: config.table,
                entityId: entityIds[0],
            };
        }

        // All entities verified
        const label = data[0]?.[config.labelField] || entityIds[0];
        const entityLabel = foundCount === 1
            ? `"${label}"`
            : `${foundCount} items`;

        return {
            verified: true,
            entityDetails: data.length === 1 ? data[0] : { items: data, count: foundCount },
            userMessage: `✅ Verified: ${entityLabel} ${getActionVerb(intent)} successfully.`,
            tableName: config.table,
            entityId: entityIds[0],
        };
    } catch (err: any) {
        return {
            verified: false,
            userMessage: formatVerificationFailure(intent, entityIds, err.message || 'Unknown verification error'),
            tableName: config.table,
        };
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getActionVerb(intent: string): string {
    if (intent.startsWith('create_') || intent.startsWith('build_')) return 'created';
    if (intent.startsWith('log_')) return 'logged';
    if (intent.startsWith('schedule_')) return 'scheduled';
    if (intent.startsWith('generate_')) return 'generated';
    if (intent.startsWith('resolve_')) return 'resolved';
    if (intent.startsWith('complete_')) return 'completed';
    if (intent.startsWith('assign_')) return 'assigned';
    if (intent.startsWith('set_')) return 'set';
    if (intent.startsWith('map_')) return 'mapped';
    return 'completed';
}

function formatVerificationFailure(
    intent: string,
    entityIds: string[],
    errorDetail: string,
): string {
    const actionLabel = intent.replace(/_/g, ' ');
    const nextSteps = getSuggestedNextSteps(intent, errorDetail);

    return [
        `⚠️ Action "${actionLabel}" may not have completed successfully.`,
        `• What happened: ${errorDetail}`,
        `• Data saved: Could not verify`,
        `• Next steps: ${nextSteps}`,
    ].join('\n');
}

function getSuggestedNextSteps(intent: string, error: string): string {
    if (error.includes('permission') || error.includes('access') || error.includes('RLS')) {
        return 'Check that your account has the correct database permissions. Contact your administrator.';
    }
    if (error.includes('duplicate') || error.includes('unique') || error.includes('already exists')) {
        return 'An entity with the same identifier may already exist. Try using a different name.';
    }
    if (error.includes('not found') || error.includes('does not exist')) {
        return 'A required related entity may be missing. Check that all prerequisites exist.';
    }
    if (error.includes('foreign key') || error.includes('constraint')) {
        return 'A data relationship constraint prevented the action. Ensure related entities exist first.';
    }
    return 'Try the action again. If the problem persists, check the project data or contact support.';
}

// ─── Pre-fetch helper ────────────────────────────────────────────────────────

/**
 * Extract entity IDs from a Supabase insert/update result.
 * Works with both single objects and arrays.
 */
export function extractEntityIds(data: unknown): string[] {
    if (!data) return [];
    if (Array.isArray(data)) {
        return data.filter((d: any) => d?.id).map((d: any) => d.id);
    }
    if (typeof data === 'object' && (data as any).id) {
        return [(data as any).id];
    }
    return [];
}
