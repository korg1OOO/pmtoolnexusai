import Stripe from "npm:stripe";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2026-01-28.clover' as any,
});

// Supabase Edge Function: create-payment-intent
Deno.serve(async (req) => {
    try {
        // Parse request body
        const { amount, currency, metadata } = await req.json();

        // Validate inputs
        if (!amount || !currency) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Amount in cents
            currency: currency.toLowerCase(),
            metadata: metadata || {},
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return new Response(
            JSON.stringify({
                id: paymentIntent.id,
                client_secret: paymentIntent.client_secret,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error: any) {
        console.error('Payment intent creation failed:', error);

        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
});
