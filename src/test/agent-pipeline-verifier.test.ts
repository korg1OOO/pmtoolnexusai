/**
 * Agent Pipeline — Verifier Unit Tests
 *
 * Tests the post-execution verifier: DB re-query confirmation,
 * structured error messages, and ID extraction helper.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAction, extractEntityIds } from '@/lib/agent-pipeline/verifier';

// ─── Mock Supabase ──────────────────────────────────────────────────────────

function mockSupabase(opts: {
    data?: any[];
    error?: { message: string } | null;
} = {}) {
    const { data = null, error = null } = opts;
    return {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data, error }),
            }),
        }),
    };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('verifyAction', () => {
    describe('successful verification', () => {
        it('verifies a single entity', async () => {
            const sb = mockSupabase({
                data: [{ id: 'proj-1', name: 'My Project', code: 'MP', status: 'active' }],
            });

            const result = await verifyAction('create_project', ['proj-1'], sb);

            expect(result.verified).toBe(true);
            expect(result.userMessage).toContain('Verified');
            expect(result.userMessage).toContain('My Project');
            expect(result.entityDetails).toBeDefined();
        });

        it('verifies multiple entities', async () => {
            const sb = mockSupabase({
                data: [
                    { id: 'task-1', title: 'Phase 1', status: 'draft', wbs: '1' },
                    { id: 'task-2', title: 'Phase 2', status: 'draft', wbs: '2' },
                    { id: 'task-3', title: 'Phase 3', status: 'draft', wbs: '3' },
                ],
            });

            const result = await verifyAction('create_phase', ['task-1', 'task-2', 'task-3'], sb);

            expect(result.verified).toBe(true);
            expect(result.userMessage).toContain('3 items');
            expect(result.userMessage).toContain('created');
        });
    });

    describe('failed verification', () => {
        it('detects when entity is missing from DB', async () => {
            const sb = mockSupabase({ data: [] });

            const result = await verifyAction('create_project', ['proj-999'], sb);

            expect(result.verified).toBe(false);
            expect(result.userMessage).toContain('may not have completed');
            expect(result.userMessage).toContain('Next steps');
        });

        it('detects partial success (some entities missing)', async () => {
            const sb = mockSupabase({
                data: [{ id: 'task-1', title: 'Phase 1', status: 'draft', wbs: '1' }],
            });

            const result = await verifyAction('create_phase', ['task-1', 'task-2', 'task-3'], sb);

            expect(result.verified).toBe(false);
            expect(result.userMessage).toContain('Partial success');
            expect(result.userMessage).toContain('1 of 3');
        });

        it('handles database query errors', async () => {
            const sb = mockSupabase({ error: { message: 'RLS policy violation' } });

            const result = await verifyAction('log_issue', ['issue-1'], sb);

            expect(result.verified).toBe(false);
            expect(result.userMessage).toContain('Database query failed');
            expect(result.userMessage).toContain('permissions');
        });

        it('handles Supabase client exceptions', async () => {
            const sb = {
                from: vi.fn(() => { throw new Error('Network timeout'); }),
            };

            const result = await verifyAction('create_project', ['proj-1'], sb);

            expect(result.verified).toBe(false);
            expect(result.userMessage).toContain('Network timeout');
        });
    });

    describe('unknown intents', () => {
        it('trusts result for unrecognized intents', async () => {
            const sb = mockSupabase();
            const result = await verifyAction('some_unknown_action', ['id-1'], sb);

            expect(result.verified).toBe(true);
            expect(result.userMessage).toContain('completed successfully');
        });

        it('trusts result when no entity IDs provided', async () => {
            const sb = mockSupabase();
            const result = await verifyAction('create_project', [], sb);

            expect(result.verified).toBe(true);
        });
    });

    describe('user-facing messages', () => {
        it('includes correct action verb for create actions', async () => {
            const sb = mockSupabase({
                data: [{ id: 'sp-1', name: 'Sprint 1', status: 'active', start_date: '2026-01-01', end_date: '2026-01-14' }],
            });
            const result = await verifyAction('create_sprint', ['sp-1'], sb);
            expect(result.userMessage).toContain('created');
        });

        it('includes correct action verb for log actions', async () => {
            const sb = mockSupabase({
                data: [{ id: 'r-1', title: 'Budget Risk', status: 'identified', likelihood: 'high', impact: 'critical' }],
            });
            const result = await verifyAction('log_risk', ['r-1'], sb);
            expect(result.userMessage).toContain('logged');
        });

        it('suggests permission fix for RLS errors', async () => {
            const sb = mockSupabase({ error: { message: 'RLS policy violation' } });
            const result = await verifyAction('create_project', ['proj-1'], sb);
            expect(result.userMessage).toContain('permissions');
        });

        it('suggests different name for duplicate errors', async () => {
            const sb = mockSupabase({ error: { message: 'duplicate key violates unique constraint' } });
            const result = await verifyAction('create_project', ['proj-1'], sb);
            expect(result.userMessage).toContain('different name');
        });
    });
});

// ─── extractEntityIds ───────────────────────────────────────────────────────

describe('extractEntityIds', () => {
    it('extracts from a single object', () => {
        expect(extractEntityIds({ id: 'abc', name: 'test' })).toEqual(['abc']);
    });

    it('extracts from an array', () => {
        expect(extractEntityIds([{ id: 'a' }, { id: 'b' }, { id: 'c' }])).toEqual(['a', 'b', 'c']);
    });

    it('filters out null/undefined entries', () => {
        expect(extractEntityIds([{ id: 'a' }, { name: 'no-id' }, null])).toEqual(['a']);
    });

    it('returns empty array for null', () => {
        expect(extractEntityIds(null)).toEqual([]);
    });

    it('returns empty array for undefined', () => {
        expect(extractEntityIds(undefined)).toEqual([]);
    });

    it('returns empty array for non-object', () => {
        expect(extractEntityIds('string-value')).toEqual([]);
    });
});
