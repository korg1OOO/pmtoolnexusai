-- Notification System Tables
-- Email notifications, in-app notifications, and user preferences

-- In-app notifications
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('billing', 'usage', 'feature', 'system', 'engagement')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_label TEXT,
    read BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Email queue for async sending
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    template TEXT NOT NULL,
    recipients JSONB NOT NULL, -- [{email, name}]
    subject TEXT NOT NULL,
    data JSONB NOT NULL, -- Template variables
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';

-- Notification preferences
DROP TABLE IF EXISTS notification_preferences CASCADE;
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Email preferences
    billing_emails BOOLEAN DEFAULT true,
    usage_emails BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    product_updates BOOLEAN DEFAULT true,
    
    -- In-app preferences
    in_app_notifications BOOLEAN DEFAULT true,
    desktop_notifications BOOLEAN DEFAULT false,
    
    -- Notification frequency
    digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('realtime', 'daily', 'weekly', 'monthly')),
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates metadata
DROP TABLE IF EXISTS email_templates CASCADE;
CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- billing, engagement, system
    subject_template TEXT NOT NULL,
    html_template TEXT,
    text_template TEXT,
    required_variables JSONB, -- ["user_name", "amount", "invoice_url"]
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO email_templates (id, name, description, category, subject_template, required_variables) VALUES
('payment_failed', 'Payment Failed', 'Sent when payment fails', 'billing', 'Payment Failed - Action Required', '["user_name", "amount", "portal_url", "grace_period_days"]'),
('payment_success', 'Payment Successful', 'Sent on successful payment', 'billing', 'Payment Received - Thank You!', '["user_name", "amount", "invoice_url", "invoice_number"]'),
('subscription_cancelled', 'Subscription Cancelled', 'Sent when subscription is cancelled', 'billing', 'Subscription Cancelled', '["user_name", "tier", "end_date", "reactivation_url"]'),
('welcome', 'Welcome Email', 'Sent to new users', 'engagement', 'Welcome to ProjectOye!', '["user_name", "tier", "trial_end_date"]'),
('trial_expiring', 'Trial Expiring', 'Sent 3 days before trial ends', 'engagement', 'Your Trial Ends Soon', '["user_name", "trial_end_date", "upgrade_url"]'),
('usage_warning', 'Usage Limit Warning', 'Sent at 80% usage', 'system', 'Usage Limit Warning', '["user_name", "usage_percent", "limit", "upgrade_url"]'),
('dunning_day_3', 'Dunning - Day 3', 'First payment retry reminder', 'billing', 'We couldn''t process your payment', '["user_name", "amount", "portal_url"]'),
('dunning_day_5', 'Dunning - Day 5', 'Second payment retry notice', 'billing', 'Action Required: Update Payment Method', '["user_name", "amount", "portal_url", "days_remaining"]'),
('dunning_day_7', 'Dunning - Final', 'Final warning before suspension', 'billing', 'Final Notice: Service Suspension Soon', '["user_name", "amount", "portal_url"]'),
('upgrade_success', 'Upgrade Confirmation', 'Sent when tier is upgraded', 'billing', 'Welcome to {{tier}}!', '["user_name", "old_tier", "new_tier", "new_price", "proration_amount"]')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can only see their own
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Email queue: Admin only
CREATE POLICY email_queue_admin_all ON email_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Notification preferences: Users manage their own
CREATE POLICY notification_preferences_own ON notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Email templates: Read-only for all, admin can modify
CREATE POLICY email_templates_select_all ON email_templates
    FOR SELECT USING (true);

CREATE POLICY email_templates_admin_modify ON email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_priority TEXT,
    p_title TEXT,
    p_message TEXT,
    p_action_url TEXT DEFAULT NULL,
    p_action_label TEXT DEFAULT NULL,
    p_expires_hours INT DEFAULT 168 -- 7 days default
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id, type, priority, title, message,
        action_url, action_label, expires_at
    ) VALUES (
        p_user_id, p_type, p_priority, p_title, p_message,
        p_action_url, p_action_label,
        NOW() + (p_expires_hours || ' hours')::INTERVAL
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Function to queue email
CREATE OR REPLACE FUNCTION queue_email(
    p_user_id UUID,
    p_template TEXT,
    p_recipients JSONB,
    p_subject TEXT,
    p_data JSONB,
    p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_email_id UUID;
    v_preferences RECORD;
BEGIN
    -- Check user preferences
    SELECT * INTO v_preferences
    FROM notification_preferences
    WHERE user_id = p_user_id;
    
    -- Skip if user opted out of this type
    IF v_preferences IS NOT NULL THEN
        IF p_template LIKE '%dunning%' OR p_template LIKE '%payment%' OR p_template LIKE '%subscription%' THEN
            IF NOT v_preferences.billing_emails THEN
                RETURN NULL; -- User opted out
            END IF;
        ELSIF p_template LIKE '%usage%' THEN
            IF NOT v_preferences.usage_emails THEN
                RETURN NULL;
            END IF;
        ELSIF p_template LIKE '%marketing%' OR p_template LIKE '%update%' THEN
            IF NOT v_preferences.marketing_emails THEN
                RETURN NULL;
            END IF;
        END IF;
    END IF;
    
    INSERT INTO email_queue (
        user_id, template, recipients, subject, data, scheduled_for
    ) VALUES (
        p_user_id, p_template, p_recipients, p_subject, p_data, p_scheduled_for
    )
    RETURNING id INTO v_email_id;
    
    RETURN v_email_id;
END;
$$;

-- Create default preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences
    WHERE notification_preferences.user_id = profiles.id
)
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE notifications IS 'In-app notification system for users';
COMMENT ON TABLE email_queue IS 'Queue for sending transactional emails';
COMMENT ON TABLE notification_preferences IS 'User notification and email preferences';
COMMENT ON TABLE email_templates IS 'Email template definitions';
