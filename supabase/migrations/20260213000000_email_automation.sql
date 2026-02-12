-- Phase 13: Email Automation
-- Create email templates, campaigns, and analytics system

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('transactional', 'marketing', 'onboarding')),
  variables JSONB DEFAULT '[]'::jsonb, -- ['name', 'email', 'amount']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  target_audience JSONB, -- { tier: ['pro'], created_after: '2024-01-01' }
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaign Recipients Table
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Analytics View
CREATE OR REPLACE VIEW email_analytics AS
SELECT 
  ec.id,
  ec.name,
  ec.status,
  ec.sent_count,
  ec.open_count,
  ec.click_count,
  CASE WHEN ec.sent_count > 0 
    THEN ROUND((ec.open_count::FLOAT / ec.sent_count) * 100, 2) 
    ELSE 0 
  END as open_rate,
  CASE WHEN ec.open_count > 0 
    THEN ROUND((ec.click_count::FLOAT / ec.open_count) * 100, 2) 
    ELSE 0 
  END as click_rate,
  CASE WHEN ec.sent_count > 0 AND ec.click_count > 0
    THEN ROUND((ec.click_count::FLOAT / ec.sent_count) * 100, 2)
    ELSE 0
  END as click_through_rate,
  ec.created_at,
  ec.sent_at,
  u.email as created_by_email
FROM email_campaigns ec
LEFT JOIN auth.users u ON ec.created_by = u.id;

-- Campaign Performance by Template View
CREATE OR REPLACE VIEW template_performance AS
SELECT 
  et.id as template_id,
  et.name as template_name,
  et.template_type,
  COUNT(ec.id) as campaigns_count,
  SUM(ec.sent_count) as total_sent,
  AVG(CASE WHEN ec.sent_count > 0 
    THEN (ec.open_count::FLOAT / ec.sent_count) * 100 
    ELSE 0 
  END) as avg_open_rate,
  AVG(CASE WHEN ec.open_count > 0 
    THEN (ec.click_count::FLOAT / ec.open_count) * 100 
    ELSE 0 
  END) as avg_click_rate
FROM email_templates et
LEFT JOIN email_campaigns ec ON et.id = ec.template_id
WHERE et.is_active = true
GROUP BY et.id, et.name, et.template_type;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_template ON email_campaigns(template_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_email_recipients_campaign ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_recipients_user ON email_campaign_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_email_recipients_status ON email_campaign_recipients(status);

-- Function to update campaign stats when recipient status changes
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update sent count
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
    UPDATE email_campaigns
    SET sent_count = sent_count + 1,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  
  -- Update open count
  IF NEW.opened_at IS NOT NULL AND (OLD.opened_at IS NULL) THEN
    UPDATE email_campaigns
    SET open_count = open_count + 1,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  
  -- Update click count
  IF NEW.clicked_at IS NOT NULL AND (OLD.clicked_at IS NULL) THEN
    UPDATE email_campaigns
    SET click_count = click_count + 1,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update campaign stats
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON email_campaign_recipients;
CREATE TRIGGER update_campaign_stats_trigger
  AFTER INSERT OR UPDATE ON email_campaign_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats();

-- Comments for documentation
COMMENT ON TABLE email_templates IS 'Reusable email templates with variable support';
COMMENT ON TABLE email_campaigns IS 'Email marketing campaigns';
COMMENT ON TABLE email_campaign_recipients IS 'Individual campaign recipient tracking';
COMMENT ON VIEW email_analytics IS 'Campaign performance analytics';
COMMENT ON VIEW template_performance IS 'Template effectiveness metrics';
