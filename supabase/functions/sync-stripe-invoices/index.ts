// Supabase Edge Function: sync-stripe-invoices
// Fetches recent invoices from Stripe and syncs them to Supabase

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

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const limit = Math.min(body.limit || 100, 100);
        const startingAfter = body.starting_after || undefined;

        // Fetch invoices from Stripe
        const stripeInvoices = await stripe.invoices.list({
            limit,
            ...(startingAfter ? { starting_after: startingAfter } : {}),
            expand: ['data.subscription'],
        });

        let synced = 0;
        let errors = 0;
        const errorMessages: string[] = [];

        for (const invoice of stripeInvoices.data) {
            try {
                // Find matching subscription in our DB
                const subscriptionId = typeof invoice.subscription === 'string'
                    ? invoice.subscription
                    : invoice.subscription?.id;

                let dbSubscriptionId: string | null = null;
                if (subscriptionId) {
                    const { data: sub } = await supabase
                        .from('subscriptions')
                        .select('id')
                        .eq('stripe_subscription_id', subscriptionId)
                        .single();
                    dbSubscriptionId = sub?.id || null;
                }

                const invoiceRow = {
                    stripe_invoice_id: invoice.id,
                    stripe_customer_id: invoice.customer as string,
                    subscription_id: dbSubscriptionId,
                    amount_due: invoice.amount_due,
                    amount_paid: invoice.amount_paid,
                    currency: invoice.currency,
                    status: invoice.status || 'draft',
                    invoice_pdf: invoice.invoice_pdf || null,
                    hosted_invoice_url: invoice.hosted_invoice_url || null,
                    invoice_number: invoice.number || null,
                    billing_reason: invoice.billing_reason || null,
                    due_date: invoice.due_date
                        ? new Date(invoice.due_date * 1000).toISOString()
                        : null,
                    paid_at: invoice.status_transitions?.paid_at
                        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
                        : null,
                };

                const { error } = await supabase
                    .from('invoices')
                    .upsert(invoiceRow, { onConflict: 'stripe_invoice_id' });

                if (error) {
                    errors++;
                    errorMessages.push(`Invoice ${invoice.id}: ${error.message}`);
                } else {
                    synced++;
                }
            } catch (innerErr: any) {
                errors++;
                errorMessages.push(`Invoice ${invoice.id}: ${innerErr.message}`);
            }
        }

        return new Response(
            JSON.stringify({
                synced,
                errors,
                has_more: stripeInvoices.has_more,
                error_messages: errorMessages.slice(0, 5),
                message: errors === 0
                    ? `Successfully synced ${synced} invoices`
                    : `Synced ${synced} invoices with ${errors} errors`,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (err: any) {
        console.error('Stripe invoice sync error:', err);
        return new Response(
            JSON.stringify({ synced: 0, errors: 1, message: err.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
