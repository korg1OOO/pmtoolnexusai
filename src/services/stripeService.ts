/**
 * Stripe Checkout Service
 * Handles creating checkout sessions and redirecting to Stripe
 */

import { supabase } from '@/integrations/supabase/client';
import { getStripe, getStripePriceId } from '@/lib/stripe';
import { toast } from 'sonner';

export interface CheckoutSessionParams {
    priceId: string;
    tier: string;
    billingCycle: 'monthly' | 'annual';
    successUrl?: string;
    cancelUrl?: string;
}

/**
 * Create a Stripe checkout session and redirect
 */
export async function createCheckoutSession({
    priceId,
    tier,
    billingCycle,
    successUrl = `${window.location.origin}/subscription/success`,
    cancelUrl = `${window.location.origin}/pricing`,
}: CheckoutSessionParams): Promise<void> {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Please sign in to upgrade');
            return;
        }

        // Call Edge Function to create Stripe checkout session
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: {
                priceId,
                tier,
                billingCycle,
                userId: user.id,
                userEmail: user.email,
                successUrl,
                cancelUrl,
            },
        });

        if (error) throw error;

        if (!data?.sessionId) {
            throw new Error('No session ID returned from server');
        }

        // Redirect to Stripe checkout
        const stripe = await getStripe();
        if (!stripe) {
            throw new Error('Stripe failed to load');
        }

        const { error: redirectError } = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
        });

        if (redirectError) {
            throw redirectError;
        }
    } catch (error: any) {
        console.error('Checkout error:', error);
        toast.error(error.message || 'Failed to start checkout');
        throw error;
    }
}

/**
 * Create checkout for specific tier
 */
export async function upgradeToTier(tier: string, billingCycle: 'monthly' | 'annual' = 'monthly'): Promise<void> {
    const priceId = getStripePriceId(tier, billingCycle);

    if (!priceId) {
        toast.error('Invalid pricing configuration');
        return;
    }

    await createCheckoutSession({
        priceId,
        tier,
        billingCycle,
    });
}

/**
 * Open Stripe customer portal for managing subscription
 */
export async function openCustomerPortal(): Promise<void> {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Please sign in to access billing');
            return;
        }

        const { data, error } = await supabase.functions.invoke('create-portal-session', {
            body: {
                userId: user.id,
                returnUrl: window.location.origin + '/dashboard',
            },
        });

        if (error) throw error;

        if (data?.url) {
            window.location.href = data.url;
        }
    } catch (error: any) {
        console.error('Portal error:', error);
        toast.error('Failed to open billing portal');
    }
}
