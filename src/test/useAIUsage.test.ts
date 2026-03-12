/**
 * useAIUsage Hook Tests
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

vi.mock('@/hooks/use-toast', () => ({
    ToastVariant: vi.fn(),
    toast: vi.fn(),
    useToast: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
}));

import { useAIUsageLogs, useLogAIUsage, useAIUsageSummary, useAICostByProvider, useAIUsageByUser, useProviderCosts, useUpdateProviderCost, useAIBudgets, useBudgetStatus, useCreateBudget, useUpdateBudget, useUserMonthlyCost } from '@/hooks/useAIUsage';

describe('useAIUsage', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useAIUsageLogs).toBeDefined();
            expect(useLogAIUsage).toBeDefined();
            expect(useAIUsageSummary).toBeDefined();
            expect(useAICostByProvider).toBeDefined();
            expect(useAIUsageByUser).toBeDefined();
            expect(useProviderCosts).toBeDefined();
            expect(useUpdateProviderCost).toBeDefined();
            expect(useAIBudgets).toBeDefined();
            expect(useBudgetStatus).toBeDefined();
            expect(useCreateBudget).toBeDefined();
            expect(useUpdateBudget).toBeDefined();
            expect(useUserMonthlyCost).toBeDefined();
        });
    });

    describe('useAIUsageLogs', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useAIUsageLogs(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
