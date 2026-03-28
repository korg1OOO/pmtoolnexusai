/**
 * useAdminServices Hook Tests
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

import { useSubscriptions, useSubscriptionMetrics, useCreateSubscription, useUpdateSubscription, useCancelSubscription, useDiscountCodes, useDiscountCodeUsage, useCreateDiscountCode, useUpdateDiscountCode, useDeactivateDiscountCode, useLicenseKeys, useLicenseKeyActivations, useCreateLicenseKey, useBulkCreateLicenseKeys, useRevokeLicenseKey } from '@/hooks/useAdminServices';

describe('useAdminServices', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useSubscriptions).toBeDefined();
            expect(useSubscriptionMetrics).toBeDefined();
            expect(useCreateSubscription).toBeDefined();
            expect(useUpdateSubscription).toBeDefined();
            expect(useCancelSubscription).toBeDefined();
            expect(useDiscountCodes).toBeDefined();
            expect(useDiscountCodeUsage).toBeDefined();
            expect(useCreateDiscountCode).toBeDefined();
            expect(useUpdateDiscountCode).toBeDefined();
            expect(useDeactivateDiscountCode).toBeDefined();
            expect(useLicenseKeys).toBeDefined();
            expect(useLicenseKeyActivations).toBeDefined();
            expect(useCreateLicenseKey).toBeDefined();
            expect(useBulkCreateLicenseKeys).toBeDefined();
            expect(useRevokeLicenseKey).toBeDefined();
        });
    });

});
