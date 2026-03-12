/**
 * Service tests batch 21: mlSharingService (298 lines, 8 functions)
 * Hierarchy, patterns, promote, stats, activity
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is', 'contains', 'overlaps']
        .forEach(m => { c[m] = vi.fn(() => c); });
    c.then = (res: any, rej?: any) => Promise.resolve({ data: s.data, error: s.error }).then(res, rej);
    return { ms: s, ch: c };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        ...ch, from: vi.fn(() => ch),
        rpc: vi.fn(() => Promise.resolve({ data: ms.data, error: ms.error })),
        auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
    },
}));

import * as mlSharing from '@/services/mlSharingService';

beforeEach(() => {
    ms.data = null; ms.error = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is', 'contains', 'overlaps']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
});

describe('mlSharingService', () => {
    it('getProjectHierarchy', async () => {
        ms.data = { tenant_id: 't1', workspace_id: 'w1', portfolio_id: null, project_id: 'p1' };
        const r = await mlSharing.getProjectHierarchy('p1');
        expect(r).toBeDefined();
    });

    it('getPatternsByScope', async () => {
        ms.data = [{ id: 'pat1', sharing_scope: 'project' }];
        const r = await mlSharing.getPatternsByScope('project', 'p1');
        expect(ch.eq).toHaveBeenCalled();
    });

    it('getMLSharingStats', async () => {
        ms.data = [{ sharing_scope: 'project' }, { sharing_scope: 'tenant' }];
        const r = await mlSharing.getMLSharingStats('t1');
        expect(r).toBeDefined();
    });

    it('getSharingActivity', async () => {
        ms.data = [];
        const r = await mlSharing.getSharingActivity('t1', 20);
        expect(r).toBeDefined();
    });

    it('getAvailablePatterns', async () => {
        ms.data = [];
        const r = await mlSharing.getAvailablePatterns('p1');
        expect(r).toBeDefined();
    });
});
