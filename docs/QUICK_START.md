# Quick Start: Stripe & Notifications

## 🚀 Immediate Next Steps

### 1. Deploy Edge Functions to Supabase
Since Supabase CLI is not installed, deploy manually via Dashboard:

**Go to:** https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov/functions

**Deploy these 4 functions:**
1. `create-checkout-session` - From `supabase/functions/create-checkout-session/index.ts`
2. `create-portal-session` - From `supabase/functions/create-portal-session/index.ts`
3. `stripe-webhook` - From `supabase/functions/stripe-webhook/index.ts`
4. `email-processor` - From `supabase/functions/email-processor/index.ts` **(NEW)**

**Set Environment Secrets:**
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
EMAIL_PROVIDER=resend (or sendgrid/postmark)
EMAIL_API_KEY=re_xxxxx
FROM_EMAIL=noreply@kiroxys.com
```

---

### 2. Configure Stripe Dashboard

**A. Create Products & Prices**
Go to: https://dashboard.stripe.com/test/products

Create 3 products with 2 prices each (monthly + annual):
- **Pro**: $10/mo or $100/yr
- **Business**: $39/mo or $390/yr
- **Agency**: $99/mo or $990/yr

Copy each price ID (e.g., `price_1abc123`)

**B. Update Price IDs**
Edit `src/lib/stripe.ts` and replace:
```typescript
pro_monthly: 'price_YOUR_ACTUAL_ID',
pro_annual: 'price_YOUR_ACTUAL_ID',
// ... etc
```

**C. Configure Webhook**
Go to: https://dashboard.stripe.com/test/webhooks

- Click "Add endpoint"
- URL: `https://wmnfuwmjauslyqqucmov.supabase.co/functions/v1/stripe-webhook`
- Events: Select all `checkout.*`, `customer.subscription.*`, `invoice.*`
- Copy Signing Secret → Add to Supabase secrets

**D. Enable Customer Portal**
Go to: https://dashboard.stripe.com/test/settings/billing/portal
- Click "Activate"
- Enable: Update payment methods, Cancel subscriptions, View invoices

**E. Add Publishable Key to .env**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

---

### 3. Set Up Email Service (Choose one)

**Option A: Resend** (Recommended)
1. Sign up: https://resend.com
2. Get API key
3. Add to Supabase secrets: `EMAIL_API_KEY=re_xxxxx`
4. Set: `EMAIL_PROVIDER=resend`

**Option B: SendGrid**
1. Sign up: https://sendgrid.com
2. Get API key
3. Set: `EMAIL_PROVIDER=sendgrid`, `EMAIL_API_KEY=SG.xxxxx`

**Option C: Postmark**
1. Sign up: https://postmarkapp.com
2. Get server token
3. Set: `EMAIL_PROVIDER=postmark`, `EMAIL_API_KEY=xxxxx`

**Schedule Email Processor (Cron)**
In Supabase Dashboard → Edge Functions → email-processor → Add Schedule:
- Schedule: `*/5 * * * *` (every 5 minutes)

---

### 4. Test the Integration

**A. Test Checkout**
1. Run app: `npm run dev`
2. Go to `/pricing`
3. Click "Get Started" on any tier
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout

**B. Verify Database**
```sql
-- Check subscription
SELECT * FROM subscriptions 
WHERE stripe_customer_id IS NOT NULL
ORDER BY created_at DESC;

-- Check invoice sync
SELECT * FROM invoices ORDER BY created_at DESC;

-- Check notifications
SELECT * FROM notifications ORDER BY created_at DESC;
```

**C. Test Notifications**
```sql
-- Create test notification
SELECT create_notification(
  'YOUR_USER_ID',
  'billing',
  'critical',
  'Test Payment Failed',
  'This is a test notification',
  '/pricing',
  'Update Payment',
  24
);
```

Should see:
- Red banner at top of app
- Bell icon shows badge
- Toast notification

**D. Test Customer Portal**
- Go to subscription page
- Click "Manage Billing"
- Should redirect to Stripe portal

**E. Test Failed Payment (Dunning)**
- Use test card: `4000000000000341`
- Check `dunning_attempts` table
- Check `email_queue` for dunning emails

---

## ✅ What's Already Done

- ✅ Database migrations applied (12 tables + 2 views)
- ✅ React components built (7 components)
- ✅ Hooks created (3 hook files)
- ✅ Edge Functions coded (4 functions)
- ✅ NotificationBanner integrated into AppShell
- ✅ NotificationCenter in TopBar (existing)
- ✅ Build passing

---

## 📋 Complete Feature List

### Stripe Features
- Subscription checkout
- Customer portal
- Invoice management
- Usage-based billing (schema ready)
- Dunning (failed payment recovery)
- Subscription analytics (MRR, ARR, churn)
- Proration handling

### Notification Features
- In-app notifications (bell icon + banner)
- Email queue system
- 10 default email templates
- User notification preferences
- Realtime updates
- Email digest support

---

## 🔧 Troubleshooting

**Stripe webhook not working:**
- Check webhook secret matches
- Verify endpoint URL
- Check function logs in Supabase

**Emails not sending:**
- Verify email processor is scheduled
- Check EMAIL_API_KEY is set
- View email_queue table for errors

**Notifications not showing:**
- Check notifications table has data
- Verify user is logged in
- Check browser console for errors

---

## 📖 Full Documentation

- **Deployment:** `docs/MANUAL_DEPLOYMENT.md`
- **Notifications:** `docs/NOTIFICATION_SYSTEM.md`  
- **Complete Guide:** See walkthrough artifact

---

**Quick Links:**
- Supabase Dashboard: https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov
- Stripe Dashboard: https://dashboard.stripe.com/test
