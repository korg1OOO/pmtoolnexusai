# Notification System - Email & In-App Design

## Overview
Comprehensive notification system for subscription lifecycle events, billing, and user engagement.

---

## 1. Email Notifications

### Priority 1: Critical Billing Events

#### Failed Payment
**Trigger:** `invoice.payment_failed` webhook
**Template:** `payment_failed.html`
**Content:**
- Subject: "Payment Failed - Action Required"
- Payment amount and reason for failure
- Update payment method CTA
- Grace period notice (7 days)
- Link to Customer Portal

#### Payment Success
**Trigger:** `invoice.payment_succeeded` webhook
**Template:** `payment_success.html`
**Content:**
- Subject: "Payment Received - Thank You!"
- Invoice number and amount
- Download invoice PDF
- Next billing date
- Receipt details

#### Subscription Cancelled
**Trigger:** `customer.subscription.deleted` webhook
**Template:** `subscription_cancelled.html`
**Content:**
- Subject: "Subscription Cancelled"
- Service end date
- Data export reminder
- Reactivation CTA
- Feedback request

---

### Priority 2: Engagement & Retention

#### Welcome Email
**Trigger:** New subscription created
**Template** `welcome.html`
**Content:**
- Welcome message
- Getting started guide
- Feature highlights for their tier
- Support resources
- Onboarding checklist

#### Trial Expiring Soon
**Trigger:** 3 days before trial ends
**Template:** `trial_expiring.html`
**Content:**
- Trial end date
- Upgrade prompt
- Feature comparison
- Special offer (optional)

#### Usage Limit Warning
**Trigger:** 80% of tier limit reached
**Template:** `usage_warning.html`
**Content:**
- Current usage stats
- Limit details
- Upgrade suggestion
- Usage optimization tips

#### Upgrade Confirmation
**Trigger:** Tier change
**Template:** `upgrade_success.html`
**Content:**
- New tier features
- Updated billing amount
- Proration details
- Next steps

---

### Priority 3: Retention & Win-Back

#### Dunning Email Sequence
**Day 3:** First reminder
- Subject: "We couldn't process your payment"
- Friendly tone
- Update payment link

**Day 5:** Second notice
- Subject: "Action Required: Update Payment Method"
- More urgent tone
- Grace period warning

**Day 7:** Final warning
- Subject: "Final Notice: Service Suspension Soon"
- Service interruption warning
- Customer support offer

#### Subscription Reactivated
**Trigger:** Payment recovered
**Template:** `reactivation_success.html`
**Content:**
- Welcome back message
- Service restored notice
- Updated billing info

#### Win-Back Campaign
**Trigger:** 30 days after cancellation
**Template:** `win_back.html`
**Content:**
- "We miss you" message
- What's new since they left
- Special offer
- Easy reactivation link

---

## 2. In-App Notifications

### Notification Types

#### Banner Notifications (Top of page)
- **Payment Failed** - Red banner with update CTA
- **Trial Expiring** - Yellow banner (3 days before)
- **Usage Limit** - Orange banner (80% reached)

#### Toast Notifications
- Payment successful
- Subscription upgraded
- Invoice available
- Settings saved

#### Bell Icon Notifications
Persistent notifications center:
- New invoice available
- Payment upcoming (3 days)
- Feature unlocked
- Usage milestone reached

---

### In-App Notification Schema

```typescript
interface Notification {
  id: string;
  user_id: string;
  type: 'billing' | 'usage' | 'feature' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  read: boolean;
  created_at: timestamp;
  expires_at?: timestamp;
}
```

---

## 3. Notification Preferences

User-configurable settings:
- ✅ Email for billing events (mandatory)
- ✅ Email for usage warnings
- ✅ Email for product updates
- ✅ In-app notifications
- ✅ Push notifications (future)

---

## 4. Implementation Plan

### Database Tables
```sql
-- In-app notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT,
  priority TEXT,
  title TEXT,
  message TEXT,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email queue
CREATE TABLE email_queue (
  id UUID PRIMARY KEY,
  user_id UUID,
  template TEXT,
  recipients JSONB,
  data JSONB,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY,
  billing_emails BOOLEAN DEFAULT true,
  usage_emails BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  in_app_notifications BOOLEAN DEFAULT true
);
```

### Email Service Integration
Options:
1. **SendGrid** - Good deliverability, templates
2. **Resend** - Developer-friendly, React emails
3. **Postmark** - Transactional focused
4. **AWS SES** - Cost-effective at scale

### React Email Templates
Use `react-email` for type-safe templates:
```tsx
<Email>
  <Header logo={logo} />
  <Body>
    <H1>Payment Failed</H1>
    <Text>We couldn't process your payment...</Text>
    <Button href={portalUrl}>Update Payment</Button>
  </Body>
  <Footer />
</Email>
```

---

## 5. Suggested Notifications

### Additional Email Ideas

#### Monthly Summary
- Usage stats
- Top features used
- Team activity
- Cost breakdown

#### Feature Announcements
- New features for their tier
- Upcoming releases
- Product updates

#### Billing Reminders
- Upcoming renewal (7 days)
- Annual renewal discount reminder
- Payment method expiring

#### Engagement
- Inactive user reminder (30 days)
- Onboarding incomplete
- Feature discovery emails

### In-App Notification Ideas

#### Contextual Prompts
- "You're close to your limit"
- "Upgrade to unlock this feature"
- "Invoice ready for download"

#### Achievement/Gamification
- "100 projects created!"
- "Team milestone reached"
- "Power user badge unlocked"

#### Smart Suggestions
- "Based on usage, Business tier recommended"
- "Unused features in your plan"
- "Optimize your subscription"

---

## 6. Automation Triggers

### Webhook-Based
- Stripe events → Email queue
- Usage threshold → Warning email
- Subscription change → Confirmation

### Time-Based (Cron)
- Daily: Check trial expirations
- Weekly: Usage summaries
- Monthly: Billing reminders

### User-Action Based
- First login → Welcome email
- Profile complete → Next steps
- Feature used → Tips email

---

## 7. Testing Strategy

### Email Testing
- Preview in dev mode
- Test with real emails
- Litmus/Email on Acid testing
- Spam score checking

### A/B Testing
- Subject lines
- CTA placement
- Email timing
- Content variations

---

## Implementation Priority

**Phase 1 (Critical):**
1. Payment failed email
2. Payment success email
3. In-app payment banners

**Phase 2 (Important):**
4. Welcome email
5. Trial expiring
6. Subscription cancelled
7. Notification preferences

**Phase 3 (Enhancement):**
8. Usage warnings
9. Win-back campaign
10. Monthly summaries
11. Feature announcements

Ready to implement!
