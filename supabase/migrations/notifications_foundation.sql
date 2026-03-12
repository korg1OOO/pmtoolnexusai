-- Phase 3.1: Multi-Channel Notifications - Database Schema
-- Idempotent rewrite: adapts to pre-existing notification_templates schema

-- 1. Notification Preferences Table
-- The existing notification_preferences table has different columns (billing_emails, etc.)
-- Add the governance-specific columns if they don't exist yet.
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_enabled          BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS slack_enabled          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_enabled           BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS approval_assigned      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS approval_approved      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS approval_rejected      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS approval_delegated     BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS delegation_received    BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS delegation_revoked     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_override         BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS slack_webhook_url      TEXT,
  ADD COLUMN IF NOT EXISTS slack_channel          TEXT,
  ADD COLUMN IF NOT EXISTS slack_user_id          TEXT,
  ADD COLUMN IF NOT EXISTS digest_enabled         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS digest_time            TIME DEFAULT '09:00:00';

-- 2. Notification Log Table
CREATE TABLE IF NOT EXISTS notification_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type  TEXT NOT NULL,
    event_id    UUID NOT NULL,
    channel     TEXT NOT NULL CHECK (channel IN ('email', 'slack', 'push')),
    subject     TEXT NOT NULL,
    body        TEXT NOT NULL,
    metadata    JSONB,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at     TIMESTAMPTZ,
    failed_at   TIMESTAMPTZ,
    error_message TEXT,
    opened_at   TIMESTAMPTZ,
    clicked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user    ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_event   ON notification_log(event_type, event_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_status  ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_log_created ON notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_channel ON notification_log(channel);

-- 3. notification_templates: add event_type column if missing, then seed templates
--    The existing table uses (name, subject, body, channel).
--    We ADD event_type as an alias column and a UNIQUE constraint if not present.
ALTER TABLE notification_templates
  ADD COLUMN IF NOT EXISTS event_type       TEXT,
  ADD COLUMN IF NOT EXISTS subject_template TEXT,
  ADD COLUMN IF NOT EXISTS body_template    TEXT;

-- Back-fill event_type from name where possible
UPDATE notification_templates SET event_type = name WHERE event_type IS NULL AND name IS NOT NULL;

-- Create unique index on (event_type, channel) if not already there
CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_tmpl_event_channel
  ON notification_templates(event_type, channel)
  WHERE event_type IS NOT NULL;

-- Seed governance notification templates using the existing (name, subject, body, channel) columns
INSERT INTO notification_templates (event_type, name, channel, subject, body, active)
VALUES
  ('approval_assigned',  'approval_assigned',  'email',
   'New Approval Required: {{approval_title}}',
   'Hi {{user_name}}, you have been assigned: {{approval_title}}. Due: {{due_date}}. Requested by: {{requester_name}}.',
   true),
  ('approval_approved',  'approval_approved',  'email',
   'Approval Approved: {{approval_title}}',
   'Hi {{user_name}}, your request "{{approval_title}}" was approved by {{approver_name}} on {{approved_at}}.',
   true),
  ('approval_rejected',  'approval_rejected',  'email',
   'Approval Rejected: {{approval_title}}',
   'Hi {{user_name}}, your request "{{approval_title}}" was rejected. Reason: {{comments}}.',
   true),
  ('delegation_received','delegation_received','email',
   'Approval Delegated to You: {{approval_title}}',
   'Hi {{user_name}}, {{delegator_name}} delegated "{{approval_title}}" to you. Type: {{delegation_type}}.',
   true),
  ('admin_override',     'admin_override',     'email',
   'Admin Override: {{approval_title}}',
   'Hi {{user_name}}, an admin overrode "{{approval_title}}". Reason: {{override_reason}}.',
   true),
  ('approval_assigned',  'approval_assigned',  'push',
   'New Approval Required',
   '{{approval_title}} - Due: {{due_date}}',
   true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE notification_log       IS 'Audit log of all notifications sent to users';
COMMENT ON TABLE notification_templates IS 'Templates for notification messages across different channels';
