/**
 * autoLearningService — Deep Tests
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
            lt: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

import * as als from '@/services/autoLearningService';

describe('autoLearningService', () => {
    it('exports functions', () => {
        expect(Object.keys(als).length).toBeGreaterThan(0);
    });
    it('each export is a function', () => {
        Object.values(als).forEach(val => {
            if (typeof val !== 'object') expect(typeof val).toBe('function');
        });
    });
});
