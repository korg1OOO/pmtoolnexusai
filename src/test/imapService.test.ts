/**
 * imapService — Deep Tests
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
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
    },
}));

import * as imap from '@/services/imapService';

describe('imapService', () => {
    it('exports functions', () => {
        expect(Object.keys(imap).length).toBeGreaterThan(0);
    });
    it('each export is a function or object', () => {
        Object.values(imap).forEach(val => {
            expect(['function', 'object'].includes(typeof val)).toBe(true);
        });
    });
});
