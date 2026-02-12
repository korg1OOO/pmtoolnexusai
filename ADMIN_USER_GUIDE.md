# Admin User Guide - Email Template Management System

> **Audience:** Platform administrators managing notification systems

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Email Template Manager](#email-template-manager)
3. [IMAP Configuration](#imap-configuration)
4. [Notification Analytics](#notification-analytics)
5. [User Preferences Management](#user-preferences-management)
6. [Best Practices](#best-practices)
7. [Common Workflows](#common-workflows)
8. [FAQ](#faq)

---

## System Overview

### What is the Email Template Management System?

This system allows you to manage all email notifications sent by the platform, including:
- **Template Management:** Edit email content, subject lines, and styling
- **IMAP Integration:** Connect email accounts for receiving replies
- **Analytics:** Track delivery, open, and click rates
- **User Preferences:** Control what notifications users receive

### Key Concepts

**Templates:** Pre-designed HTML emails with dynamic variables (e.g., `{{user_name}}`)

**Versions:** Every template edit creates a new version; you can rollback to previous versions

**Categories:** Templates are organized by purpose:
- **Billing:** Payment-related notifications
- **Engagement:** User activity and summaries
- **System:** Platform updates and alerts
- **Marketing:** Promotional content

**Channels:** Methods for delivering notifications:
- Email (primary)
- In-App notifications
- SMS (Pro feature)
- Push notifications (Pro feature)

---

## Email Template Manager

**Access:** Navigate to `/admin/email-templates`

### Overview

The Email Template Manager is your central hub for creating and editing all email notifications. Every email sent by the platform uses these templates.

### Template List

**What You See:**
- Template cards showing name, category, version, and active status
- Filter buttons to show specific categories
- Search bar to find templates quickly

**Actions Available:**
- **Preview:** See how the email looks with sample data
- **Edit:** Modify subject line and HTML content
- **History:** View all previous versions
- **Test:** Send a test email to yourself

### Editing a Template

#### Step 1: Open the Editor
1. Click **Edit** on any template
2. The editor opens with three tabs: Edit, Preview, Variables

#### Step 2: Modify Content

**Subject Line:**
- Plain text field at the top
- Use variables like `{{user_name}}` or `{{days_remaining}}`
- Keep under 60 characters for mobile visibility

**HTML Content:**
- Full HTML editor
- Supports inline CSS (required for email clients)
- Use variables for dynamic content
- Maintain responsive design for mobile

**Example Variables:**
```
{{user_name}}         - User's full name
{{company_name}}      - "ProjectOye"
{{dashboard_url}}     - Dashboard link
{{support_email}}     - Support email
{{days_remaining}}    - For trial/expiry templates
```

#### Step 3: Preview Changes
1. Click **Preview** tab
2. Sample data automatically populates variables
3. Check for:
   - Responsive layout
   - Proper variable replacement
   - Button/link functionality
   - Brand consistency

#### Step 4: Review Variables
1. Click **Variables** tab
2. See all available variables for this template
3. Verify you're using the correct variable names

#### Step 5: Save
1. Click **Save Changes**
2. Confirm in dialog
3. Version auto-increments (e.g., v1 → v2)

### Version History

**Why Versions Matter:**
- Track changes over time
- Rollback to previous versions if needed
- Audit who changed what

**How to Use:**
1. Click **History** on any template
2. View list of all versions with timestamps
3. Click **Restore** to rollback
4. Confirm - this creates a new version with old content

### Testing Templates

**Always test before going live!**

1. Click **Test** on any template
2. Enter your email address
3. Click **Send Test**
4. Check inbox (arrives in ~30 seconds)

**What to Check:**
- Subject line displays correctly
- Variables are replaced (show as `[variable_name]` in test)
- Links work
- Images load
- Mobile responsive

### Best Practices

✅ **DO:**
- Test every change before saving
- Use descriptive version commit messages
- Keep subject lines concise
- Maintain brand colors and fonts
- Include unsubscribe links

❌ **DON'T:**
- Edit templates during peak usage hours
- Delete default templates (disable instead)
- Use external image hosts (use Base64 or CDN)
- Exceed 100KB per email (affects deliverability)

---

## IMAP Configuration

**Access:** Navigate to `/admin/imap-config`

### What is IMAP?

IMAP (Internet Message Access Protocol) allows the platform to:
- Monitor inbound emails
- Process replies to notifications
- Support email-based workflows (e.g., reply-to-approve)

### Quick Setup (Recommended)

We provide presets for popular email providers:

#### Gmail Setup
1. Click **Gmail** preset card
2. Fill in:
   - Email: Your Gmail address
   - Username: Same as email
   - Password: **App Password** (not regular password)
3. Click **Test Connection**
4. If successful, click **Add Account**

**Getting Gmail App Password:**
1. Go to myaccount.google.com
2. Security → 2-Step Verification → App Passwords
3. Generate password for "Mail"
4. Copy 16-character code
5. Use this as password

#### Outlook Setup
1. Click **Outlook** preset
2. Fill in credentials
3. Enable IMAP in Outlook settings first
4. Test and add

#### Zoho Setup
1. Click **Zoho** preset
2. Fill in credentials
3. Enable IMAP in Zoho Mail settings
4. Test and add

### Custom IMAP Provider

For other providers (ProtonMail, custom domains, etc.):

1. Click any preset, then switch **Provider** to "Custom"
2. Enter IMAP details:
   - **Host:** e.g., `mail.yourcompany.com`
   - **Port:** Usually `993` for SSL
   - **Username:** Your email or username
   - **Password:** Account password
   - **SSL:** Enable if port is 993
3. Test connection
4. Add account

### Managing Accounts

**Account Status:**
- 🟢 **Active:** Connected and syncing
- 🟡 **Inactive:** Manually disabled
- 🔴 **Error:** Authentication failed

**Actions:**
- **Sync Now:** Manually trigger email check
- **Disable:** Stop syncing without deleting
- **Delete:** Remove account permanently

### Troubleshooting

**Connection Failed:**
1. Verify credentials are correct
2. Check if IMAP is enabled on the email provider
3. For Gmail/Google Workspace, use App Password
4. Check firewall isn't blocking port 993

**Sync Not Working:**
1. Check account status is "Active"
2. Click "Sync Now" to test
3. View logs for error messages
4. Re-authenticate if needed

---

## Notification Analytics

**Access:** Navigate to `/admin/notification-analytics`

### Dashboard Overview

The analytics dashboard shows real-time performance of all notifications.

### Key Metrics

**Total Sent:**
- All notifications sent across all channels
- Updates in real-time

**Delivery Rate:**
- Percentage of sent emails that were delivered
- Excludes bounces and failures
- Target: >98%

**Open Rate:**
- Percentage of delivered emails that were opened
- Industry average: 15-25%
- Target: >20%

**Click Rate:**
- Percentage of opened emails where user clicked a link
- Target: >5%

### Charts & Insights

**Delivery Trend:**
- Line chart showing sent/delivered/opened over time
- Use to identify patterns or issues

**Channel Performance:**
- Breakdown by email, in-app, SMS, push
- Compare effectiveness across channels

**Top Templates:**
- Ranking of templates by performance
- Identify which templates engage users most
- Consider A/B testing low performers

### Using Analytics

**Monitor Deliverability:**
1. Check delivery rate daily
2. If <95%, investigate:
   - Email server reputation
   - Bounce rate
   - Spam complaints

**Optimize Engagement:**
1. Review open rates by template
2. Low open rate (<15%)? Try:
   - Better subject lines
   - Adjust send times
   - Segment audience
3. Low click rate? Improve:
   - Call-to-action clarity
   - Button placement
   - Content relevance

**Date Filtering:**
- Use date range selector (Last 7/30/90 days)
- Compare periods to identify trends
- Export data for deeper analysis

---

## User Preferences Management

**Access:** Users manage at `/settings/notifications` (or similar)

### Admin Responsibilities

As admin, you control:
1. **Default Preferences:** What's enabled for new users
2. **Mandatory Notifications:** Which emails users cannot disable (e.g., security alerts)
3. **Channel Availability:** Which channels are enabled per plan tier

### Preference Categories

**Billing & Payments:**
- Payment confirmations
- Payment failures
- Card expiring
- Invoices

**Subscription:**
- Trial expiring
- Renewal reminders
- Plan changes

**Engagement:**
- Monthly summaries
- Product updates
- Tips & best practices
- Re-engagement emails

### Channel Management

**Email:** Always available

**In-App:** Available to all users
- Controls in-app notifications
- Desktop notification permissions
- Sound alerts

**SMS:** Pro and above
- Requires phone number verification
- Opt-in required by law
- Carrier fees may apply

**Push:** Pro and above
- Requires device registration
- Separate opt-in per device
- iOS and Android support

---

## Best Practices

### Email Design

**Subject Lines:**
- 40-60 characters optimal
- Front-load important words
- Use emojis sparingly (🎉 ✅ ⚠️)
- Avoid spam trigger words (FREE, $$, ACT NOW)

**Content:**
- Keep emails under 100KB
- Use web-safe fonts
- Inline CSS only (no external stylesheets)
- Include plain text version
- Always include unsubscribe link

**Variables:**
- Personalize with `{{user_name}}`
- Include context: `{{plan_name}}`, `{{expiry_date}}`
- Provide fallbacks for missing data

### Timing

**Best Send Times:**
- **Trial Expiring:** 7 days, 3 days, 1 day before
- **Renewal Reminders:** 3 days before charge
- **Monthly Summaries:** 1st of month, 9 AM user timezone
- **Re-engagement:** After 30 days inactivity

**Avoid:**
- Weekends (lower open rates)
- Early morning (<6 AM) or late night (>10 PM)
- Holidays (unless seasonal)

### Testing

**Before Going Live:**
1. Send test to multiple email clients:
   - Gmail
   - Outlook
   - Apple Mail
   - Mobile devices
2. Check spam score (use mail-tester.com)
3. Verify all links work
4. Test with different variable values
5. Check unsubscribe link works

---

## Common Workflows

### Workflow 1: Update a Template

**Scenario:** Change trial expiring email to be more urgent

1. Navigate to `/admin/email-templates`
2. Search for "trial_expiring"
3. Click **Preview** to see current version
4. Click **Edit**
5. Update subject: "⚠️ Your trial ends in {{days_remaining}} days!"
6. Modify HTML: Add urgency in copy, make CTA button larger
7. Switch to **Preview** tab
8. Review changes
9. Click **Save Changes**
10. Click **Test** and send to yourself
11. Check email in inbox
12. If good, changes are live immediately

### Workflow 2: Fix a Broken Email

**Scenario:** Users report payment confirmation emails look broken

1. Go to `/admin/notification-analytics`
2. Check open rate for "payment_success" template
3. If low, there's likely an issue
4. Go to `/admin/email-templates`
5. Find "payment_success"
6. Click **History**
7. Check when last edited
8. If recent, click **Restore** on previous version
9. Confirm rollback
10. Send test email
11. Verify it's fixed
12. Monitor analytics for improvement

### Workflow 3: Connect New Email Account

**Scenario:** Switch from Gmail to company domain for notifications

1. Go to `/admin/imap-config`
2. Click **Custom** provider
3. Enter company IMAP details:
   - Host: `imap.company.com`
   - Port: `993`
   - SSL: Enabled
4. Enter credentials
5. Click **Test Connection**
6. If successful, click **Add Account**
7. Disable old Gmail account (don't delete yet)
8. Monitor sync status for 24 hours
9. If all good, delete Gmail account

### Workflow 4: Analyze Poor Performing Template

**Scenario:** "Monthly Summary" has 5% open rate (should be 20%+)

1. Go to `/admin/notification-analytics`
2. Identify "monthly_summary" in Top Templates
3. Note metrics: sent, delivered, opened
4. Check delivery rate (should be >95%)
   - If low, email server issue
   - If high, content issue
5. Go to `/admin/email-templates`
6. Edit "monthly_summary"
7. Test improvements:
   - Better subject line (add personalization)
   - Clearer value proposition
   - Better preview text
8. Save as new version
9. Monitor analytics over next 7 days
10. Compare v2 to v1 performance

---

## FAQ

### General

**Q: Can I have multiple versions of a template active?**
A: No, only the latest version is used. Previous versions are archived for rollback.

**Q: Do template changes apply immediately?**
A: Yes, saved changes take effect instantly for new notifications.

**Q: Can users customize their notification preferences?**
A: Yes, at `/settings/notifications`. Admins set defaults and mandatory notifications.

### Email Templates

**Q: What happens if I delete a template?**
A: Notifications using that template will fail. Disable instead, or create a blank version.

**Q: Can I create new templates?**
A: Currently, templates are pre-defined. You can edit existing ones extensively.

**Q: How do I add a new variable like {{subscription_price}}?**
A: Variables are defined in backend code. Contact engineering to add new variables.

**Q: Why are my inline styles not working?**
A: Some email clients strip certain CSS. Use tables for layout, inline styles for colors/fonts.

### IMAP

**Q: Is my IMAP password stored securely?**
A: Yes, passwords are encrypted at rest using AES-256.

**Q: How often does IMAP sync?**
A: Every 5 minutes by default. You can trigger manual sync anytime.

**Q: Can I use the same IMAP account for multiple projects?**
A: Not recommended. Use separate email accounts per project for isolation.

### Analytics

**Q: Why is my open rate 0%?**
A: Either no emails sent yet, or recipients haven't opened them. Check "Total Sent" first.

**Q: Do unsubscribed users count in analytics?**
A: No, unsent emails due to unsubscribe are not counted in metrics.

**Q: Can I export analytics data?**
A: Currently view-only in dashboard. Use Supabase SQL for raw data exports.

---

## Getting Help

**Support Channels:**
- 📧 Email: admin-support@projectoye.com
- 💬 Slack: #admin-support
- 📚 Docs: docs.projectoye.com/admin

**Before Contacting Support:**
1. Check this guide
2. Review TESTING_GUIDE.md for troubleshooting
3. Check system status page
4. Gather: error messages, template names, timestamps

---

**Last Updated:** 2026-02-12
**Version:** 1.0
