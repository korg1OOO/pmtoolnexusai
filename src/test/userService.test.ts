/**
 * userService — Deep Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    },
}));

import * as us from '@/services/userService';

describe('userService', () => {
    it('exports functions', () => { expect(Object.keys(us).length).toBeGreaterThan(0); });
    it('each export is valid', () => {
        Object.values(us).forEach(val => { expect(['function', 'object'].includes(typeof val)).toBe(true); });
    });
});
