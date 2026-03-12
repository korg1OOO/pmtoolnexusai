/**
 * stripe Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn().mockResolvedValue(null) }));

import { getStripe, STRIPE_PRICES, getStripePriceId } from '@/lib/stripe';

describe('stripe', () => {
    it('exports getStripe', () => {
        expect(getStripe).toBeDefined();
    });
    it('exports STRIPE_PRICES', () => {
        expect(STRIPE_PRICES).toBeDefined();
    });
    it('exports getStripePriceId', () => {
        expect(getStripePriceId).toBeDefined();
    });
});
