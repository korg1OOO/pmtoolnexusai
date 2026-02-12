// Supabase Edge Function: stripe-webhook
// Handles Stripe webhook events for subscription lifecycle

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
        return new Response('Missing signature or secret', { status: 400 });
    }

    try {
        const body = await req.text();
        const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

        // Check for duplicate events
        const { data: existing } = await supabase
            .from('stripe_events')
            .select('id')
            .eq('stripe_event_id', event.id)
            .single();

        if (existing) {
            console.log('Duplicate event, skipping:', event.id);
            return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        // Log event
        await supabase.from('stripe_events').insert({
            stripe_event_id: event.id,
            event_type: event.type,
            payload: event,
            processed: false,
        });

        // Handle events
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.finalized':
                await handleInvoiceFinalized(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.created':
                await handleInvoiceCreated(event.data.object as Stripe.Invoice);
                break;

            default:
                console.log('Unhandled event type:', event.type);
        }

        // Mark as processed
        await supabase
            .from('stripe_events')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq('stripe_event_id', event.id);

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.user_id;
    const tier = session.metadata?.tier;
    const billingCycle = session.metadata?.billing_cycle;

    if (!userId || !tier) {
        console.error('Missing metadata in checkout session');
        return;
    }

    // Update subscription
    const { error } = await supabase
        .from('subscriptions')
        .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            tier,
            billing_cycle: billingCycle,
            status: 'active',
            trial_ends_at: null,
        })
        .eq('user_id', userId);

    if (error) console.error('Error updating subscription:', error);

    // Update profile tier
    await supabase
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('id', userId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.user_id;

    if (!userId) return;

    const { error } = await supabase
        .from('subscriptions')
        .update({
            status: subscription.status,
            stripe_subscription_id: subscription.id,
        })
        .eq('user_id', userId);

    if (error) console.error('Error updating subscription:', error);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.user_id;

    if (!userId) return;

    const { error } = await supabase
        .from('subscriptions')
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

    if (error) console.error('Error cancelling subscription:', error);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;

    // Find subscription
    const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

    if (!sub) return;

    // Sync invoice to database
    await supabase.from('invoices').upsert({
        subscription_id: sub.id,
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer as string,
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status || 'paid',
        invoice_pdf: invoice.invoice_pdf || null,
        hosted_invoice_url: invoice.hosted_invoice_url || null,
        invoice_number: invoice.number || null,
        billing_reason: invoice.billing_reason || null,
        due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
        paid_at: invoice.status_transitions.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            : null,
    }, { onConflict: 'stripe_invoice_id' });

    // Sync line items
    if (invoice.lines?.data) {
        for (const line of invoice.lines.data) {
            await supabase.from('invoice_line_items').insert({
                invoice_id: sub.id,
                description: line.description || null,
                amount: line.amount,
                quantity: line.quantity || 1,
                unit_amount: line.unit_amount || null,
                period_start: line.period?.start
                    ? new Date(line.period.start * 1000).toISOString()
                    : null,
                period_end: line.period?.end
                    ? new Date(line.period.end * 1000).toISOString()
                    : null,
            });
        }
    }

    // Record payment
    await supabase.from('payments').insert({
        subscription_id: sub.id,
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
    });

    // If this was a recovery from dunning, mark it
    await supabase
        .from('dunning_attempts')
        .update({
            status: 'recovered',
            notes: 'Payment recovered successfully',
        })
        .eq('stripe_invoice_id', invoice.id)
        .eq('status', 'pending');
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;

    // Find subscription
    const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

    if (!sub) return;

    // Record failed payment
    await supabase.from('payments').insert({
        subscription_id: sub.id,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
    });

    // Update subscription status
    await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('id', sub.id);

    // Create dunning attempt
    const gracePeriodDays = 7;
    const gracePeriodEnds = new Date();
    gracePeriodEnds.setDate(gracePeriodEnds.getDate() + gracePeriodDays);

    await supabase.from('dunning_attempts').insert({
        subscription_id: sub.id,
        stripe_invoice_id: invoice.id,
        attempt_number: invoice.attempt_count || 1,
        status: 'pending',
        grace_period_ends: gracePeriodEnds.toISOString(),
        notes: `Payment failed. Grace period: ${gracePeriodDays} days`,
    });
}

async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;

    const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

    if (!sub) return;

    // Sync invoice
    await supabase.from('invoices').upsert({
        subscription_id: sub.id,
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer as string,
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status || 'open',
        invoice_pdf: invoice.invoice_pdf || null,
        hosted_invoice_url: invoice.hosted_invoice_url || null,
        invoice_number: invoice.number || null,
        billing_reason: invoice.billing_reason || null,
        due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    }, { onConflict: 'stripe_invoice_id' });
}

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;

    const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

    if (!sub) return;

    // Sync invoice
    await supabase.from('invoices').upsert({
        subscription_id: sub.id,
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer as string,
        amount_due: invoice.amount_due,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status || 'draft',
        invoice_pdf: invoice.invoice_pdf || null,
        hosted_invoice_url: invoice.hosted_invoice_url || null,
        invoice_number: invoice.number || null,
        billing_reason: invoice.billing_reason || null,
        due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    }, { onConflict: 'stripe_invoice_id' });
}

