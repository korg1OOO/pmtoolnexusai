/**
 * useSubscriptionLimits Hook Tests
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

vi.mock('@/hooks/useFeatureAccess', () => ({
    SubscriptionTier: vi.fn(),
    useUserTier: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useUserFeatures: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useHasFeature: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useHasFeatures: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useFeaturesByTier: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    TIER_ORDER: vi.fn(),
    isTierHigherOrEqual: vi.fn(),
    TIER_PRICING: vi.fn(),
    TIER_LIMITS: vi.fn(),
    useTierPricing: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useTierLimits: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
}));

import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

describe('useSubscriptionLimits', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useSubscriptionLimits).toBeDefined();
        });
    });

    describe('useSubscriptionLimits', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useSubscriptionLimits(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
