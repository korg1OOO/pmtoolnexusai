// =============================================================================
// Agent Pipeline — Agent Memory Service
// =============================================================================
//
// Provides persistent logging and reconciliation for agent actions.
// Stores action logs in Supabase (agent_action_logs table) and
// enables "what did you do?" reconciliation queries.
//
// Design:
// - Supabase client is injected as a parameter (testable)
// - Graceful degradation: if the table doesn't exist, silently skips
// - In-memory buffer as fallback when DB is unavailable
// =============================================================================

import type { AgentMemoryEntry, VerificationResult } from './types';

// In-memory buffer for when DB is unavailable
const memoryBuffer: AgentMemoryEntry[] = [];
const MAX_BUFFER_SIZE = 100;

// ─── Log Action ──────────────────────────────────────────────────────────────

/**
 * Log an agent action to persistent storage.
 *
 * @param entry - The memory entry to store
 * @param supabase - Supabase client (injected, not imported)
 */
export async function logAction(
    entry: AgentMemoryEntry,
    supabase: any,
): Promise<void> {
    // Always add to in-memory buffer (for reconciliation even without DB)
    addToBuffer(entry);

    try {
        const { error } = await supabase
            .from('agent_action_logs')
            .insert({
                id: entry.id,
                project_id: entry.projectId,
                user_id: entry.userId,
                action_type: entry.actionType,
                success: entry.success,
                input_data: entry.input,
                output_data: entry.output ?? null,
                verification: entry.verification ?? null,
                error_message: entry.error ?? null,
                credits_used: entry.creditsUsed,
                created_at: entry.timestamp,
            });

        if (error) {
            // Table might not exist yet — this is OK during rollout
            console.warn('[agent-memory] Failed to persist action log:', error.message);
        }
    } catch (err: any) {
        console.warn('[agent-memory] Could not reach DB, using in-memory buffer:', err.message);
    }
}

// ─── Query Recent Actions ────────────────────────────────────────────────────

/**
 * Retrieve recent agent actions for a project.
 * Used to answer "what did you do?" reconciliation queries.
 *
 * @param projectId - The project to query
 * @param supabase  - Supabase client
 * @param limit     - Max entries to return
 */
export async function getRecentActions(
    projectId: string,
    supabase: any,
    limit: number = 20,
): Promise<AgentMemoryEntry[]> {
    try {
        const { data, error } = await supabase
            .from('agent_action_logs')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            // Fallback to in-memory buffer
            return getBufferedActions(projectId, limit);
        }

        return (data || []).map(mapDbToEntry);
    } catch {
        return getBufferedActions(projectId, limit);
    }
}

/**
 * Get a human-readable summary of recent actions for reconciliation.
 *
 * @param projectId - The project to summarize
 * @param supabase  - Supabase client
 */
export async function getActionSummary(
    projectId: string,
    supabase: any,
): Promise<string> {
    const recent = await getRecentActions(projectId, supabase, 10);

    if (recent.length === 0) {
        return 'No recent actions recorded for this project.';
    }

    const lines = recent.map((entry, i) => {
        const status = entry.success ? '✅' : '❌';
        const time = formatRelativeTime(entry.timestamp);
        const action = entry.actionType.replace(/_/g, ' ');
        return `${i + 1}. ${status} **${action}** — ${time}${!entry.success ? ` (${entry.error || 'unknown error'})` : ''}`;
    });

    return [
        `📝 **Recent Actions** (last ${recent.length}):`,
        '',
        ...lines,
    ].join('\n');
}

// ─── In-Memory Buffer ────────────────────────────────────────────────────────

function addToBuffer(entry: AgentMemoryEntry): void {
    memoryBuffer.unshift(entry);
    if (memoryBuffer.length > MAX_BUFFER_SIZE) {
        memoryBuffer.pop();
    }
}

function getBufferedActions(projectId: string, limit: number): AgentMemoryEntry[] {
    return memoryBuffer
        .filter(e => e.projectId === projectId)
        .slice(0, limit);
}

/** Export for testing */
export function clearBuffer(): void {
    memoryBuffer.length = 0;
}

export function getBufferSize(): number {
    return memoryBuffer.length;
}

// ─── DB → Type mapping ──────────────────────────────────────────────────────

function mapDbToEntry(row: any): AgentMemoryEntry {
    return {
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        actionType: row.action_type,
        success: row.success,
        input: row.input_data ?? {},
        output: row.output_data ?? undefined,
        verification: row.verification ?? undefined,
        error: row.error_message ?? undefined,
        timestamp: row.created_at,
        creditsUsed: row.credits_used ?? 0,
    };
}

// ─── Time helper ─────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: string): string {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
}
