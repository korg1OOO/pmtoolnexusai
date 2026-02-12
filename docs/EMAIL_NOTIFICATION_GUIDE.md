# Complete Email & Notification Implementation Guide

## 📧 Email System Setup

### Email Templates Created

**Critical Billing:**
1. ✅ `payment_failed.html` - Failed payment with grace period notice
2. ✅ `payment_success.html` - Payment receipt with invoice download
3. ✅ `welcome.html` - Welcome email with onboarding checklist

**Templates In Database** (from migration):
- `payment_failed`, `payment_success`, `subscription_cancelled`
- `welcome`, `trial_expiring`, `usage_warning`
- `dunning_day_3`, `dunning_day_5`, `dunning_day_7`
- `upgrade_success`

---

## 🚀 How Failed Payment Notifications Work

### Automatic Trigger (Already Built)

**When:** Stripe webhook receives `invoice.payment_failed` event

**What Happens:**
1. **Stripe webhook** (`stripe-webhook/index.ts`) processes event
2. **Creates dunning attempt** in database
3. **Triggers notification:**
   - In-app: Red banner at top + bell notification
   - Email: Queued in `email_queue` table

**Code Location:**
```typescript
// supabase/functions/stripe-webhook/index.ts
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // ... existing code creates dunning_attempts ...
  
  // Notification trigger (already implemented in notificationService.ts)
  await NotificationTriggers.paymentFailed(
    userId,
    invoice.amount_due,
    invoice.currency,
    portalUrl
  );
}
```

### Email Processing

**Email Processor** runs every 5 minutes (cron job):
1. Fetches pending emails from `email_queue`
2. Renders HTML template with user data
3. Sends via Resend/SendGrid/Postmark
4. Updates status to 'sent' or 'failed'

---

## 📋 All Notification Types Built

### Critical Billing (Auto-sent, can't unsubscribe)
| Event | Trigger | In-App | Email | Template |
|-------|---------|--------|-------|----------|
| Payment Failed | Webhook | ✅ Red Banner | ✅ | `payment_failed.html` |
 | Payment Success | Webhook | ✅ Toast | ✅ | `payment_success.html` |
| Subscription Cancelled | Webhook | ✅ | ✅ | Built-in |
| Dunning Day 3 | Cron | ✅ | ✅ | Built-in |
| Dunning Day 5 | Cron | ✅ | ✅ | Built-in |
| Dunning Day 7 | Cron | ✅ | ✅ | Built-in |

### Engagement (User can opt-out)
| Event | Trigger | In-App | Email | Template |
|-------|---------|--------|-------|----------|
| Welcome | Signup | ✅ | ✅ | `welcome.html` |
| Trial Expiring (3 days) | Cron | ✅ Banner | ✅ | Built-in |
| Usage Warning (80%) | Usage check | ✅ Banner | ✅ | Built-in |
| Renewal Reminder | 3 days before | ✅ | ✅ | Need to create |
| Payment Method Expiring | 7 days before | ✅ | ✅ | Need to create |
| Inactive User | 30 days | - | ✅ | Need to create |
| Monthly Summary | Monthly cron | - | ✅ | Need to create |

### System Events
| Event | Trigger | In-App | Email |
|-------|---------|--------|-------|
| Team Member Added | User action | ✅ | - |
| Feature Announcement | Admin trigger | ✅ | Optional |
| Milestone Achieved | System | ✅ Toast | - |
| Subscription Upgraded | Webhook | ✅ | ✅ |

---

## 🔧 Implementation Status

### ✅ Already Working
- Database tables & RLS policies
- Email queue system
- Notification preferences
- Failed payment → notification → email queue
- In-app banner for critical alerts
- Bell icon notifications

### 📝 To Activate
1. **Deploy email-processor Edge Function**
2. **Set up cron schedule** (every 5 minutes)
3. **Configure email provider** (Resend recommended)
4. **Upload HTML templates** to email provider OR use in processor

---

## 📝 Suggested Additional Emails to Build

### High Priority

**1. Renewal Reminder** (3 days before billing)
- Subject: "Your Subscription Renews Soon"
- Content: Next billing date, amount, manage subscription link
- When: 72 hours before renewal

**2. Payment Method Expiring**
- Subject: "Update Your Payment Method"
- Content: Card expiry notice, update CTA
- When: 7 days before card expires

**3. Trial Expiring** (already in DB, need HTML template)
- Subject: "Your Trial Ends in 3 Days"
- Content: Upgrade CTA, feature highlights
- HTML: Use similar style to welcome.html

**4. Upgrade Success** (already in DB, need HTML)
- Subject: "Welcome to [Tier]!"
- Content: New features unlocked, proration details
- Include feature comparison

### Medium Priority

**5. Monthly Usage Summary**
- Subject: "Your Monthly ProjectOye Summary"
- Content: Projects created, tasks completed, team activity
- Charts/stats visualization

**6. Inactive User Win-Back** (30 days)
- Subject: "We Miss You!"
- Content: What's new, special offer
- Re-engagement CTA

**7. Feature Announcement**
- Subject: "New: [Feature Name]"
- Content: Feature description, tutorial link
- Screenshot/demo

**8. Onboarding Sequence** (drip campaign)
- Day 1: Welcome (✅ done)
- Day 3: Getting started tips
- Day 7: Advanced features
- Day 14: Best practices

### Low Priority

**9. Team Digest** (weekly for admins)
- Project progress summary
- Team productivity metrics
- Action items

**10. Churn Risk Alert** (for admins)
- Low engagement detected
- Suggest intervention

---

## 🎨 Email Template Best Practices

### Already Implemented in Templates:
- ✅ Responsive design
- ✅ Inline CSS (email-safe)
- ✅ Clear CTAs with contrasting colors
- ✅ Mobile-friendly (600px width)
- ✅ Gradient headers for visual appeal
- ✅ Professional footer with links
- ✅ Proper spacing and typography

### Design Patterns Used:
- **Red gradient** for failures/warnings
- **Green gradient** for success
- **Blue/Purple gradient** for welcome/features
- **Alert boxes** with colored left borders
- **Detail tables** for invoice/billing info
- **CTA buttons** 16px padding, 8px border-radius

---

## 🔄 Cron Jobs Needed

### Email Processing
```
Schedule: */5 * * * * (every 5 minutes)
Function: email-processor
Purpose: Send queued emails
```

### Trial Expiration Check
```
Schedule: 0 9 * * * (daily at 9am)
Function: check-trial-expirations
Purpose: Send 3-day expiration warnings
```

### Payment Method Expiry Check
```
Schedule: 0 8 * * * (daily at 8am)
Function: check-card-expirations
Purpose: Send 7-day expiry warnings
```

### Monthly Summary
```
Schedule: 0 10 1 * * (1st of month at 10am)
Function: send-monthly-summaries
Purpose: Usage summaries to all users
```

### Inactive User Check
```
Schedule: 0 11 * * 0 (Sundays at 11am)
Function: check-inactive-users
Purpose: Re-engagement emails
```

---

## 📊 Notification Analytics to Track

**Email Metrics:**
- Open rate
- Click-through rate
- Bounce rate
- Unsubscribe rate

**In-App Metrics:**
- Notifications sent
- Notifications read
- Click-through on actions
- Time to action

**User Preferences:**
- Opt-out rates by type
- Preferred digest frequency
- Channel preferences

---

## 🧪 Testing Checklist

### Email Testing
- [ ] Send test failed payment email
- [ ] Verify HTML renders in Gmail, Outlook, Apple Mail
- [ ] Test mobile responsive design
- [ ] Check spam score
- [ ] Verify all links work
- [ ] Test unsubscribe flow

### In-App Testing
- [ ] Create test notification via SQL
- [ ] Verify banner appears for critical
- [ ] Check bell icon count
- [ ] Test notification preferences
- [ ] Verify realtime updates

### Integration Testing
- [ ] Failed payment → notification + email
- [ ] Successful payment → receipt email
- [ ] New signup → welcome email
- [ ] Usage threshold → warning

---

## 💡 Quick Start Implementation

### Step 1: Deploy Email Processor
```bash
# Upload to Supabase Dashboard
# supabase/functions/email-processor/index.ts
```

### Step 2: Set Secrets
```
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_xxxxx
FROM_EMAIL=noreply@projectoye.com
```

### Step 3: Schedule Cron
Go to email-processor function → Add Schedule:
```
*/5 * * * *
```

### Step 4: Test
```sql
-- Queue a test email
INSERT INTO email_queue (template, recipients, subject, data)
VALUES (
  'payment_failed',
  '[{"email": "your@email.com", "name": "Test"}]'::jsonb,
  'Test Payment Failed',
  '{"user_name": "Test User", "amount": "10.00", "currency": "USD", "portal_url": "https://app.com",  "grace_period_days": 7}'::jsonb
);

-- Email processor will pick it up within 5 minutes
```

---

## 📁 Files Reference

**HTML Templates:**
- `email-templates/payment_failed.html`
- `email-templates/payment_success.html`
- `email-templates/welcome.html`

**Services:**
- `src/services/notificationService.ts` - Base triggers
- `src/services/extendedNotificationTriggers.ts` - Extended triggers

**Edge Functions:**
- `supabase/functions/email-processor/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

**Components:**
- `src/components/notifications/NotificationBanner.tsx`
- `src/components/notifications/NotificationBell.tsx`
- `src/components/notifications/NotificationPreferences.tsx`

---

**Status:** HTML templates ready • Triggers implemented • Email processor coded • Ready to deploy!
