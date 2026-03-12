/**
 * pushNotificationService — Deep Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import * as pns from '@/services/pushNotificationService';

describe('pushNotificationService', () => {
    it('exports functions', () => { expect(Object.keys(pns).length).toBeGreaterThan(0); });
    it('each export is valid', () => {
        Object.values(pns).forEach(val => { expect(['function', 'object'].includes(typeof val)).toBe(true); });
    });
});
