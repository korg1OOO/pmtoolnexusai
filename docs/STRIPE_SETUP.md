# Stripe Payment Integration - Setup Guide

## Prerequisites

1. **Stripe Account** - [Create account](https://dashboard.stripe.com/register)
2. **Supabase Project** - Already set up
3. **Node.js** - Already installed

---

## Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** and **Secret key**
3. Enable **Test mode** for development

---

## Step 2: Create Stripe Products & Prices

In Stripe Dashboard:

1. Go to **Products → Add Product**
2. Create products for each tier:
   - **Pro**: $10/month, $100/year
   - **Business**: $39/month, $390/year
   - **Agency**: $99/month, $990/year

3. Copy each **Price ID** (starts with `price_`)

---

## Step 3: Configure Environment Variables

Create/update `.env.local`:

```bash
# Stripe Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Supabase (already set)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Step 4: Update Price IDs

Edit `src/lib/stripe.ts`:

```typescript
export const STRIPE_PRICES = {
  pro_monthly: 'price_xxxxx', // Replace with your actual price ID
  pro_annual: 'price_xxxxx',
  business_monthly: 'price_xxxxx',
  business_annual: 'price_xxxxx',
  agency_monthly: 'price_xxxxx',
  agency_annual: 'price_xxxxx',
};
```

---

## Step 5: Apply Database Migration

```bash
# Apply the Stripe integration migration
npx tsx scripts/apply-stripe-migration.mjs
```

Or manually via Supabase:
```bash
supabase db push
```

---

## Step 6: Deploy Edge Functions

```bash
# Deploy checkout session function
supabase functions deploy create-checkout-session

# Deploy webhook handler
supabase functions deploy stripe-webhook

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Step 7: Configure Stripe Webhook

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copy the **Signing secret** (whsec_xxxxx)
6. Update it in Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

---

## Step 8: Test in Development

### Using Stripe CLI (Recommended)

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login:
   ```bash
   stripe login
   ```

3. Forward webhooks to local:
   ```bash
   stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
   ```

4. Use test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

---

## Testing Flow

1. **Go to pricing page** - `/pricing`
2. **Click "Get Started"** on any tier
3. **Sign in** (if not logged in)
4. **Complete checkout** with test card
5. **Webhook fires** - Subscription activated
6. **Redirected to success page**
7. **Check database** - Subscription status updated

---

## Verify Setup

### Check Database
```sql
-- View subscriptions
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;

-- View payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;

-- View webhook events
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 10;
```

### Check Stripe Dashboard
- **Customers** - New customer created
- **Subscriptions** - Active subscription
- **Payments** - Successful payment
- **Events** - Webhook events delivered

---

## Production Deployment

1. **Switch to live keys** in Stripe Dashboard
2. **Update environment variables** with live keys
3 **Create live products/prices**
4. **Update price IDs** in code
5. **Configure live webhook** endpoint
6. **Test thoroughly** before launch

---

## Common Issues

### Webhook signature verification fails
- ✅ Check `STRIPE_WEBHOOK_SECRET` is correct
- ✅ Ensure webhook is sent to correct endpoint

### Checkout session creation fails
- ✅ Verify `STRIPE_SECRET_KEY` is set
- ✅ Check price IDs are correct
- ✅ Ensure user is authenticated

### Subscription not activating
- ✅ Check webhook is configured
- ✅ Verify metadata includes `user_id`
- ✅ Check database for errors

---

## Next Steps

- [ ] Set up Stripe Customer Portal
- [ ] Add invoice management
- [ ] Implement usage-based billing
- [ ] Set up dunning for failed payments
- [ ] Add subscription analytics

---

## Resources

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
