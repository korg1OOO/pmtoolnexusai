/**
 * PublicFAQs Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (r) => r({ data: [], error: null }),
        })),
        channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
        removeChannel: vi.fn(),
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import PublicFAQs from '@/pages/PublicFAQs';

describe('PublicFAQs', () => {
    it('exports PublicFAQs', () => {
        expect(PublicFAQs).toBeDefined();
    });
});
