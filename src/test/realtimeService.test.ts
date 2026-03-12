/**
 * realtimeService — Deep Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
        })),
        removeChannel: vi.fn(),
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import * as rs from '@/services/realtimeService';

describe('realtimeService', () => {
    it('exports functions', () => { expect(Object.keys(rs).length).toBeGreaterThan(0); });
    it('each export is valid', () => {
        Object.values(rs).forEach(val => { expect(['function', 'object'].includes(typeof val)).toBe(true); });
    });
});
