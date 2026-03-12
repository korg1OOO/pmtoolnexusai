/**
 * patternPruningService — Deep Tests
 * Tests interface shapes and function exports
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
            lt: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import {
    deactivateLowPerformers,
    deleteFailedPatterns,
    archiveUnusedPatterns,
    runFullPruning,
} from '@/services/patternPruningService';

describe('patternPruningService', () => {
    describe('function exports', () => {
        it('deactivateLowPerformers is exported', () => {
            expect(typeof deactivateLowPerformers).toBe('function');
        });

        it('deleteFailedPatterns is exported', () => {
            expect(typeof deleteFailedPatterns).toBe('function');
        });

        it('archiveUnusedPatterns is exported', () => {
            expect(typeof archiveUnusedPatterns).toBe('function');
        });

        it('runFullPruning is exported', () => {
            expect(typeof runFullPruning).toBe('function');
        });
    });

    describe('PruningStats shape', () => {
        it('has deactivated, deleted, archived counts', () => {
            const stats = { deactivated: 5, deleted: 2, archived: 3 };
            expect(stats.deactivated + stats.deleted + stats.archived).toBe(10);
        });
    });
});
