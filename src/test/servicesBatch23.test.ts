/**
 * Service tests batch 23: mlSnapshotService (298 lines, 5 functions)
 * calculateDataQualityScore (PURE), createProjectSnapshot, getTrainingDataRange, purgeOldSnapshots, getSnapshotStats
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any, count: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is']
        .forEach(m => { c[m] = vi.fn(() => c); });
    c.then = (res: any, rej?: any) => Promise.resolve({ data: s.data, error: s.error, count: s.count }).then(res, rej);
    return { ms: s, ch: c };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        ...ch, from: vi.fn(() => ch),
        rpc: vi.fn(() => Promise.resolve({ data: ms.data, error: ms.error })),
        auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
    },
}));

import { calculateDataQualityScore, getTrainingDataRange, purgeOldSnapshots, getSnapshotStats } from '@/services/mlSnapshotService';

beforeEach(() => {
    ms.data = null; ms.error = null; ms.count = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
});

// =================== calculateDataQualityScore (PURE) ===================
describe('calculateDataQualityScore', () => {
    it('returns 0 for empty data', () => {
        expect(calculateDataQualityScore({})).toBe(0);
    });

    it('scores required fields (0.1 each)', () => {
        const score = calculateDataQualityScore({ total_tasks: 10, budget: 1000, progress: 50, start_date: '2024-01-01' });
        expect(score).toBeGreaterThanOrEqual(0.4);
    });

    it('scores data consistency', () => {
        const score = calculateDataQualityScore({ total_tasks: 10, completed_tasks: 5, budget: 1000, total_costs: 500, progress: 50, start_date: '2024-01-01' });
        expect(score).toBeGreaterThanOrEqual(0.6);
    });

    it('scores data richness', () => {
        const score = calculateDataQualityScore({
            total_tasks: 10, completed_tasks: 5, budget: 1000, total_costs: 500, progress: 50, start_date: '2024-01-01',
            open_risks: 3, team_size: 5, cost_by_category: { labor: 300, materials: 200 }
        });
        expect(score).toBeGreaterThanOrEqual(0.9);
    });

    it('caps score at 1', () => {
        const score = calculateDataQualityScore({
            total_tasks: 10, completed_tasks: 5, budget: 1000, total_costs: 500, progress: 50, start_date: '2024-01-01',
            open_risks: 3, team_size: 5, cost_by_category: { labor: 300 }
        });
        expect(score).toBeLessThanOrEqual(1);
    });

    it('handles null/undefined fields', () => {
        const score = calculateDataQualityScore({ total_tasks: null, budget: undefined });
        expect(score).toBe(0);
    });

    it('fails consistency for completed > total', () => {
        const score1 = calculateDataQualityScore({ total_tasks: 10, completed_tasks: 5, budget: 1000, total_costs: 500 });
        const score2 = calculateDataQualityScore({ total_tasks: 10, completed_tasks: 15, budget: 1000, total_costs: 500 });
        expect(score1).toBeGreaterThan(score2);
    });

    it('fails consistency for negative costs', () => {
        const score = calculateDataQualityScore({ total_tasks: 10, budget: 1000, total_costs: -100 });
        expect(score).toBeLessThan(0.5);
    });
});

// =================== CRUD Functions ===================
describe('mlSnapshotService CRUD', () => {
    it('getTrainingDataRange', async () => {
        ms.data = [{ id: 's1', snapshot_type: 'project' }];
        const r = await getTrainingDataRange(new Date('2024-01-01'), new Date('2024-12-31'));
        expect(r).toBeDefined();
    });

    it('purgeOldSnapshots', async () => {
        ms.error = null;
        const r = await purgeOldSnapshots(365);
        expect(r).toBeDefined();
    });

    it('getSnapshotStats', async () => {
        ms.data = [{ created_at: '2024-01-01' }, { created_at: '2024-06-01' }];
        const r = await getSnapshotStats();
        expect(r).toBeDefined();
    });
});
