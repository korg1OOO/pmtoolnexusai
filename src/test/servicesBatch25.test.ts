/**
 * Service tests batch 25: notificationService + slackService + meetingAnalyticsService
 * Module load + export validation
 */
import { describe, it, expect, vi } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is', 'contains', 'overlaps', 'textSearch']
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

describe('notificationService', () => {
    it('imports successfully', async () => {
        const m = await import('@/services/notificationService');
        expect(m).toBeDefined();
    });
    it('exports functions', async () => {
        const m = await import('@/services/notificationService');
        const fns = Object.values(m).filter(v => typeof v === 'function');
        expect(fns.length).toBeGreaterThan(0);
    });
});

describe('slackService', () => {
    it('imports successfully', async () => {
        const m = await import('@/services/slackService');
        expect(m).toBeDefined();
    });
    it('exports functions', async () => {
        const m = await import('@/services/slackService');
        const fns = Object.values(m).filter(v => typeof v === 'function');
        expect(fns.length).toBeGreaterThan(0);
    });
});

describe('meetingAnalyticsService', () => {
    it('imports successfully', async () => {
        const m = await import('@/services/meetingAnalyticsService');
        expect(m).toBeDefined();
    });
    it('exports functions', async () => {
        const m = await import('@/services/meetingAnalyticsService');
        const fns = Object.values(m).filter(v => typeof v === 'function');
        expect(fns.length).toBeGreaterThan(0);
    });
});
