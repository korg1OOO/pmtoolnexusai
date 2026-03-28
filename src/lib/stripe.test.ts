/**
 * Tests for lib/stripe (56 lines)
 * getStripePriceId, STRIPE_PRICES
 */
import { describe, it, expect, vi } from 'vitest';

// Mock @stripe/stripe-js to prevent loading actual Stripe
vi.mock('@stripe/stripe-js', () => ({
    loadStripe: vi.fn(() => Promise.resolve(null)),
}));

import { getStripePriceId, STRIPE_PRICES } from '@/lib/stripe';

describe('getStripePriceId', () => {
    it('returns pro_monthly price', () => {
        const r = getStripePriceId('pro', 'monthly');
        expect(typeof r).toBe('string');
        expect(r).toBeTruthy();
    });

    it('returns pro_annual price', () => {
        const r = getStripePriceId('pro', 'annual');
        expect(typeof r).toBe('string');
    });

    it('returns business_monthly price', () => {
        expect(getStripePriceId('business', 'monthly')).toBeTruthy();
    });

    it('returns agency_annual price', () => {
        expect(getStripePriceId('agency', 'annual')).toBeTruthy();
    });

    it('returns null for unknown tier', () => {
        expect(getStripePriceId('enterprise', 'monthly')).toBeNull();
    });

    it('returns null for invalid billing cycle type', () => {
        expect(getStripePriceId('pro', 'quarterly' as any)).toBeNull();
    });
});

describe('STRIPE_PRICES', () => {
    it('has all 6 price entries', () => {
        expect(Object.keys(STRIPE_PRICES)).toHaveLength(6);
    });

    it('all values are strings', () => {
        Object.values(STRIPE_PRICES).forEach(v => {
            expect(typeof v).toBe('string');
        });
    });
});
