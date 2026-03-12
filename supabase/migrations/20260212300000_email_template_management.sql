-- Email Template Management System
-- Admin-editable templates, IMAP config, and notification analytics

-- =============================================
-- Email Template Storage
-- =============================================

CREATE TABLE IF NOT EXISTS email_templates_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    category TEXT NOT NULL CHECK (category IN ('billing', 'engagement', 'system', 'marketing')),
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_templates_category ON email_templates_admin(category);
CREATE INDEX idx_email_templates_active ON email_templates_admin(is_active);

-- Template version history
CREATE TABLE IF NOT EXISTS email_template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_template_id UUID REFERENCES email_templates_admin(id) ON DELETE CASCADE,
    template_key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    variables JSONB,
    category TEXT NOT NULL,
    version INTEGER NOT NULL,
    change_notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_template_versions_parent ON email_template_versions(parent_template_id);

-- =============================================
-- IMAP Configuration
-- =============================================

CREATE TABLE IF NOT EXISTS imap_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'zoho', 'custom')),
    email_address TEXT NOT NULL,
    imap_host TEXT NOT NULL,
    imap_port INTEGER NOT NULL,
    imap_username TEXT NOT NULL,
    imap_password_encrypted TEXT NOT NULL,
    use_ssl BOOLEAN DEFAULT true,
    folder_to_sync TEXT DEFAULT 'INBOX',
    sync_frequency_minutes INTEGER DEFAULT 15,
    last_sync_at TIMESTAMPTZ,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_imap_accounts_user ON imap_accounts(user_id);
CREATE INDEX idx_imap_accounts_status ON imap_accounts(status);

-- IMAP provider presets
CREATE TABLE IF NOT EXISTS imap_presets (
    provider TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    imap_host TEXT NOT NULL,
    imap_port INTEGER NOT NULL,
    use_ssl BOOLEAN DEFAULT true,
    instructions TEXT,
    help_url TEXT
);

-- Insert default presets
INSERT INTO imap_presets (provider, display_name, imap_host, imap_port, use_ssl, instructions, help_url)
VALUES 
    ('gmail', 'Gmail', 'imap.gmail.com', 993, true, 
     'Enable IMAP in Gmail settings and use an App Password instead of your regular password.',
     'https://support.google.com/mail/answer/7126229'),
    ('outlook', 'Outlook / Office 365', 'outlook.office365.com', 993, true,
     'Enable IMAP in Outlook settings. Use your Microsoft account credentials.',
     'https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings'),
    ('zoho', 'Zoho Mail', 'imap.zoho.com', 993, true,
     'Enable IMAP access in Zoho Mail settings under Mail Accounts.',
     'https://www.zoho.com/mail/help/imap-access.html')
ON CONFLICT (provider) DO NOTHING;

-- =============================================
-- Notification Analytics
-- =============================================

CREATE TABLE IF NOT EXISTS notification_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID, -- May reference notifications table
    channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'sms', 'push')),
    template_key TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    sent_at TIMESTAMPTZ DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_reason TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_notification_analytics_user ON notification_analytics(user_id);
CREATE INDEX idx_notification_analytics_sent ON notification_analytics(sent_at);
CREATE INDEX idx_notification_analytics_template ON notification_analytics(template_key);
CREATE INDEX idx_notification_analytics_channel ON notification_analytics(channel);
CREATE INDEX idx_notification_analytics_status ON notification_analytics(status);

-- Analytics summary view
CREATE OR REPLACE VIEW notification_analytics_summary AS
SELECT 
    template_key,
    channel,
    DATE_TRUNC('day', sent_at) as date,
    COUNT(*) as total_sent,
    COUNT(delivered_at) as total_delivered,
    COUNT(opened_at) as total_opened,
    COUNT(clicked_at) as total_clicked,
    COUNT(bounced_at) as total_bounced,
    ROUND(100.0 * COUNT(delivered_at) / NULLIF(COUNT(*), 0), 2) as delivery_rate,
    ROUND(100.0 * COUNT(opened_at) / NULLIF(COUNT(delivered_at), 0), 2) as open_rate,
    ROUND(100.0 * COUNT(clicked_at) / NULLIF(COUNT(opened_at), 0), 2) as click_rate,
    ROUND(100.0 * COUNT(bounced_at) / NULLIF(COUNT(*), 0), 2) as bounce_rate
FROM notification_analytics
GROUP BY template_key, channel, DATE_TRUNC('day', sent_at);

-- =============================================
-- SMS/Push Configuration
-- =============================================

CREATE TABLE IF NOT EXISTS notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'push')),
    provider TEXT NOT NULL, -- 'twilio' for SMS, 'firebase' for push
    api_key_encrypted TEXT,
    configuration JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User device tokens for push notifications
CREATE TABLE IF NOT EXISTS user_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, device_token)
);

CREATE INDEX idx_device_tokens_user ON user_device_tokens(user_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE email_templates_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE imap_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_device_tokens ENABLE ROW LEVEL SECURITY;

-- Admin-only access to email templates
CREATE POLICY "Admins can manage email templates"
    ON email_templates_admin
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Admins can view template versions"
    ON email_template_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Users can manage their own IMAP accounts, admins can view all
CREATE POLICY "Users can manage own IMAP accounts"
    ON imap_accounts
    FOR ALL
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Admins can view all analytics
CREATE POLICY "Admins can view analytics"
    ON notification_analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- System can insert analytics
CREATE POLICY "System can insert analytics"
    ON notification_analytics
    FOR INSERT
    WITH CHECK (true);

-- Admin-only channel configuration
CREATE POLICY "Admins can manage notification channels"
    ON notification_channels
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Users can manage their own device tokens
CREATE POLICY "Users can manage own device tokens"
    ON user_device_tokens
    FOR ALL
    USING (user_id = auth.uid());

-- =============================================
-- Functions
-- =============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates_admin
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imap_accounts_updated_at
    BEFORE UPDATE ON imap_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment version on template update
CREATE OR REPLACE FUNCTION increment_template_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Save old version to history
    INSERT INTO email_template_versions (
        parent_template_id, template_key, name, description,
        subject_template, html_template, text_template,
        variables, category, version, created_by
    ) VALUES (
        OLD.id, OLD.template_key, OLD.name, OLD.description,
        OLD.subject_template, OLD.html_template, OLD.text_template,
        OLD.variables, OLD.category, OLD.version, OLD.updated_by
    );
    
    -- Increment version
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_version_trigger
    BEFORE UPDATE ON email_templates_admin
    FOR EACH ROW
    WHEN (
        OLD.html_template IS DISTINCT FROM NEW.html_template
        OR OLD.subject_template IS DISTINCT FROM NEW.subject_template
    )
    EXECUTE FUNCTION increment_template_version();

-- =============================================
-- Seed Default Templates
-- =============================================

INSERT INTO email_templates_admin (template_key, name, description, subject_template, html_template, text_template, variables, category)
VALUES 
    ('payment_failed', 'Payment Failed', 'Notify user of failed payment', 
     'Payment Failed - Action Required',
     '<!-- Will be populated from file -->',
     'Your payment for {{amount}} failed. Please update your payment method.',
     '[{"key": "amount", "description": "Payment amount"}, {"key": "last4", "description": "Last 4 digits of card"}]'::jsonb,
     'billing'),
    
    ('payment_success', 'Payment Success', 'Receipt for successful payment',
     'Payment Received - Thank You!',
     '<!-- Will be populated from file -->',
     'Thank you! Your payment of {{amount}} was successful.',
     '[{"key": "amount", "description": "Payment amount"}, {"key": "invoice_url", "description": "Link to invoice"}]'::jsonb,
     'billing'),
    
    ('welcome', 'Welcome Email', 'Welcome new users',
     'Welcome to {{app_name}}!',
     '<!-- Will be populated from file -->',
     'Welcome! Get started with these steps...',
     '[{"key": "app_name", "description": "Application name"}, {"key": "user_name", "description": "User name"}]'::jsonb,
     'engagement'),
     
    ('trial_expiring', 'Trial Expiring', 'Notify trial ending soon',
     'Your trial expires in {{days_remaining}} days',
     '<!-- Placeholder -->',
     'Your trial expires soon. Upgrade to continue.',
     '[{"key": "days_remaining", "description": "Days until trial ends"}, {"key": "upgrade_url", "description": "Link to upgrade"}]'::jsonb,
     'engagement'),
     
    ('renewal_reminder', 'Renewal Reminder', 'Upcoming subscription renewal',
     'Your subscription renews in 3 days',
     '<!-- Placeholder -->',
     'Your subscription will renew on {{renewal_date}}.',
     '[{"key": "renewal_date", "description": "Date of renewal"}, {"key": "amount", "description": "Renewal amount"}]'::jsonb,
     'billing'),
     
    ('card_expiring', 'Card Expiring', 'Payment method expiring',
     'Update your payment method',
     '<!-- Placeholder -->',
     'Your card ending in {{last4}} expires on {{expiry_date}}.',
     '[{"key": "last4", "description": "Last 4 digits"}, {"key": "expiry_date", "description": "Card expiry date"}]'::jsonb,
     'billing'),
     
    ('inactive_user', 'Inactive User', 'Re-engage inactive users',
     'We miss you! Come back for exclusive offers',
     '<!-- Placeholder -->',
     'We noticed you haven''t logged in recently.',
     '[{"key": "user_name", "description": "User name"}, {"key": "last_login", "description": "Last login date"}]'::jsonb,
     'engagement'),
     
    ('monthly_summary', 'Monthly Summary', 'Monthly usage summary',
     'Your {{month}} summary',
     '<!-- Placeholder -->',
     'Here''s your usage summary for {{month}}.',
     '[{"key": "month", "description": "Month name"}, {"key": "stats", "description": "Usage statistics"}]'::jsonb,
     'system')
ON CONFLICT (template_key) DO NOTHING;

COMMENT ON TABLE email_templates_admin IS 'Admin-editable email templates with versioning';
COMMENT ON TABLE imap_accounts IS 'IMAP account configurations for email ingestion';
COMMENT ON TABLE notification_analytics IS 'Tracks notification delivery and engagement metrics';
