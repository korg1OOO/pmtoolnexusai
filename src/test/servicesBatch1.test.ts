/**
 * Service tests batch 1: commentsService, securityAuditService, scenarioService, filterPresetService
 * Uses vi.hoisted() + vi.mock() to properly handle mock hoisting
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted runs BEFORE vi.mock, so these are available in the mock factory
const { mockState, chain } = vi.hoisted(() => {
    const state = { data: null as any, error: null as any, count: null as any, authUser: { user: { id: 'user-1', email: 'test@test.com' } } as any };

    const c: any = {};
    const methods = [
        'from', 'select', 'insert', 'update', 'upsert', 'delete',
        'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
        'is', 'in', 'contains', 'order', 'limit', 'range',
        'single', 'maybeSingle', 'filter', 'match', 'not', 'or', 'textSearch',
    ];
    methods.forEach(m => { c[m] = vi.fn(() => c); });
    // Make chain thenable so await works
    c.then = function (resolve: any, reject?: any) {
        return Promise.resolve({ data: state.data, error: state.error, count: state.count }).then(resolve, reject);
    };

    return { mockState: state, chain: c };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        ...chain,
        from: chain.from,
        rpc: vi.fn(() => Promise.resolve({ data: mockState.data, error: mockState.error })),
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: mockState.authUser, error: null })),
        },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
        functions: { invoke: vi.fn(() => Promise.resolve({ data: null, error: null })) },
    },
}));

// ---- Imports (after mock) ----
import { CommentsService } from '@/services/commentsService';
import * as securityAuditService from '@/services/securityAuditService';
import { scenarioService } from '@/services/scenarioService';
import { filterPresetService } from '@/services/filterPresetService';

beforeEach(() => {
    mockState.data = null;
    mockState.error = null;
    mockState.count = null;
    mockState.authUser = { user: { id: 'user-1', email: 'test@test.com' } };
    vi.clearAllMocks();
    // Re-setup chain returns
    const methods = [
        'from', 'select', 'insert', 'update', 'upsert', 'delete',
        'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
        'is', 'in', 'contains', 'order', 'limit', 'range',
        'single', 'maybeSingle', 'filter', 'match', 'not', 'or', 'textSearch',
    ];
    methods.forEach(m => { chain[m].mockImplementation(() => chain); });
});

// =================== CommentsService ===================
describe('CommentsService', () => {
    describe('getComments', () => {
        it('returns threaded comments', async () => {
            mockState.data = [
                { id: 'c1', content: 'Root', parent_id: null },
                { id: 'c2', content: 'Reply', parent_id: 'c1' },
            ];
            const result = await CommentsService.getComments('s1');
            expect(result).toHaveLength(1);
            expect(result[0].replies).toHaveLength(1);
        });

        it('returns empty on error', async () => {
            mockState.error = { message: 'Fail' };
            expect(await CommentsService.getComments('s1')).toEqual([]);
        });
    });

    describe('getCellComments', () => {
        it('returns cell comments', async () => {
            mockState.data = [{ id: 'c1', parent_id: null }];
            const result = await CommentsService.getCellComments('s1', 'A1');
            expect(result).toHaveLength(1);
        });
    });

    describe('createComment', () => {
        it('creates with user info', async () => {
            mockState.data = { id: 'new-1', content: 'Test' };
            const result = await CommentsService.createComment(
                { sheet_id: 's1', cell_ref: 'A1', content: 'Test' }, 'User', 'u@t.com'
            );
            expect(result?.id).toBe('new-1');
        });

        it('returns null when no user', async () => {
            mockState.authUser = { user: null };
            const result = await CommentsService.createComment(
                { sheet_id: 's1', cell_ref: 'A1', content: 'Test' }, 'User'
            );
            expect(result).toBeNull();
        });
    });

    describe('updateComment', () => {
        it('success', async () => { expect(await CommentsService.updateComment('c1', 'X')).toBe(true); });
        it('error', async () => { mockState.error = { message: 'F' }; expect(await CommentsService.updateComment('c1', 'X')).toBe(false); });
    });

    describe('deleteComment', () => {
        it('success', async () => { expect(await CommentsService.deleteComment('c1')).toBe(true); });
        it('error', async () => { mockState.error = { message: 'F' }; expect(await CommentsService.deleteComment('c1')).toBe(false); });
    });

    describe('resolveComment', () => {
        it('resolve', async () => { expect(await CommentsService.resolveComment('c1', true)).toBe(true); });
        it('unresolve', async () => { expect(await CommentsService.resolveComment('c1', false)).toBe(true); });
        it('no user', async () => { mockState.authUser = { user: null }; expect(await CommentsService.resolveComment('c1', true)).toBe(false); });
        it('error', async () => { mockState.error = { message: 'F' }; expect(await CommentsService.resolveComment('c1', true)).toBe(false); });
    });

    describe('getUnresolvedCount', () => {
        it('returns count', async () => { mockState.count = 5; expect(await CommentsService.getUnresolvedCount('s1')).toBe(5); });
        it('returns 0 on error', async () => { mockState.error = { message: 'F' }; expect(await CommentsService.getUnresolvedCount('s1')).toBe(0); });
    });

    describe('subscribeToComments', () => {
        it('returns unsub', () => { expect(typeof CommentsService.subscribeToComments('s1', vi.fn())).toBe('function'); });
    });
});

// =================== SecurityAuditService ===================
describe('securityAuditService', () => {
    describe('getSecurityLogs', () => {
        it('returns logs', async () => { mockState.data = [{ id: '1' }]; expect(await securityAuditService.getSecurityLogs()).toHaveLength(1); });
        it('throws on error', async () => { mockState.error = { message: 'F' }; await expect(securityAuditService.getSecurityLogs()).rejects.toBeDefined(); });
        it('applies filters', async () => {
            mockState.data = [];
            await securityAuditService.getSecurityLogs({ severity: 'critical', limit: 10, offset: 5 });
            expect(chain.eq).toHaveBeenCalled();
            expect(chain.limit).toHaveBeenCalledWith(10);
        });
    });

    describe('getSecurityStats', () => {
        it('calculates', async () => {
            mockState.data = [
                { severity: 'critical', event_type: 'login_failed', created_at: new Date(Date.now() - 3600000).toISOString() },
                { severity: 'info', event_type: 'page_view', created_at: new Date(Date.now() - 172800000).toISOString() },
            ];
            const s = await securityAuditService.getSecurityStats();
            expect(s.total).toBe(2);
            expect(s.critical).toBe(1);
        });
    });

    describe('getLoginAttempts', () => {
        it('returns', async () => { mockState.data = [{ id: '1' }]; expect(await securityAuditService.getLoginAttempts('u1')).toHaveLength(1); });
    });
});

// =================== ScenarioService ===================
describe('scenarioService', () => {
    it('getScenarios success', async () => { mockState.data = [{ id: 's1' }]; expect(await scenarioService.getScenarios('p1')).toHaveLength(1); });
    it('getScenarios error', async () => { mockState.error = { message: 'F' }; await expect(scenarioService.getScenarios('p1')).rejects.toBeDefined(); });
    it('deleteScenario', async () => { await expect(scenarioService.deleteScenario('s1')).resolves.toBeUndefined(); });
    it('updateScenario', async () => { mockState.data = { id: 's1', name: 'X' }; const r = await scenarioService.updateScenario('s1', { name: 'X' }); expect(r.name).toBe('X'); });
});

// =================== FilterPresetService ===================
describe('filterPresetService', () => {
    it('saveFilterPreset', async () => { const r = await filterPresetService.saveFilterPreset('u1', 'p1', 'F', {} as any); expect(r.name).toBe('F'); });
    it('saveFilterPreset error', async () => { mockState.error = { message: 'F' }; await expect(filterPresetService.saveFilterPreset('u1', 'p1', 'F', {} as any)).rejects.toBeDefined(); });
    it('getFilterPresets', async () => {
        mockState.data = [
            { preference_value: { id: 'p1', isDefault: true, createdDate: '2024-01-01' } },
            { preference_value: { id: 'p2', isDefault: false, createdDate: '2024-02-01' } },
        ];
        const r = await filterPresetService.getFilterPresets('u1', 'p1');
        expect(r[0].isDefault).toBe(true);
    });
    it('deleteFilterPreset', async () => { await expect(filterPresetService.deleteFilterPreset('u1', 'p1', 'x')).resolves.toBeUndefined(); });
    it('deleteFilterPreset error', async () => { mockState.error = { message: 'F' }; await expect(filterPresetService.deleteFilterPreset('u1', 'p1', 'x')).rejects.toBeDefined(); });
});
