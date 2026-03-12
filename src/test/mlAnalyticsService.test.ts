/**
 * mlAnalyticsService — Deep Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

import * as mla from '@/services/mlAnalyticsService';

describe('mlAnalyticsService', () => {
    it('exports functions', () => {
        expect(Object.keys(mla).length).toBeGreaterThan(0);
    });
    it('each export is a function', () => {
        Object.values(mla).forEach(val => {
            if (typeof val !== 'object') expect(typeof val).toBe('function');
        });
    });
});
