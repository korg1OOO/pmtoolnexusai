-- Phase 3.1: Multi-Channel Notifications - Database Schema
-- This migration creates the foundation for the notification system

-- 1. Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Channel enablement
    email_enabled BOOLEAN DEFAULT true,
    slack_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    
    -- Event subscriptions
    approval_assigned BOOLEAN DEFAULT true,
    approval_approved BOOLEAN DEFAULT true,
    approval_rejected BOOLEAN DEFAULT true,
    approval_delegated BOOLEAN DEFAULT true,
    delegation_received BOOLEAN DEFAULT true,
    delegation_revoked BOOLEAN DEFAULT false,
    admin_override BOOLEAN DEFAULT true,
    
    -- Slack integration
    slack_webhook_url TEXT,
    slack_channel TEXT,
    slack_user_id TEXT,
    
    -- Digest settings
    digest_enabled BOOLEAN DEFAULT false,
    digest_frequency TEXT CHECK (digest_frequency IN ('daily', 'weekly')) DEFAULT 'daily',
    digest_time TIME DEFAULT '09:00:00',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- Index for user lookups
CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- 2. Notification Log Table
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification details
    event_type TEXT NOT NULL,
    event_id UUID NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'slack', 'push')),
    
    -- Content
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB,
    
    -- Delivery status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Tracking
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_notification_log_user ON notification_log(user_id);
CREATE INDEX idx_notification_log_event ON notification_log(event_type, event_id);
CREATE INDEX idx_notification_log_status ON notification_log(status);
CREATE INDEX idx_notification_log_created ON notification_log(created_at DESC);
CREATE INDEX idx_notification_log_channel ON notification_log(channel);

-- 3. Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template identification
    event_type TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'slack', 'push')),
    
    -- Content (supports template variables like {{user_name}}, {{approval_title}}, etc.)
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_template UNIQUE(event_type, channel)
);

-- Index for template lookups
CREATE INDEX idx_notification_templates_event ON notification_templates(event_type, channel);

-- 4. Insert default notification templates

-- Email: Approval Assigned
INSERT INTO notification_templates (event_type, channel, subject_template, body_template)
VALUES (
    'approval_assigned',
    'email',
    'New Approval Required: {{approval_title}}',
    'Hi {{user_name}},

You have been assigned a new approval task:

Title: {{approval_title}}
Entity: {{entity_name}}
Type: {{entity_type}}
Due Date: {{due_date}}
Requested By: {{requester_name}}

Please review and take action on this approval.

Best regards,
ProjectOye Governance System'
) ON CONFLICT (event_type, channel) DO NOTHING;

-- Email: Approval Approved
INSERT INTO notification_templates (event_type, channel, subject_template, body_template)
VALUES (
    'approval_approved',
    'email',
    'Approval Approved: {{approval_title}}',
    'Hi {{user_name}},

Your approval request has been approved:

Title: {{approval_title}}
Approved By: {{approver_name}}
Approved At: {{approved_at}}
Comments: {{comments}}

Best regards,
ProjectOye Governance System'
) ON CONFLICT (event_type, channel) DO NOTHING;

-- Email: Approval Rejected
INSERT INTO notification_templates (event_type, channel, subject_template, body_template)
VALUES (
    'approval_rejected',
    'email',
    'Approval Rejected: {{approval_title}}',
    'Hi {{user_name}},

Your approval request has been rejected:

Title: {{approval_title}}
Rejected By: {{approver_name}}
Rejected At: {{rejected_at}}
Reason: {{comments}}

Best regards,
ProjectOye Governance System'
) ON CONFLICT (event_type, channel) DO NOTHING;

-- Email: Delegation Received
INSERT INTO notification_templates (event_type, channel, subject_template, body_template)
VALUES (
    'delegation_received',
    'email',
    'Approval Delegated to You: {{approval_title}}',
    'Hi {{user_name}},

{{delegator_name}} has delegated an approval task to you:

Title: {{approval_title}}
Type: {{delegation_type}}
Reason: {{delegation_reason}}

Please review and take action on this approval.

Best regards,
ProjectOye Governance System'
) ON CONFLICT (event_type, channel) DO NOTHING;

-- Email: Admin Override
INSERT INTO notification_templates (event_type, channel, subject_template, body_template)
VALUES (
    'admin_override',
    'email',
    'Admin Override: {{approval_title}}',
    'Hi {{user_name}},

An administrator has overridden the approval workflow:

Title: {{approval_title}}
Admin: {{admin_name}}
Reason: {{override_reason}}

This approval has been automatically approved.

Best regards,
ProjectOye Governance System'
) ON CONFLICT (event_type, channel) DO NOTHING;

-- Slack: Approval Assigned
INSERT INTO notification_templates (event_type, channel, subject_template, body_template)
VALUES (
    'approval_assigned',
    'slack',
    'New Approval Required',
    '{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🔔 New Approval Required"
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Title:*\n{{approval_title}}"},
        {"type": "mrkdwn", "text": "*Entity:*\n{{entity_name}}"},
        {"type": "mrkdwn", "text": "*Due Date:*\n{{due_date}}"},
        {"type": "mrkdwn", "text": "*Requested By:*\n{{requester_name}}"}
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "View Approval"},
          "url": "{{approval_url}}"
        }
      ]
    }
  ]
}'
) ON CONFLICT (event_type, channel) DO NOTHING;

-- Push: Approval Assigned
INSERT INTO notification_templates (event_type, channel, subject_template, body_template)
VALUES (
    'approval_assigned',
    'push',
    'New Approval Required',
    '{{approval_title}} - Due: {{due_date}}'
) ON CONFLICT (event_type, channel) DO NOTHING;

-- Comments
COMMENT ON TABLE notification_preferences IS 'User notification preferences and channel configurations';
COMMENT ON TABLE notification_log IS 'Audit log of all notifications sent to users';
COMMENT ON TABLE notification_templates IS 'Templates for notification messages across different channels';
