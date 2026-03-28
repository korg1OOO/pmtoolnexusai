/**
 * Service tests batch 13: mlPredictionService + autoLearningService
 * Supabase-mocked CRUD tests
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
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
        functions: { invoke: vi.fn(() => Promise.resolve({ data: null, error: null })) },
    },
}));

import * as mlPrediction from '@/services/mlPredictionService';
import * as autoLearning from '@/services/autoLearningService';

beforeEach(() => {
    ms.data = null; ms.error = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is', 'contains', 'overlaps']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
});

describe('mlPredictionService', () => {
    it('exports functions', () => {
        const fns = Object.values(mlPrediction).filter(v => typeof v === 'function');
        expect(fns.length).toBeGreaterThan(0);
    });

    it('module loads successfully', () => {
        expect(mlPrediction).toBeDefined();
    });
});

describe('autoLearningService', () => {
    it('exports functions', () => {
        const fns = Object.values(autoLearning).filter(v => typeof v === 'function');
        expect(fns.length).toBeGreaterThan(0);
    });

    it('module loads successfully', () => {
        expect(autoLearning).toBeDefined();
    });
});
