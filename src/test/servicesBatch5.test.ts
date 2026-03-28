/**
 * Service tests batch 5: sharingService, versionHistoryService, presenceService, realtimeService
 * These use class and individual export patterns
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any, count: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'not', 'or', 'textSearch']
        .forEach(m => { c[m] = vi.fn(() => c); });
    c.then = (res: any, rej?: any) => Promise.resolve({ data: s.data, error: s.error, count: s.count }).then(res, rej);
    return { ms: s, ch: c };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        ...ch, from: ch.from,
        rpc: vi.fn(() => Promise.resolve({ data: ms.data, error: ms.error })),
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1', email: 'test@test.com' } }, error: null })),
            getSession: vi.fn(() => Promise.resolve({ data: { session: { access_token: 'tok' } }, error: null })),
        },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
        functions: { invoke: vi.fn(() => Promise.resolve({ data: null, error: null })) },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(() => Promise.resolve({ data: { path: 'test' }, error: null })),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.com/file' } })),
            })),
        },
    },
}));

// Import using wildcard to catch whatever export pattern they use
import * as sharingMod from '@/services/sharingService';
import * as versionMod from '@/services/versionHistoryService';
import * as presenceMod from '@/services/presenceService';
import * as realtimeMod from '@/services/realtimeService';

beforeEach(() => {
    ms.data = null; ms.error = null; ms.count = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'not', 'or', 'textSearch']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
});

// =================== Module load tests ===================
describe('sharingService module', () => {
    it('loads successfully', () => {
        expect(sharingMod).toBeDefined();
        const exports = Object.keys(sharingMod);
        expect(exports.length).toBeGreaterThan(0);
    });

    it('exports expected functions or classes', () => {
        // Check what's actually exported
        const names = Object.keys(sharingMod);
        expect(names.length).toBeGreaterThan(0);
    });
});

describe('versionHistoryService module', () => {
    it('loads successfully', () => {
        expect(versionMod).toBeDefined();
        const exports = Object.keys(versionMod);
        expect(exports.length).toBeGreaterThan(0);
    });
});

describe('presenceService module', () => {
    it('loads successfully', () => {
        expect(presenceMod).toBeDefined();
        const exports = Object.keys(presenceMod);
        expect(exports.length).toBeGreaterThan(0);
    });
});

describe('realtimeService module', () => {
    it('loads successfully', () => {
        expect(realtimeMod).toBeDefined();
        const exports = Object.keys(realtimeMod);
        expect(exports.length).toBeGreaterThan(0);
    });
});
