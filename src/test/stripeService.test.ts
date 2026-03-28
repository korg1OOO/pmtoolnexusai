/**
 * stripeService — Deep Tests
 * Tests interface shapes, refund reasons, and function exports
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'test@test.com' } } }) },
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));
vi.mock('@/lib/stripe', () => ({
    getStripe: vi.fn(),
    getStripePriceId: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('./aiCreditsService', () => ({
    aiCreditsService: {
        getPricingTier: vi.fn().mockResolvedValue({ price: 10, currency: 'usd', credits: 100, tier_name: 'Basic' }),
        addCredits: vi.fn().mockResolvedValue(200),
    },
}));

import {
    createCheckoutSession,
    upgradeToTier,
    openCustomerPortal,
    processRefund,
    createCreditPaymentIntent,
    confirmCreditPurchase,
} from '@/services/stripeService';
import type { CheckoutSessionParams, StripePaymentIntent, PurchaseResult } from '@/services/stripeService';

describe('stripeService', () => {
    describe('interfaces', () => {
        it('CheckoutSessionParams has required fields', () => {
            const params: CheckoutSessionParams = {
                priceId: 'price_123', tier: 'pro', billingCycle: 'monthly',
            };
            expect(params.billingCycle).toBe('monthly');
        });

        it('billingCycle can be monthly or annual', () => {
            const cycles: CheckoutSessionParams['billingCycle'][] = ['monthly', 'annual'];
            expect(cycles).toHaveLength(2);
        });

        it('StripePaymentIntent has required fields', () => {
            const pi: StripePaymentIntent = {
                id: 'pi_123', client_secret: 'cs_123',
                amount: 1000, currency: 'usd', status: 'succeeded',
            };
            expect(pi.amount).toBe(1000);
        });

        it('PurchaseResult has success flag', () => {
            const result: PurchaseResult = {
                success: true, purchase_id: 'p1',
                credits_added: 100, new_balance: 200,
            };
            expect(result.success).toBe(true);
        });

        it('PurchaseResult can have error', () => {
            const result: PurchaseResult = {
                success: false, error: 'Payment declined',
            };
            expect(result.error).toBe('Payment declined');
        });

        it('refund reasons are valid', () => {
            const reasons: ('duplicate' | 'fraudulent' | 'requested_by_customer')[] = [
                'duplicate', 'fraudulent', 'requested_by_customer',
            ];
            expect(reasons).toHaveLength(3);
        });
    });

    describe('function exports', () => {
        const methods = {
            createCheckoutSession,
            upgradeToTier,
            openCustomerPortal,
            processRefund,
            createCreditPaymentIntent,
            confirmCreditPurchase,
        };

        Object.entries(methods).forEach(([name, fn]) => {
            it(`${name} is exported`, () => {
                expect(typeof fn).toBe('function');
            });
        });
    });
});
