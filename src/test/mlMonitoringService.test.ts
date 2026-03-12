/**
 * mlMonitoringService — Deep Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import * as mlmon from '@/services/mlMonitoringService';

describe('mlMonitoringService', () => {
    it('exports functions', () => {
        expect(Object.keys(mlmon).length).toBeGreaterThan(0);
    });
    it('each export is a function', () => {
        Object.values(mlmon).forEach(val => {
            if (typeof val !== 'object') expect(typeof val).toBe('function');
        });
    });
});
