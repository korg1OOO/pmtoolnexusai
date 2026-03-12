// Supabase Edge Function: sync-payment-methods
// Fetches payment methods from Stripe and syncs them to Supabase

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

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await req.json().catch(() => ({}));

        // Get all subscriptions with Stripe customer IDs
        let query = supabase
            .from('subscriptions')
            .select('id, user_id, stripe_customer_id')
            .not('stripe_customer_id', 'is', null);

        if (body.user_id) {
            query = query.eq('user_id', body.user_id);
        }

        const { data: subscriptions, error: subError } = await query;

        if (subError) throw subError;
        if (!subscriptions?.length) {
            return new Response(
                JSON.stringify({ synced: 0, errors: 0, message: 'No subscriptions with Stripe customer IDs found' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        let synced = 0;
        let errors = 0;

        for (const sub of subscriptions) {
            if (!sub.stripe_customer_id) continue;

            try {
                // Fetch payment methods for this customer
                const paymentMethods = await stripe.paymentMethods.list({
                    customer: sub.stripe_customer_id,
                    type: 'card',
                });

                // Get default payment method from customer object
                const customer = await stripe.customers.retrieve(sub.stripe_customer_id) as Stripe.Customer;
                const defaultPmId = typeof customer.invoice_settings?.default_payment_method === 'string'
                    ? customer.invoice_settings.default_payment_method
                    : customer.invoice_settings?.default_payment_method?.id;

                // Delete existing payment methods for this subscription (full resync)
                await supabase
                    .from('payment_methods')
                    .delete()
                    .eq('subscription_id', sub.id);

                // Insert current payment methods
                for (const pm of paymentMethods.data) {
                    if (pm.type !== 'card' || !pm.card) continue;

                    const { error: insertError } = await supabase
                        .from('payment_methods')
                        .insert({
                            subscription_id: sub.id,
                            stripe_payment_method_id: pm.id,
                            stripe_customer_id: sub.stripe_customer_id,
                            type: pm.type,
                            brand: pm.card.brand,
                            last4: pm.card.last4,
                            exp_month: pm.card.exp_month,
                            exp_year: pm.card.exp_year,
                            is_default: pm.id === defaultPmId,
                        });

                    if (insertError) {
                        errors++;
                    } else {
                        synced++;
                    }
                }
            } catch (innerErr: any) {
                console.error(`Error syncing payment methods for customer ${sub.stripe_customer_id}:`, innerErr);
                errors++;
            }
        }

        return new Response(
            JSON.stringify({
                synced,
                errors,
                message: `Synced ${synced} payment methods across ${subscriptions.length} subscriptions`,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (err: any) {
        console.error('Payment methods sync error:', err);
        return new Response(
            JSON.stringify({ synced: 0, errors: 1, message: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
