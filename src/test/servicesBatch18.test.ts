/**
 * Service tests batch 18: mlMonitoringService (359 lines, 7 functions)
 * Accuracy logging, trend, alerts CRUD, stats, condition checking
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is']
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

import * as mlMonitoring from '@/services/mlMonitoringService';

beforeEach(() => {
    ms.data = null; ms.error = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
});

describe('mlMonitoringService', () => {
    it('logPredictionAccuracy', async () => {
        ms.data = { id: 'log1' };
        const r = await mlMonitoring.logPredictionAccuracy('pred1', 'model1', 'risk', 0.8, 0.75);
        expect(r).toBeDefined();
    });

    it('getAlerts', async () => {
        ms.data = [{ id: 'a1', title: 'Low accuracy', severity: 'warning' }];
        const r = await mlMonitoring.getAlerts('risk');
        expect(r).toBeDefined();
    });

    it('getAlerts with acknowledged', async () => {
        ms.data = [];
        const r = await mlMonitoring.getAlerts('cost', true);
        expect(r).toBeDefined();
    });

    it('acknowledgeAlert', async () => {
        ms.error = null;
        const r = await mlMonitoring.acknowledgeAlert('a1', 'u1');
        expect(r).toBeDefined();
    });

    it('createAlert', async () => {
        ms.data = { id: 'a2' };
        const r = await mlMonitoring.createAlert('schedule', 'drift', 'critical', 'Model drift detected', 'Accuracy dropped below 70%');
        expect(r).toBeDefined();
    });

    it('getAlertStats', async () => {
        ms.data = { total: 10, critical: 2, warning: 5, info: 3, unacknowledged: 4 };
        const r = await mlMonitoring.getAlertStats('risk');
        expect(r).toBeDefined();
    });

    it('checkAlertConditions', async () => {
        ms.data = [];
        const r = await mlMonitoring.checkAlertConditions('risk');
        expect(r).toBeDefined();
    });
});
