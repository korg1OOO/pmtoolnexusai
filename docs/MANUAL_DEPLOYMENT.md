# Manual Edge Function Deployment Guide

Since Supabase CLI is not available, follow these steps to deploy Edge Functions via the Supabase Dashboard.

---

## Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov
2. Navigate to **Edge Functions** in the left sidebar

---

## Step 2: Deploy create-checkout-session

1. Click **"New Function"** or **"Deploy Function"**
2. Function Name: `create-checkout-session`
3. Copy and paste the code from:
   `supabase/functions/create-checkout-session/index.ts`
4. Click **"Deploy"**

---

## Step 3: Deploy create-portal-session

1. Click **"New Function"**
2. Function Name: `create-portal-session`
3. Copy and paste the code from:
   `supabase/functions/create-portal-session/index.ts`
4. Click **"Deploy"**

---

## Step 4: Deploy stripe-webhook

1. Click **"New Function"**
2. Function Name: `stripe-webhook`
3. Copy and paste the code from:
   `supabase/functions/stripe-webhook/index.ts`
4. Click **"Deploy"**

---

## Step 5: Set Environment Secrets

1. In Supabase Dashboard, go to **Project Settings → Edge Functions**
2. Add the following secrets:

```
STRIPE_SECRET_KEY=sk_test_xxxxx (get from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (get after setting up webhook)
```

**To get STRIPE_SECRET_KEY:**
- Go to: https://dashboard.stripe.com/test/apikeys
- Copy the "Secret key"

**To get STRIPE_WEBHOOK_SECRET:**
- Go to: https://dashboard.stripe.com/test/webhooks
- Create endpoint (see Step 6)
- Copy the "Signing secret"

---

## Step 6: Configure Stripe Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL:** 
   ```
   https://wmnfuwmjauslyqqucmov.supabase.co/functions/v1/stripe-webhook
   ```
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.created`
   - `invoice.finalized`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click **"Add endpoint"**
6. Copy the **Signing secret** (whsec_xxxxx)
7. Add it to Supabase secrets (Step 5)

---

## Step 7: Enable Customer Portal

1. Go to: https://dashboard.stripe.com/test/settings/billing/portal
2. Click **"Activate Customer Portal"**
3. Configure settings:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to view invoices
   - ✅ Allow customers to update billing details

4. **Return URL:** `https://your-app-url.com/dashboard`

---

## Step 8: Create Stripe Products & Prices

### Create Products
1. Go to: https://dashboard.stripe.com/test/products
2. Create 3 products:
   - **Pro** - Individual plan
   - **Business** - Team plan
   - **Agency** - Enterprise plan

### Create Prices for Each Product
For each product, create 2 prices:
- Monthly recurring
- Annual recurring (with discount)

**Example for Pro:**
- Pro Monthly: $10/month → Get price ID (price_xxxxx)
- Pro Annual: $100/year → Get price ID (price_xxxxx)

**Note the Price IDs** - you'll need them for Step 9

---

## Step 9: Update Price IDs in Code

Edit `src/lib/stripe.ts` and update the STRIPE_PRICES object with your actual price IDs:

```typescript
export const STRIPE_PRICES = {
  pro_monthly: 'price_xxxxx',     // From Stripe Dashboard
  pro_annual: 'price_xxxxx',
  business_monthly: 'price_xxxxx',
  business_annual: 'price_xxxxx',
  agency_monthly: 'price_xxxxx',
  agency_annual: 'price_xxxxx',
};
```

---

## Step 10: Add Stripe Publishable Key

1. Get publishable key from: https://dashboard.stripe.com/test/apikeys
2. Add to `.env`:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   ```

---

## Step 11: Test the Integration

### Test Checkout Flow
1. Run your app: `npm run dev`
2. Go to `/pricing`
3. Click "Get Started" on any tier
4. Sign in (or create account)
5. Use test card: `4242 4242 4242 4242`
6. Complete checkout

### Verify in Database
```sql
-- Check subscription
SELECT * FROM subscriptions 
WHERE stripe_customer_id IS NOT NULL
ORDER BY created_at DESC;

-- Check invoice sync
SELECT * FROM invoices ORDER BY created_at DESC;

-- Check webhook events
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 10;
```

### Test Customer Portal
1. Log in to your app
2. Go to subscription page
3. Click "Manage Billing"
4. Verify redirect to Stripe portal

---

## Step 12: Monitor & Debug

### View Edge Function Logs
1. Go to Edge Functions in Supabase Dashboard
2. Click on function name
3. View **Logs** tab

### View Stripe Events
1. Go to: https://dashboard.stripe.com/test/events
2. Check for successful webhook deliveries

### Test Failed Payment (Dunning)
1. Use test card: `4000 0000 0000 0341`
2. Check dunning_attempts table:
   ```sql
   SELECT * FROM dunning_attempts ORDER BY created_at DESC;
   ```

---

## Troubleshooting

**Webhook signature verification fails:**
- Verify STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
- Check endpoint URL is correct

**Function not executing:**
- Check Edge Function logs for errors
- Verify secrets are set correctly

**Invoice not syncing:**
- Check webhook events include `invoice.*`
- View stripe_events table for errors

---

## Production Deployment

When ready for production:
1. Switch to **live** keys in Stripe Dashboard
2. Update all price IDs with live prices
3. Create **live** webhook endpoint
4. Update secrets with live keys
5. Test with real card

---

**Your Project URL:** https://wmnfuwmjauslyqqucmov.supabase.co
**Stripe Dashboard:** https://dashboard.stripe.com/test
