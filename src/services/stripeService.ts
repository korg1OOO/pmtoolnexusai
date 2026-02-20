/**
 * Stripe Service — single authoritative Stripe client file.
 *
 * Previously split across three files:
 *   - stripeService.ts           (checkout + portal)
 *   - stripePaymentService.ts    (credit purchase payment intents)
 *   - stripeIntegrationService.ts (refunds, payment methods — Stripe Node SDK)
 *
 * The Stripe Node.js SDK cannot run in the browser. All operations that
 * previously called the Stripe Node SDK directly are now routed through
 * Supabase Edge Functions, which hold the secret key server-side.
 */

import { supabase } from '@/integrations/supabase/client';
import { getStripe, getStripePriceId } from '@/lib/stripe';
import { toast } from 'sonner';
import { aiCreditsService } from './aiCreditsService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckoutSessionParams {
    priceId: string;
    tier: string;
    billingCycle: 'monthly' | 'annual';
    successUrl?: string;
    cancelUrl?: string;
}

export interface StripePaymentIntent {
    id: string;
    client_secret: string;
    amount: number;
    currency: string;
    status: string;
}

export interface PurchaseResult {
    success: boolean;
    purchase_id?: string;
    credits_added?: number;
    new_balance?: number;
    error?: string;
}

// ─── Subscription Checkout ────────────────────────────────────────────────────

/**
 * Create a Stripe checkout session and redirect.
 */
export async function createCheckoutSession({
    priceId,
    tier,
    billingCycle,
    successUrl = `${window.location.origin}/subscription/success`,
    cancelUrl = `${window.location.origin}/pricing`,
}: CheckoutSessionParams): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { toast.error('Please sign in to upgrade'); return; }

        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { priceId, tier, billingCycle, userId: user.id, userEmail: user.email, successUrl, cancelUrl },
        });
        if (error) throw error;
        if (!data?.sessionId) throw new Error('No session ID returned from server');

        const stripe = await getStripe();
        if (!stripe) throw new Error('Stripe failed to load');

        const { error: redirectError } = await (stripe as any).redirectToCheckout({ sessionId: data.sessionId });
        if (redirectError) throw redirectError;
    } catch (error: any) {
        console.error('Checkout error:', error);
        toast.error(error.message || 'Failed to start checkout');
        throw error;
    }
}

/** Shorthand: upgrade current user to a named tier. */
export async function upgradeToTier(tier: string, billingCycle: 'monthly' | 'annual' = 'monthly'): Promise<void> {
    const priceId = getStripePriceId(tier, billingCycle);
    if (!priceId) { toast.error('Invalid pricing configuration'); return; }
    await createCheckoutSession({ priceId, tier, billingCycle });
}

/** Open the Stripe customer portal for subscription management. */
export async function openCustomerPortal(): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { toast.error('Please sign in to access billing'); return; }

        const { data, error } = await supabase.functions.invoke('create-portal-session', {
            body: { userId: user.id, returnUrl: window.location.origin + '/dashboard' },
        });
        if (error) throw error;
        if (data?.url) window.location.href = data.url;
    } catch (error: any) {
        console.error('Portal error:', error);
        toast.error('Failed to open billing portal');
    }
}

// ─── Refunds (previously stripeIntegrationService — now via Edge Function) ────

/**
 * Process a refund for a payment intent.
 * Routes through the `process-refund` Edge Function — the Stripe secret key
 * never touches the browser.
 */
export async function processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer',
): Promise<{ id: string; status: string }> {
    const { data, error } = await supabase.functions.invoke('process-refund', {
        body: { paymentIntentId, amount, reason },
    });
    if (error) throw new Error(error.message || 'Refund failed');
    return data;
}

// ─── AI Credit Purchases (previously stripePaymentService) ───────────────────

/**
 * Create a Stripe payment intent for an AI credit purchase.
 * Delegates to the `create-payment-intent` Edge Function.
 */
export async function createCreditPaymentIntent(pricingTierId: string): Promise<StripePaymentIntent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const tier = await aiCreditsService.getPricingTier(pricingTierId);

    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
            amount: tier.price * 100,
            currency: tier.currency.toLowerCase(),
            metadata: { user_id: user.id, pricing_tier_id: pricingTierId, credits: tier.credits, tier_name: tier.tier_name },
        },
    });
    if (error) throw new Error(`Failed to create payment intent: ${error.message}`);
    return data;
}

/**
 * Confirm AI credit purchase after client-side Stripe payment succeeds.
 * Records the purchase and credits the tenant balance.
 */
export async function confirmCreditPurchase(
    paymentIntentId: string,
    pricingTierId: string,
): Promise<PurchaseResult> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: tenantData } = await (supabase as any)
            .from('user_tenants')
            .select('tenant_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();
        if (!tenantData) throw new Error('No tenant found for user');

        const tier = await aiCreditsService.getPricingTier(pricingTierId);

        const { data: purchase, error: purchaseError } = await (supabase as any)
            .from('ai_credit_purchases')
            .insert({
                tenant_id: tenantData.tenant_id,
                user_id: user.id,
                credits_purchased: tier.credits,
                amount_paid: tier.price,
                currency: tier.currency,
                payment_method: 'stripe',
                payment_id: paymentIntentId,
                payment_status: 'completed',
                applied_at: new Date().toISOString(),
            })
            .select()
            .single();
        if (purchaseError) throw purchaseError;

        const newBalance = await aiCreditsService.addCredits(tenantData.tenant_id, user.id, tier.credits);

        return { success: true, purchase_id: purchase.id, credits_added: tier.credits, new_balance: newBalance };
    } catch (error: any) {
        console.error('Purchase confirmation failed:', error);
        return { success: false, error: error.message };
    }
}
