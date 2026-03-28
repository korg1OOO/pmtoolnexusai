/**
 * useProjects Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (r: any) => r({ data: [], error: null }),
        })),
    },
}));

import { useProjects } from '@/hooks/useProjects';

describe('useProjects', () => {
    it('returns a query result with data array', () => {
        const { result } = renderHook(() => useProjects(), { wrapper: createWrapper() });
        expect(result.current).toHaveProperty('data');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('error');
    });
});
