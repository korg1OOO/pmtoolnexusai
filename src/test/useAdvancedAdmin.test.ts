/**
 * useAdvancedAdmin Hook Tests
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
            eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (r: any) => r({ data: [], error: null, count: 0 }),
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

import { validateDiscountCode, calculateDiscount, useAnalyticsMRR, useAnalyticsChurn, useAnalyticsDiscounts, useAnalyticsLicenses, useEmailPreferences, useUpdateEmailPreferences, useReferralCodes, useCreateReferralCode, useReferralConversions, useSendEmail } from '@/hooks/useAdvancedAdmin';

describe('useAdvancedAdmin', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(validateDiscountCode).toBeDefined();
            expect(calculateDiscount).toBeDefined();
            expect(useAnalyticsMRR).toBeDefined();
            expect(useAnalyticsChurn).toBeDefined();
            expect(useAnalyticsDiscounts).toBeDefined();
            expect(useAnalyticsLicenses).toBeDefined();
            expect(useEmailPreferences).toBeDefined();
            expect(useUpdateEmailPreferences).toBeDefined();
            expect(useReferralCodes).toBeDefined();
            expect(useCreateReferralCode).toBeDefined();
            expect(useReferralConversions).toBeDefined();
            expect(useSendEmail).toBeDefined();
        });
    });

    describe('validateDiscountCode', () => {
        it('is a function', () => {
            expect(typeof validateDiscountCode).toBe('function');
        });
    });

    describe('calculateDiscount', () => {
        it('is a function', () => {
            expect(typeof calculateDiscount).toBe('function');
        });
    });
});
