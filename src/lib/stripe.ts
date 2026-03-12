/**
 * Stripe Client Configuration
 * Initializes Stripe.js for client-side checkout
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn('⚠️ Stripe publishable key not found. Payment features will be disabled.');
}

// Single instance of Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
    if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
        stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
};

/**
 * Stripe Price IDs
 * These should match your Stripe Dashboard product prices
 * 
 * TO UPDATE:
 * 1. Go to: https://dashboard.stripe.com/test/products
 * 2. Create products: Pro, Business, Agency
 * 3. Add monthly & annual prices to each
 * 4. Copy price IDs (price_xxxxx) and paste below
 */
export const STRIPE_PRICES = {
    // Pro Tier - $10/month or $100/year
    pro_monthly: 'price_REPLACE_WITH_YOUR_PRICE_ID',
    pro_annual: 'price_REPLACE_WITH_YOUR_PRICE_ID',

    // Business Tier - $39/month or $390/year
    business_monthly: 'price_REPLACE_WITH_YOUR_PRICE_ID',
    business_annual: 'price_REPLACE_WITH_YOUR_PRICE_ID',

    // Agency Tier - $99/month or $990/year
    agency_monthly: 'price_REPLACE_WITH_YOUR_PRICE_ID',
    agency_annual: 'price_REPLACE_WITH_YOUR_PRICE_ID',
} as const;

/**
 * Get Stripe price ID for a tier and billing cycle
 */
export function getStripePriceId(tier: string, billingCycle: 'monthly' | 'annual'): string | null {
    const key = `${tier}_${billingCycle}` as keyof typeof STRIPE_PRICES;
    return STRIPE_PRICES[key] || null;
}
