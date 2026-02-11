/**
 * Stripe Service
 * Wrapper for Stripe payment processing
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe (use your publishable key)
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
    }
    return stripePromise;
};

export interface CheckoutSessionData {
    userId: string;
    tier: 'pro' | 'business' | 'agency';
    billingCycle: 'monthly' | 'annual';
    discountCode?: string;
    successUrl?: string;
    cancelUrl?: string;
}

export interface SubscriptionData {
    userId: string;
    tier: 'pro' | 'business' | 'agency';
    billingCycle: 'monthly' | 'annual';
    stripeCustomerId: string;
    stripePriceId: string;
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(data: CheckoutSessionData): Promise<{ sessionId: string }> {
    const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to create checkout session');
    }

    return response.json();
}

/**
 * Redirect to Stripe checkout
 */
export async function redirectToCheckout(sessionId: string) {
    const stripe = await getStripe();
    if (!stripe) {
        throw new Error('Stripe not initialized');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
        throw error;
    }
}

/**
 * Create or get Stripe customer
 */
export async function createStripeCustomer(userId: string, email: string): Promise<{ customerId: string }> {
    const response = await fetch('/api/stripe/create-customer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, email }),
    });

    if (!response.ok) {
        throw new Error('Failed to create Stripe customer');
    }

    return response.json();
}

/**
 * Cancel subscription
 */
export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
        throw new Error('Failed to cancel subscription');
    }
}

/**
 * Get Stripe pricing info
 */
export function getStripePricing(tier: string, billingCycle: string) {
    const pricing: Record<string, Record<string, { amount: number; priceId: string }>> = {
        pro: {
            monthly: { amount: 10, priceId: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || '' },
            annual: { amount: 100, priceId: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL || '' },
        },
        business: {
            monthly: { amount: 39, priceId: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_MONTHLY || '' },
            annual: { amount: 390, priceId: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_ANNUAL || '' },
        },
        agency: {
            monthly: { amount: 99, priceId: import.meta.env.VITE_STRIPE_PRICE_AGENCY_MONTHLY || '' },
            annual: { amount: 990, priceId: import.meta.env.VITE_STRIPE_PRICE_AGENCY_ANNUAL || '' },
        },
    };

    return pricing[tier]?.[billingCycle] || { amount: 0, priceId: '' };
}

/**
 * Apply discount code
 */
export async function applyDiscountCode(code: string, originalAmount: number): Promise<{ finalAmount: number; discountAmount: number }> {
    const response = await fetch('/api/stripe/apply-discount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, originalAmount }),
    });

    if (!response.ok) {
        throw new Error('Invalid or expired discount code');
    }

    return response.json();
}

/**
 * Sync subscriptions from Stripe
 */
export async function syncStripeSubscriptions(): Promise<{ synced: number }> {
    const response = await fetch('/api/stripe/sync-subscriptions', {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error('Failed to sync Stripe subscriptions');
    }

    return response.json();
}
