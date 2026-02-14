import Stripe from 'stripe';
import { supabase } from '@/integrations/supabase/client';

// Initialize Stripe with secret key (server-side only)
// For client-side, use @stripe/stripe-js
const getStripeInstance = () => {
    const secretKey = import.meta.env.VITE_STRIPE_SECRET_KEY;
    if (!secretKey) {
        console.warn('Stripe secret key not configured');
        return null;
    }
    return new Stripe(secretKey, {
        apiVersion: '2024-11-20.acacia',
    });
};

/**
 * Create a payment intent for credit purchase
 */
export async function createPaymentIntent(amount: number, currency: string = 'usd') {
    const stripe = getStripeInstance();
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
}

/**
 * Process a refund
 */
export async function processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) {
    const stripe = getStripeInstance();
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    try {
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined,
            reason,
        });

        // Update database record
        await supabase
            .from('invoices')
            .update({
                status: 'refunded',
                refund_amount: refund.amount / 100,
                refund_date: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId);

        return refund;
    } catch (error) {
        console.error('Error processing refund:', error);
        throw error;
    }
}

/**
 * Save payment method to customer
 */
export async function savePaymentMethod(
    customerId: string,
    paymentMethodId: string,
    setAsDefault: boolean = false
) {
    const stripe = getStripeInstance();
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    try {
        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });

        // Set as default if requested
        if (setAsDefault) {
            await stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
        }

        // Save to database
        await supabase.from('payment_methods').insert({
            customer_id: customerId,
            stripe_payment_method_id: paymentMethodId,
            is_default: setAsDefault,
        });

        return { success: true };
    } catch (error) {
        console.error('Error saving payment method:', error);
        throw error;
    }
}

/**
 * Create or get Stripe customer
 */
export async function getOrCreateStripeCustomer(userId: string, email: string) {
    const stripe = getStripeInstance();
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    // Check if customer exists in database
    const { data: existingCustomer } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

    if (existingCustomer) {
        return existingCustomer.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
        email,
        metadata: {
            user_id: userId,
        },
    });

    // Save to database
    await supabase.from('stripe_customers').insert({
        user_id: userId,
        stripe_customer_id: customer.id,
        email,
    });

    return customer.id;
}

/**
 * Retrieve payment method details
 */
export async function getPaymentMethod(paymentMethodId: string) {
    const stripe = getStripeInstance();
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    try {
        return await stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
        console.error('Error retrieving payment method:', error);
        throw error;
    }
}

/**
 * List customer payment methods
 */
export async function listCustomerPaymentMethods(customerId: string) {
    const stripe = getStripeInstance();
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    try {
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card',
        });

        return paymentMethods.data;
    } catch (error) {
        console.error('Error listing payment methods:', error);
        throw error;
    }
}

/**
 * Delete payment method
 */
export async function deletePaymentMethod(paymentMethodId: string) {
    const stripe = getStripeInstance();
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    try {
        await stripe.paymentMethods.detach(paymentMethodId);

        // Remove from database
        await supabase
            .from('payment_methods')
            .delete()
            .eq('stripe_payment_method_id', paymentMethodId);

        return { success: true };
    } catch (error) {
        console.error('Error deleting payment method:', error);
        throw error;
    }
}

/**
 * Create invoice in Stripe
 */
export async function createStripeInvoice(
    customerId: string,
    items: Array<{ description: string; amount: number; quantity: number }>
) {
    const stripe = getStripeInstance();
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    try {
        // Create invoice items
        for (const item of items) {
            await stripe.invoiceItems.create({
                customer: customerId,
                amount: Math.round(item.amount * 100),
                currency: 'usd',
                description: item.description,
                quantity: item.quantity,
            });
        }

        // Create and finalize invoice
        const invoice = await stripe.invoices.create({
            customer: customerId,
            auto_advance: true,
        });

        await stripe.invoices.finalizeInvoice(invoice.id);

        return invoice;
    } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;
    }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
): Stripe.Event {
    const stripe = getStripeInstance();
    if (!stripe) {
        throw new Error('Stripe not configured');
    }

    try {
        return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        throw error;
    }
}
