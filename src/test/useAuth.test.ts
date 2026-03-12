/**
 * useAuth Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
        },
    },
}));

import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
    it('exports useAuth as a function', () => {
        expect(typeof useAuth).toBe('function');
    });
});
