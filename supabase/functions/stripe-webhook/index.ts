/**
 * Stripe Webhook Handler
 * Processes Stripe events and updates database
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
});

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'stripe-signature, content-type',
            },
        });
    }

    try {
        const signature = req.headers.get('stripe-signature');
        if (!signature) {
            return new Response(JSON.stringify({ error: 'No signature' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const body = await req.text();
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log('Processing Stripe event:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutSessionCompleted(session);
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionChange(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentSucceeded(invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentFailed(invoice);
                break;
            }

            default:
                console.log('Unhandled event type:', event.type);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier as 'pro' | 'business' | 'agency';
    const billingCycle = session.metadata?.billingCycle as 'monthly' | 'annual';

    if (!userId || !tier || !billingCycle) {
        console.error('Missing metadata in checkout session');
        return;
    }

    // Create subscription record
    const { error } = await supabase.from('subscriptions').insert({
        user_id: userId,
        tier,
        billing_cycle: billingCycle,
        status: 'active',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        mrr: tier === 'pro' ? 10 : tier === 'business' ? 39 : 99,
    });

    if (error) {
        console.error('Failed to create subscription:', error);
    }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
    const { error } = await supabase
        .from('subscriptions')
        .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelled_at: subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000).toISOString()
                : null,
        })
        .eq('stripe_subscription_id', subscription.id);

    if (error) {
        console.error('Failed to update subscription:', error);
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const { error } = await supabase
        .from('subscriptions')
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

    if (error) {
        console.error('Failed to cancel subscription:', error);
    }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log('Payment succeeded for invoice:', invoice.id);
    // Could log this to an invoices table or send confirmation email
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const { error } = await supabase
        .from('subscriptions')
        .update({
            status: 'past_due',
        })
        .eq('stripe_subscription_id', invoice.subscription as string);

    if (error) {
        console.error('Failed to mark subscription as past_due:', error);
    }
}
