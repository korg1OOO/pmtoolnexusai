/**
 * useMarketing Hook Tests
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

import { useAnnouncements, useAnnouncement, useCreateAnnouncement, useUpdateAnnouncement, useToggleAnnouncement, useDeleteAnnouncement, useDismissAnnouncement, useFeatureFlags, useFeatureFlag, useFeatureFlagByName, useCreateFeatureFlag, useUpdateFeatureFlag, useToggleFeatureFlag, useDeleteFeatureFlag, useIsFeatureEnabled, useCampaigns, useCampaign, useCampaignAnalytics, useCreateCampaign, useUpdateCampaign, useExecuteCampaign, usePauseCampaign } from '@/hooks/useMarketing';

describe('useMarketing', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useAnnouncements).toBeDefined();
            expect(useAnnouncement).toBeDefined();
            expect(useCreateAnnouncement).toBeDefined();
            expect(useUpdateAnnouncement).toBeDefined();
            expect(useToggleAnnouncement).toBeDefined();
            expect(useDeleteAnnouncement).toBeDefined();
            expect(useDismissAnnouncement).toBeDefined();
            expect(useFeatureFlags).toBeDefined();
            expect(useFeatureFlag).toBeDefined();
            expect(useFeatureFlagByName).toBeDefined();
            expect(useCreateFeatureFlag).toBeDefined();
            expect(useUpdateFeatureFlag).toBeDefined();
            expect(useToggleFeatureFlag).toBeDefined();
            expect(useDeleteFeatureFlag).toBeDefined();
            expect(useIsFeatureEnabled).toBeDefined();
            expect(useCampaigns).toBeDefined();
            expect(useCampaign).toBeDefined();
            expect(useCampaignAnalytics).toBeDefined();
            expect(useCreateCampaign).toBeDefined();
            expect(useUpdateCampaign).toBeDefined();
            expect(useExecuteCampaign).toBeDefined();
            expect(usePauseCampaign).toBeDefined();
        });
    });

    describe('useAnnouncements', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useAnnouncements(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
