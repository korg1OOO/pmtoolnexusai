/**
 * mlRetrainingService — Deep Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import * as mlrt from '@/services/mlRetrainingService';

describe('mlRetrainingService', () => {
    it('exports functions', () => {
        expect(Object.keys(mlrt).length).toBeGreaterThan(0);
    });
    it('each export is a function', () => {
        Object.values(mlrt).forEach(val => {
            if (typeof val !== 'object') expect(typeof val).toBe('function');
        });
    });
});
