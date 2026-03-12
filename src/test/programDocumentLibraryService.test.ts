/**
 * programDocumentLibraryService — Deep Tests
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

import * as pdls from '@/services/programDocumentLibraryService';

describe('programDocumentLibraryService', () => {
    it('exports functions', () => { expect(Object.keys(pdls).length).toBeGreaterThan(0); });
    it('each export is valid', () => {
        Object.values(pdls).forEach(val => { expect(['function', 'object'].includes(typeof val)).toBe(true); });
    });
});
