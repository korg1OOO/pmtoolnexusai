/**
 * knowledgeBaseService — Deep Tests
 * Tests function exports
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
            ilike: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import * as kbs from '@/services/knowledgeBaseService';

describe('knowledgeBaseService', () => {
    describe('function exports', () => {
        it('exports functions', () => {
            expect(Object.keys(kbs).length).toBeGreaterThan(0);
        });

        it('each export is a function', () => {
            Object.values(kbs).forEach(val => {
                expect(typeof val).toBe('function');
            });
        });
    });
});
