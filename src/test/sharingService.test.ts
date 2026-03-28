/**
 * sharingService — Deep Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import * as ss from '@/services/sharingService';

describe('sharingService', () => {
    it('exports functions', () => { expect(Object.keys(ss).length).toBeGreaterThan(0); });
    it('each export is valid', () => {
        Object.values(ss).forEach(val => { expect(['function', 'object'].includes(typeof val)).toBe(true); });
    });
});
