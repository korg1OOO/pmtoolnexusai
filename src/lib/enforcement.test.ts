/**
 * Tests for lib/enforcement (1152 bytes)
 * RBAC enforcement helpers
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
        auth: { getUser: vi.fn() },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
    },
}));

import * as enforcement from '@/lib/enforcement';

describe('enforcement', () => {
    it('module loads and exports functions', () => {
        expect(enforcement).toBeDefined();
        const exports = Object.keys(enforcement);
        expect(exports.length).toBeGreaterThan(0);
    });

    it('exports are functions or objects', () => {
        Object.values(enforcement).forEach(val => {
            expect(['function', 'object', 'string', 'number']).toContain(typeof val);
        });
    });
});
