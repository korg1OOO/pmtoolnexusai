/**
 * useRACIAssignments Hook Tests
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
            select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (r) => r({ data: [], error: null, count: 0 }),
        })),
        channel: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        }),
        removeChannel: vi.fn(),
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { useRACIAssignments, useUpsertRACIAssignment, useDeleteRACIAssignment, pivotRACIData } from '@/hooks/useRACIAssignments';

describe('useRACIAssignments', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useRACIAssignments).toBeDefined();
            expect(useUpsertRACIAssignment).toBeDefined();
            expect(useDeleteRACIAssignment).toBeDefined();
            expect(pivotRACIData).toBeDefined();
        });
    });

    describe('useRACIAssignments', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useRACIAssignments(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
