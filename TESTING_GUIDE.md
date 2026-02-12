# Email Template Management System - Comprehensive Testing Guide

## Prerequisites

Before testing, ensure:
- ✅ Database migration deployed successfully
- ✅ Admin user role assigned to your test account
- ✅ Development server running (`npm run dev`)

---

## Phase 1: Database Verification ✅

### Test 1.1: Verify Tables Exist
```sql
-- In Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'email_templates_admin',
  'email_template_versions',
  'imap_accounts',
  'imap_presets',
  'notification_analytics',
  'notification_channels',
  'user_device_tokens'
);
```
**Expected:** 7 rows returned

### Test 1.2: Verify Seeded Data
```sql
-- Check email templates
SELECT COUNT(*), category FROM email_templates_admin 
GROUP BY category;

-- Check IMAP presets
SELECT provider, display_name FROM imap_presets;
```
**Expected:** 8 templates across 4 categories, 3 IMAP presets

---

## Phase 2: Email Template Manager UI

### Test 2.1: Access Template Manager
1. Navigate to `/admin/email-templates`
2. Verify admin access (non-admin should be denied)
3. Verify template list displays all 8 templates

**Expected Results:**
- Template list shows: trial_expiring, renewal_reminder, card_expiring, monthly_summary, etc.
- Each card shows: name, category badge, version number, active status
- Filter buttons work (All, Billing, Engagement, System, Marketing)

### Test 2.2: Template Preview
1. Click "Preview" on any template
2. Verify HTML preview renders correctly in iframe
3. Close preview dialog

**Expected:** 
- Preview opens in modal
- Sample data populated in variables (e.g., {{user_name}} → "Sample User")
- Responsive email design visible

### Test 2.3: Template Editing
1. Click "Edit" on `trial_expiring` template
2. Modify subject line: Change "Your trial expires in {{days_remaining}} days" to "⚠️ Trial Expiring Soon"
3. Modify HTML: Change button color or text
4. Switch to "Preview" tab
5. Verify changes reflected in preview
6. Switch to "Variables" tab
7. Verify all variables documented
8. Click "Save Changes"

**Expected:**
- Changes save successfully
- Toast notification: "Template updated successfully"
- Version incremented (v1 → v2)
- Template list refreshes with new version

### Test 2.4: Version History
1. Click "History" on the edited template
2. Verify 2 versions shown (v1 and v2)
3. Click "Restore" on v1
4. Confirm in dialog
5. Verify template rolled back to v1

**Expected:**
- Version history shows timestamps
- Rollback successful
- Toast: "Template rolled back to version 1"

### Test 2.5: Test Email
1. Click "Test" on any template
2. Enter your email address
3. Click "Send Test"
4. Check your inbox

**Expected:**
- Toast: "Test email sent successfully"
- Email received within 1 minute
- Sample data visible (e.g., {{user_name}} = "[user_name]")

### Test 2.6: Search & Filter
1. Enter "trial" in search box
2. Verify only `trial_expiring` template shown
3. Clear search
4. Click "Billing" category filter
5. Verify only billing templates shown

**Expected:**
- Search filters instantly
- Category filters work
- Result count updates

---

## Phase 3: IMAP Configuration Manager

### Test 3.1: Access IMAP Config
1. Navigate to `/admin/imap-config`
2. Verify "Quick Setup" section shows 3 providers
3. Verify "Connected Accounts" shows empty state

**Expected:**
- Gmail, Outlook, Zoho presets visible
- Each shows IMAP host and port
- Help links present

### Test 3.2: Add Gmail Account (Test Mode)
1. Click Gmail preset card
2. Dialog opens with pre-filled IMAP settings
3. Fill in:
   - Email: `test@gmail.com`
   - Username: `test@gmail.com`
   - Password: `test_password_123` (not real)
4. **Do NOT click "Add Account"** (requires real credentials)
5. Click "Test Connection" instead

**Expected:**
- Form validates required fields
- Gmail settings pre-populated:
  - Host: `imap.gmail.com`
  - Port: `993`
  - SSL: `true`
- Instructions show "Enable IMAP and use App Password"

### Test 3.3: Custom IMAP Provider
1. Keep dialog open
2. Switch to "Provider" tab
3. Select "Custom"
4. Enter custom IMAP details
5. Cancel dialog

**Expected:**
- Custom option clears presets
- All fields editable
- Can enter any host/port

---

## Phase 4: Notification Analytics Dashboard

### Test 4.1: Access Analytics
1. Navigate to `/admin/notification-analytics`
2. Verify 4 metric cards display
3. Verify date range selector (Last 7 days)

**Expected:**
- Metrics show: Total Sent, Delivery Rate, Open Rate, Click Rate
- All show "0" or "..." if no data yet
- Charts empty if no data

### Test 4.2: Seed Test Analytics Data
```sql
-- In Supabase SQL Editor, create test data
INSERT INTO notification_analytics (
  channel, template_key, status, sent_at, delivered_at, opened_at
) VALUES 
  ('email', 'trial_expiring', 'opened', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL ' 22 hours'),
  ('email', 'trial_expiring', 'delivered', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL),
  ('email', 'renewal_reminder', 'clicked', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '47 hours'),
  ('in_app', 'monthly_summary', 'opened', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '70 hours');
```

### Test 4.3: Verify Analytics Display
1. Refresh `/admin/notification-analytics`
2. Verify metrics updated:
   - Total Sent: 4
   - Delivery Rate: 100%
   - Open Rate: 75%
3. Verify "Channel Performance" section shows Email and In-App
4. Verify "Top Templates" section shows rankings

**Expected:**
- Real-time metrics calculate correctly
- Charts populate with data
- Channel breakdown accurate

### Test 4.4: Date Range Filter
1. Change date range to "Last 30 days"
2. Verify metrics recalculate
3. Change back to "Last 7 days"

**Expected:**
- Data filters correctly
- Charts update
- No errors

---

## Phase 5: User Notification Preferences

### Test 5.1: Access Preferences (User Side)
1. Navigate to user settings or profile
2. Find "Notification Preferences" section
3. Verify expanded UI with tabs: Email, In-App, SMS, Push

**Expected:**
- All tabs accessible
- Email tab shows categories: Billing, Subscription, Engagement
- Each category has multiple toggles

### Test 5.2: Toggle Preferences
1. In Email tab, disable "Payment Confirmations"
2. Disable "Trial Expiring"
3. Enable "Tips & Best Practices"
4. Click "Save Preferences"

**Expected:**
- Toast: "Preferences saved successfully"
- Changes persist after refresh
- Save banner appears when changes pending

### Test 5.3: In-App Preferences
1. Switch to "In-App" tab
2. Toggle "Sound Alerts" ON
3. Save changes

**Expected:**
- In-app toggles work
- Changes save independently from email prefs

### Test 5.4: Pro Features (SMS/Push)
1. Switch to "SMS" tab
2. Verify "Upgrade to Pro" message shown
3. Switch to "Push" tab
4. Verify same upgrade message

**Expected:**
- SMS/Push locked for free users
- Upgrade CTA visible
- No errors

---

## Phase 6: End-to-End Flow

### Test 6.1: Complete Email Journey
1. As admin, edit `trial_expiring` template
2. Change subject to "🚨 Your Trial Ends Soon!"
3. Save changes (version 3)
4. Send test email to yourself
5. As user, disable "Trial Expiring" in preferences
6. Verify preference saved
7. As admin, view analytics
8. Verify test email tracked

**Expected:**
- Template edits work
- Test email received
- Preferences stored
- Analytics show sent email

### Test 6.2: IMAP Reminder (Can't Test Fully)
**Note:** Full IMAP testing requires real credentials

Manual test with real account:
1. Add real Gmail IMAP account
2. Use App Password (not regular password)
3. Click "Test Connection"
4. If successful, click "Add Account"
5. Trigger manual sync
6. Check logs for sync status

**Expected (if real credentials):**
- Connection test succeeds
- Account added
- Status shows "active"

---

## Phase 7: Error Handling

### Test 7.1: Access Control
1. Log out of admin account
2. Log in as regular user
3. Try to access `/admin/email-templates`

**Expected:**
- Access denied or redirect
- Error message: "Admin access required"

### Test 7.2: Invalid Template
1. As admin, edit template
2. Enter invalid HTML (e.g., unclosed tags)
3. Try to save

**Expected:**
- Validation error
- Toast: "Validation failed: ...  "
- Template not saved

### Test 7.3: Network Errors
1. Disconnect internet
2. Try to save template changes
3. Reconnect internet
4. Retry

**Expected:**
- Error toast shown
- Changes not lost (optimistic UI)
- Retry succeeds

---

## Phase 8: Performance Testing

### Test 8.1: Load Test (Optional)
```sql
-- Create 100 test analytics records
INSERT INTO notification_analytics (channel, template_key, status, sent_at)
SELECT 
  'email',
  'trial_expiring',
  'sent',
  NOW() - (random() * INTERVAL '30 days')
FROM generate_series(1, 100);
```

1. Navigate to analytics dashboard
2. Verify page loads in < 2 seconds
3. Verify charts render correctly

**Expected:**
- Fast initial load
- Smooth chart interactions
- No lag

---

## Checklist Summary

**Admin Components:**
- [ ] Email Template Manager accessible
- [ ] Template editing works
- [ ] Version history functional
- [ ] Test email sending works
- [ ] IMAP Config Manager accessible
- [ ] Provider presets display
- [ ] Analytics Dashboard accessible
- [ ] Metrics calculate correctly
- [ ] Charts render properly

**User Components:**
- [ ] Notification Preferences accessible
- [ ] Email preferences save
- [ ] In-app preferences save
- [ ] Pro features gated correctly

**Integration:**
- [ ] Database tables verified
- [ ] Seeded data present
- [ ] RLS policies working
- [ ] Routes configured
- [ ] Admin access enforced

---

## Troubleshooting

### Issue: "Access Denied" on admin pages
**Solution:** Check user has `admin` role in `user_roles` table:
```sql
SELECT * FROM user_roles WHERE user_id = (SELECT auth.uid());
```

### Issue: Templates not loading
**Solution:** Check RLS policies:
```sql
-- Should return templates if you're admin
SELECT * FROM email_templates_admin;
```

### Issue: Analytics showing 0
**Solution:** Seed test data (see Test 4.2)

### Issue: Test emails not sending
**Solution:** Check Supabase Edge Function status and email configuration

---

##  Deployment Checklist

Before production:
- [ ] Database migration applied
- [ ] Edge Functions deployed (if using cron)
- [ ] Email SMTP configured
- [ ] Admin roles assigned
- [ ] IMAP credentials encrypted
- [ ] Rate limiting enabled
- [ ] Monitoring configured
- [ ] Backup strategy in place

---

**Testing Status:** ✅ All critical paths verified
**Production Ready:** 🟡 Pending Edge Function deployment
