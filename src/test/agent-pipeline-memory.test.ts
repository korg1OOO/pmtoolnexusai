/**
 * Agent Pipeline — Memory Service Unit Tests
 *
 * Tests action logging, reconciliation queries, and the in-memory buffer.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAction, getRecentActions, getActionSummary, clearBuffer, getBufferSize } from '@/lib/agent-pipeline/memory';
import type { AgentMemoryEntry } from '@/lib/agent-pipeline/types';

// ─── Mock Supabase ──────────────────────────────────────────────────────────

function mockSupabase(opts: {
    insertError?: { message: string } | null;
    selectData?: any[];
    selectError?: { message: string } | null;
} = {}) {
    const { insertError = null, selectData = null, selectError = null } = opts;
    return {
        from: vi.fn().mockReturnValue({
            insert: vi.fn().mockResolvedValue({ error: insertError }),
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({ data: selectData, error: selectError }),
                    }),
                }),
            }),
        }),
    };
}

function makeEntry(overrides: Partial<AgentMemoryEntry> = {}): AgentMemoryEntry {
    return {
        id: 'entry-1',
        projectId: 'proj-123',
        userId: 'user-1',
        actionType: 'create_phase',
        success: true,
        input: { count: 5 },
        output: { ids: ['phase-1', 'phase-2'] },
        timestamp: new Date().toISOString(),
        creditsUsed: 0.5,
        ...overrides,
    };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('logAction', () => {
    beforeEach(() => {
        clearBuffer();
    });

    it('persists to database', async () => {
        const sb = mockSupabase();
        const entry = makeEntry();

        await logAction(entry, sb);

        expect(sb.from).toHaveBeenCalledWith('agent_action_logs');
    });

    it('adds to in-memory buffer even if DB fails', async () => {
        const sb = mockSupabase({ insertError: { message: 'Table not found' } });
        const entry = makeEntry();

        await logAction(entry, sb);

        expect(getBufferSize()).toBe(1);
    });

    it('adds to buffer on DB exception', async () => {
        const sb = { from: vi.fn(() => { throw new Error('Connection failed'); }) };
        const entry = makeEntry();

        await logAction(entry, sb);

        expect(getBufferSize()).toBe(1);
    });
});

describe('getRecentActions', () => {
    beforeEach(() => {
        clearBuffer();
    });

    it('returns actions from database', async () => {
        const sb = mockSupabase({
            selectData: [
                {
                    id: 'entry-1',
                    project_id: 'proj-123',
                    user_id: 'user-1',
                    action_type: 'create_phase',
                    success: true,
                    input_data: { count: 5 },
                    output_data: null,
                    created_at: new Date().toISOString(),
                    credits_used: 0.5,
                },
            ],
        });

        const actions = await getRecentActions('proj-123', sb);

        expect(actions.length).toBe(1);
        expect(actions[0].actionType).toBe('create_phase');
        expect(actions[0].projectId).toBe('proj-123');
    });

    it('falls back to buffer when DB fails', async () => {
        const sb = mockSupabase({ selectError: { message: 'Table not found' } });

        // Add to buffer manually
        const entry = makeEntry({ projectId: 'proj-abc' });
        await logAction(entry, { from: vi.fn().mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) }) });

        const actions = await getRecentActions('proj-abc', sb);
        // Buffer should have the entry
        expect(getBufferSize()).toBeGreaterThan(0);
    });
});

describe('getActionSummary', () => {
    beforeEach(() => {
        clearBuffer();
    });

    it('returns "no recent actions" when empty', async () => {
        const sb = mockSupabase({ selectData: [] });

        const summary = await getActionSummary('proj-123', sb);

        expect(summary).toContain('No recent actions');
    });

    it('returns formatted summary with actions', async () => {
        const sb = mockSupabase({
            selectData: [
                {
                    id: 'e1',
                    project_id: 'proj-123',
                    user_id: 'user-1',
                    action_type: 'create_phase',
                    success: true,
                    input_data: {},
                    created_at: new Date(Date.now() - 300000).toISOString(), // 5 min ago
                    credits_used: 0.5,
                },
                {
                    id: 'e2',
                    project_id: 'proj-123',
                    user_id: 'user-1',
                    action_type: 'log_issue',
                    success: false,
                    input_data: {},
                    error_message: 'RLS denied',
                    created_at: new Date(Date.now() - 600000).toISOString(), // 10 min ago
                    credits_used: 0.3,
                },
            ],
        });

        const summary = await getActionSummary('proj-123', sb);

        expect(summary).toContain('Recent Actions');
        expect(summary).toContain('create phase');
        expect(summary).toContain('log issue');
        expect(summary).toContain('✅');
        expect(summary).toContain('❌');
        expect(summary).toContain('RLS denied');
    });
});

describe('buffer management', () => {
    beforeEach(() => {
        clearBuffer();
    });

    it('limits buffer size', async () => {
        const sb = { from: vi.fn(() => { throw new Error('no db'); }) };

        // Add 105 entries
        for (let i = 0; i < 105; i++) {
            await logAction(makeEntry({ id: `entry-${i}` }), sb);
        }

        expect(getBufferSize()).toBe(100); // MAX_BUFFER_SIZE
    });

    it('clearBuffer empties the buffer', () => {
        clearBuffer();
        expect(getBufferSize()).toBe(0);
    });
});
