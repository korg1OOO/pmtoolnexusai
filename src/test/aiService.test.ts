/**
 * aiService — Deep Tests
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
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
    },
}));

import * as aiSvc from '@/services/aiService';

describe('aiService', () => {
    it('exports functions', () => {
        expect(Object.keys(aiSvc).length).toBeGreaterThan(0);
    });
    it('each export is a function or object', () => {
        Object.values(aiSvc).forEach(val => {
            expect(['function', 'object'].includes(typeof val)).toBe(true);
        });
    });
});
