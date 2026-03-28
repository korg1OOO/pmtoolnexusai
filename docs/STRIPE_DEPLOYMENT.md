# Stripe Advanced Features - Deployment Guide

## Complete Deployment Checklist

### Prerequisites ✅
- [x] Supabase project set up
- [x] Stripe account created
- [x] Supabase CLI installed
- [x] Environment variables configured

---

## Deployment Steps

### 1. Database Migrations

Apply all three migrations in order:

```bash
# Apply base Stripe integration
supabase db push

# Or apply specific migrations
cd supabase/migrations

# Base Stripe tables
psql -U postgres -f 20260212200000_stripe_integration.sql

# Invoice management
psql -U postgres -f 20260212210000_invoice_management.sql

# Advanced features (usage, dunning, analytics, proration)
psql -U postgres -f 20260212220000_advanced_subscription_features.sql
```

**Verify:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'usage_records', 'dunning_attempts', 'proration_credits');

-- Check views
SELECT * FROM subscription_analytics;
SELECT * FROM tier_analytics;
```

---

### 2. Deploy Edge Functions

```bash
# Deploy all Stripe functions
./scripts/deploy-stripe-features.sh

# Or deploy individually:
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

**Set secrets:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Verify:**
```bash
# List deployed functions
supabase functions list

# Test function invocation
supabase functions invoke create-checkout-session --data '{}'
```

---

### 3. Configure Stripe Dashboard

#### A. Customer Portal
1. Go to **Settings → Billing → Customer Portal**
2. Enable portal
3. Configure settings:
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View invoices
   - ✅ Update billing details
4. Set return URL: `https://your-app.com/dashboard`

#### B. Webhook Endpoint
1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   ```
   ✅ checkout.session.completed
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.created
   ✅ invoice.finalized
   ✅ invoice.payment_succeeded
   ✅ invoice.payment_failed
   ```
5. Copy **Signing secret** (whsec_xxxxx)
6. Update Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

#### C. Smart Retries (Dunning)
1. Go to **Settings → Billing → Subscriptions and emails**
2. Enable **Smart Retries**
3. Configure retry schedule:
   - Day 3
   - Day 5
   - Day 7
4. Set dunning emails

#### D. Proration Settings
1. Go to **Settings → Billing → Subscriptions and emails**
2. Enable **Proration**
3. Choose: "Immediately charge or credit"
4. Enable **Credit notes** for downgrades

---

### 4. Update Application Configuration

#### Price IDs
Edit `src/lib/stripe.ts`:

```typescript
export const STRIPE_PRICES = {
  pro_monthly: 'price_xxxxx', // From Stripe Dashboard
  pro_annual: 'price_xxxxx',
  business_monthly: 'price_xxxxx',
  business_annual: 'price_xxxxx',
  agency_monthly: 'price_xxxxx',
  agency_annual: 'price_xxxxx',
};
```

#### Environment Variables
Update `.env.local`:

```bash
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# For production:
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

---

### 5. Test Integration

#### A. Test Checkout Flow
1. Go to `/pricing`
2. Select a tier
3. Sign in
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Verify redirect to success page

#### B. Check Database
```sql
-- Verify subscription
SELECT * FROM subscriptions 
WHERE stripe_customer_id IS NOT NULL 
ORDER BY created_at DESC LIMIT 1;

-- Check invoice sync
SELECT * FROM invoices ORDER BY created_at DESC LIMIT 5;

-- Verify payment
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;

-- Check webhook events
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 10;
```

#### C. Test Customer Portal
1. Click "Manage Billing" button
2. Verify redirect to Stripe portal
3. Test:
   - Update payment method
   - View invoices
   - Cancel subscription

#### D. Test Failed Payment (Dunning)
1. Use test card: `4000 0000 0000 0341` (payment requires authentication, but will fail)
2. Verify dunning record created:
   ```sql
   SELECT * FROM dunning_attempts ORDER BY created_at DESC;
   ```

#### E. View Analytics
1. Go to Admin Dashboard
2. Verify subscription analytics display:
   - MRR/ARR
   - Active subscriptions
   - Churn rate
   - Tier breakdown

---

### 6. Production Deployment

#### Switch to Live Mode
1. **Get live keys** from Stripe Dashboard
2. **Create live products** and prices
3. **Update environment variables**:
   ```bash
   # Production Supabase secrets
   supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx
   
   # Production .env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   ```

4. **Update price IDs** in `src/lib/stripe.ts`
5. **Configure live webhook** with production URL
6. **Test with live card**

---

## Troubleshooting

### Webhook signature verification fails
**Fix:**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check webhook endpoint URL is correct
- Ensure webhook is sent to `/functions/v1/stripe-webhook`

### Invoice not syncing  
**Fix:**
- Verify webhook events include `invoice.*` events
- Check `stripe_events` table for errors
- Review Edge Function logs:
  ```bash
  supabase functions logs stripe-webhook
  ```

### Customer Portal 404
**Fix:**
- Verify `create-portal-session` function is deployed
- Check user has `stripe_customer_id` in subscriptions table
- Verify secrets are set correctly

### Analytics showing zero
**Fix:**
- Verify migrations applied: `subscription_analytics` view exists
- Check subscriptions have `status = 'active'`
- Ensure `mrr` field is populated

---

## Monitoring

### Check Webhook Deliveries
**Stripe Dashboard → Developers → Webhooks → [Your endpoint] → Events**

- View recent events
- Check delivery status
- Retry failed events

### Query Metrics
```sql
-- Overall health
SELECT * FROM subscription_analytics;

-- Tier performance  
SELECT * FROM tier_analytics;

-- Recent failures
SELECT * FROM dunning_attempts 
WHERE status = 'pending' OR status = 'failed';

-- Payment failures last 7 days
SELECT COUNT(*) as failed_payments
FROM payments
WHERE status = 'failed'
AND created_at >= NOW() - INTERVAL '7 days';
```

### Edge Function Logs
```bash
# Real-time logs
supabase functions logs stripe-webhook --follow

# Specific time range
supabase functions logs stripe-webhook --since 1h
```

---

## Post-Deployment Checklist

- [ ] All migrations applied successfully
- [ ] Edge Functions deployed
- [ ] Stripe secrets configured
- [ ] Webhook endpoint configured
- [ ] Customer Portal enabled
- [ ] Smart Retries enabled
- [ ] Proration configured
- [ ] Price IDs updated in code
- [ ] Test checkout completed
- [ ] Invoice sync verified
- [ ] Customer Portal tested
- [ ] Dunning flow tested
- [ ] Analytics dashboard working
- [ ] Production keys ready (for live launch)

---

## Next Steps

1. **Set up email notifications** for failed payments
2. **Configure tax rates** in Stripe (if needed)
3. **Add usage tracking** for metered features
4. **Monitor churn** and optimize
5. **A/B test pricing** tiers
6. **Add revenue forecasting**

---

**For support, see:**
- [STRIPE_SETUP.md](file:///Users/mbjunaid/My%20Projects/Kiroxys/Kiroxys-UI/kiroxysui/docs/STRIPE_SETUP.md)
- [walkthrough.md](file:///Users/mbjunaid/.gemini/antigravity/brain/6de4c1fd-47e9-49b2-923f-9b3b2aa420fd/walkthrough.md)
