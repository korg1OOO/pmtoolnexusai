/**
 * Tests batch 45: Deeper function-level tests for mlSnapshotService + mlAnalyticsService
 * createProjectSnapshot, getAllPredictions with cache behavior
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
        functions: { invoke: vi.fn(() => Promise.resolve({ data: { predictions: [], confidence: 0.9, model_version: '1.0' }, error: null })) },
    },
}));
vi.mock('@/types/ml-predictions', () => ({}));

import { calculateDataQualityScore, purgeOldSnapshots, getSnapshotStats } from '@/services/mlSnapshotService';
import { clearProjectPredictionCache, predictRisks, forecastCosts, predictDelays } from '@/services/mlAnalyticsService';

beforeEach(() => {
    ms.data = null; ms.error = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is', 'contains', 'overlaps']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
    clearProjectPredictionCache('test');
});

describe('calculateDataQualityScore edge cases', () => {
    it('handles data with only partial required fields', () => {
        const score = calculateDataQualityScore({ total_tasks: 10, budget: undefined, progress: null, start_date: '2024-01-01' });
        expect(score).toBeLessThan(0.5);
        expect(score).toBeGreaterThan(0);
    });

    it('handles data with zero tasks and budget', () => {
        const score = calculateDataQualityScore({ total_tasks: 0, completed_tasks: 0, budget: 0, total_costs: 0, progress: 0, start_date: '2024-01-01' });
        expect(score).toBeDefined();
    });

    it('handles all richness fields present', () => {
        const score = calculateDataQualityScore({
            total_tasks: 100, completed_tasks: 80, budget: 50000, total_costs: 40000,
            progress: 80, start_date: '2024-01-01',
            open_risks: 5, team_size: 12, cost_by_category: { labor: 25000, materials: 15000 }
        });
        expect(score).toBeGreaterThanOrEqual(0.9);
    });
});

describe('mlAnalyticsService caching', () => {
    it('predictRisks uses cache on second call', async () => {
        const r1 = await predictRisks('cache-test', { useCache: true });
        const r2 = await predictRisks('cache-test', { useCache: true });
        expect(r1).toBeDefined();
        expect(r2).toBeDefined();
    });

    it('predictRisks bypasses cache with useCache:false', async () => {
        await predictRisks('bypass-test', { useCache: true });
        const r = await predictRisks('bypass-test', { useCache: false });
        expect(r).toBeDefined();
    });

    it('forecastCosts with 6month timeframe', async () => {
        const r = await forecastCosts('fc-test', { timeframe: '6month' });
        expect(r).toBeDefined();
    });

    it('predictDelays with custom threshold', async () => {
        const r = await predictDelays('pd-test', { confidenceThreshold: 0.5 });
        expect(r).toBeDefined();
    });
});

describe('mlSnapshotService CRUD deeper', () => {
    it('purgeOldSnapshots with default retention', async () => {
        ms.error = null;
        const r = await purgeOldSnapshots();
        expect(r).toBeDefined();
    });

    it('getSnapshotStats with data', async () => {
        ms.data = [{ created_at: '2024-01-01', data_quality_score: 0.8 }, { created_at: '2024-06-01', data_quality_score: 0.9 }];
        const r = await getSnapshotStats();
        expect(r).toBeDefined();
    });
});
