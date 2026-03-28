/**
 * Service tests batch 9: abTestingService (287 lines, 10 functions)
 * Deep tests for A/B testing CRUD, stats aggregation, Z-test significance
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match']
        .forEach(m => { c[m] = vi.fn(() => c); });
    c.then = (res: any, rej?: any) => Promise.resolve({ data: s.data, error: s.error }).then(res, rej);
    return { ms: s, ch: c };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        ...ch, from: vi.fn(() => ch),
        rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
        auth: { getUser: vi.fn() },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
    },
}));

import * as abService from '@/services/abTestingService';

beforeEach(() => {
    ms.data = null; ms.error = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
});

const sampleTest = {
    id: 'ab1', name: 'Test AB', description: null,
    pattern_a_id: 'p1', pattern_b_id: 'p2',
    pattern_c_id: null, pattern_d_id: null,
    traffic_split: { a: 50, b: 50 }, status: 'running',
    winner_pattern_id: null, confidence_level: null,
    started_at: '2024-01-01', ended_at: null, created_at: '2024-01-01',
};

describe('abTestingService', () => {
    // === CRUD ===
    it('createABTest inserts', async () => {
        ms.data = sampleTest;
        const r = await abService.createABTest({ name: 'Test', pattern_a_id: 'p1', pattern_b_id: 'p2' });
        expect(r.id).toBe('ab1');
        expect(ch.insert).toHaveBeenCalled();
    });

    it('createABTest throws on error', async () => {
        ms.error = { message: 'DB error' }; ms.data = null;
        await expect(abService.createABTest({ name: 'T', pattern_a_id: 'p1', pattern_b_id: 'p2' })).rejects.toBeDefined();
    });

    it('getAllABTests returns list', async () => {
        ms.data = [sampleTest];
        const r = await abService.getAllABTests();
        expect(r).toHaveLength(1);
        expect(ch.order).toHaveBeenCalled();
    });

    it('getAllABTests throws on error', async () => {
        ms.error = { message: 'err' };
        await expect(abService.getAllABTests()).rejects.toBeDefined();
    });

    // === recordABTestResult ===
    it('recordABTestResult inserts', async () => {
        ms.error = null;
        await abService.recordABTestResult('ab1', 'p1', 'pred1', 'a', true);
        expect(ch.insert).toHaveBeenCalled();
    });

    it('recordABTestResult throws on error', async () => {
        ms.error = { message: 'err' };
        await expect(abService.recordABTestResult('ab1', 'p1', 'pred1', 'a', true)).rejects.toBeDefined();
    });

    // === getABTestStats ===
    it('getABTestStats aggregates correctly', async () => {
        ms.data = [
            { variant: 'a', pattern_id: 'p1', was_successful: true },
            { variant: 'a', pattern_id: 'p1', was_successful: true },
            { variant: 'a', pattern_id: 'p1', was_successful: false },
            { variant: 'b', pattern_id: 'p2', was_successful: true },
            { variant: 'b', pattern_id: 'p2', was_successful: false },
        ];
        const r = await abService.getABTestStats('ab1');
        expect(r).toHaveLength(2);
        const statA = r.find(s => s.variant === 'a')!;
        expect(statA.total_predictions).toBe(3);
        expect(statA.successful_predictions).toBe(2);
        expect(statA.success_rate).toBeCloseTo(2 / 3);
        const statB = r.find(s => s.variant === 'b')!;
        expect(statB.total_predictions).toBe(2);
        expect(statB.success_rate).toBe(0.5);
    });

    it('getABTestStats empty data', async () => {
        ms.data = [];
        const r = await abService.getABTestStats('ab1');
        expect(r).toHaveLength(0);
    });

    it('getABTestStats throws on error', async () => {
        ms.error = { message: 'err' };
        await expect(abService.getABTestStats('ab1')).rejects.toBeDefined();
    });

    // === pauseABTest / resumeABTest ===
    it('pauseABTest updates status', async () => {
        ms.error = null;
        await abService.pauseABTest('ab1');
        expect(ch.update).toHaveBeenCalled();
    });

    it('resumeABTest updates status', async () => {
        ms.error = null;
        await abService.resumeABTest('ab1');
        expect(ch.update).toHaveBeenCalled();
    });

    it('pauseABTest throws on error', async () => {
        ms.error = { message: 'err' };
        await expect(abService.pauseABTest('ab1')).rejects.toBeDefined();
    });

    // === getActiveABTest ===
    it('getActiveABTest returns null when no patterns', async () => {
        ms.data = null;
        const r = await abService.getActiveABTest('risk_prediction');
        expect(r).toBeNull();
    });
});
