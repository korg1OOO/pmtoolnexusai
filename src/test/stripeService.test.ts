/**
 * stripeService tests.
 *
 * Tests the consolidated stripeService.ts to verify:
 * 1. processRefund delegates to the Edge Function (not the Stripe Node SDK)
 * 2. Error handling is correct when Edge Function fails
 * 3. createCreditPaymentIntent validates auth before invoking
 *
 * Note: vi.mock hoisting means factory functions must not reference variables
 * declared after the mock call; we use vi.fn() inline and capture references.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks must use inline vi.fn() — hoisting prevents referencing outer vars ─
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
        },
        functions: {
            invoke: vi.fn(),
        },
    },
}));

vi.mock('@/services/aiCreditsService', () => ({
    aiCreditsService: {
        getPricingTier: vi.fn().mockResolvedValue({
            price: 10,
            currency: 'USD',
            credits: 500,
            tier_name: 'Starter',
        }),
        addCredits: vi.fn().mockResolvedValue(500),
    },
}));

vi.mock('@/lib/stripe', () => ({
    getStripe: vi.fn(),
    getStripePriceId: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

// ── Import under test AFTER mocks ──────────────────────────────────────────
import { processRefund, createCreditPaymentIntent } from '@/services/stripeService';
import { supabase } from '@/integrations/supabase/client';

// Typed helpers — supabase functions are mocked so we cast
const mockInvoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;
const mockGetUser = supabase.auth.getUser as ReturnType<typeof vi.fn>;

describe('stripeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('processRefund', () => {
        it('calls the process-refund Edge Function, not the Stripe Node SDK', async () => {
            mockInvoke.mockResolvedValue({ data: { id: 're_123', status: 'succeeded' }, error: null });

            const result = await processRefund('pi_abc', 1000, 'requested_by_customer');

            expect(mockInvoke).toHaveBeenCalledWith('process-refund', {
                body: {
                    paymentIntentId: 'pi_abc',
                    amount: 1000,
                    reason: 'requested_by_customer',
                },
            });
            expect(result).toEqual({ id: 're_123', status: 'succeeded' });
        });

        it('throws when Edge Function returns an error', async () => {
            mockInvoke.mockResolvedValue({ data: null, error: { message: 'Payment not found' } });

            await expect(processRefund('pi_bad')).rejects.toThrow('Payment not found');
        });

        it('passes undefined amount for full refund', async () => {
            mockInvoke.mockResolvedValue({ data: { id: 're_full', status: 'succeeded' }, error: null });

            await processRefund('pi_xyz');

            const body = mockInvoke.mock.calls[0][1].body;
            expect(body.amount).toBeUndefined();
        });
    });

    describe('createCreditPaymentIntent', () => {
        it('throws if user is not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            await expect(createCreditPaymentIntent('tier_1')).rejects.toThrow('User not authenticated');
            expect(mockInvoke).not.toHaveBeenCalled();
        });

        it('calls create-payment-intent Edge Function with amount in cents', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'user_1' } } });
            mockInvoke.mockResolvedValue({ data: { id: 'pi_new', client_secret: 'cs_test' }, error: null });

            const result = await createCreditPaymentIntent('tier_1');

            expect(mockInvoke).toHaveBeenCalledWith('create-payment-intent', expect.objectContaining({
                body: expect.objectContaining({
                    amount: 1000, // $10 × 100 cents
                    currency: 'usd',
                }),
            }));
            expect(result.id).toBe('pi_new');
        });
    });
});
