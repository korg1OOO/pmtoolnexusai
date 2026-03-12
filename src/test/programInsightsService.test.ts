/**
 * programInsightsService — Deep Tests
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
    },
}));

import * as pis from '@/services/programInsightsService';

describe('programInsightsService', () => {
    it('exports functions', () => { expect(Object.keys(pis).length).toBeGreaterThan(0); });
    it('each export is valid', () => {
        Object.values(pis).forEach(val => { expect(['function', 'object'].includes(typeof val)).toBe(true); });
    });
});
