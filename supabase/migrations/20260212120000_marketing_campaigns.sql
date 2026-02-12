-- Marketing Campaigns Infrastructure
-- Creates tables for marketing campaigns, analytics, A/B testing, and recipient tracking

-- Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in_app')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
  subject TEXT,
  content JSONB NOT NULL DEFAULT '{}'::JSONB,
  target_audience JSONB DEFAULT '{}'::JSONB, -- Filtering criteria
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Analytics Table
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('sent', 'delivered', 'opened', 'clicked', 'converted', 'bounced', 'spam_reported', 'unsubscribed')),
  metric_value INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- A/B Test Variants Table
CREATE TABLE IF NOT EXISTS ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL, -- 'A', 'B', 'C', etc.
  subject TEXT,
  content JSONB NOT NULL DEFAULT '{}'::JSONB,
  traffic_percentage INTEGER CHECK (traffic_percentage BETWEEN 0 AND 100),
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, variant_name)
);

-- Campaign Recipients Table
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT NOT NULL,
  variant_id UUID REFERENCES ab_test_variants(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by ON marketing_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_scheduled_at ON marketing_campaigns(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_metric_type ON campaign_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_timestamp ON campaign_analytics(timestamp);

CREATE INDEX IF NOT EXISTS idx_ab_test_variants_campaign ON ab_test_variants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_winner ON ab_test_variants(is_winner) WHERE is_winner = TRUE;

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_user ON campaign_recipients(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_variant ON campaign_recipients(variant_id) WHERE variant_id IS NOT NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketing_campaign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_campaign_updated_at();

-- Function to calculate campaign metrics
CREATE OR REPLACE FUNCTION get_campaign_metrics(p_campaign_id UUID)
RETURNS TABLE (
  total_recipients BIGINT,
  sent_count BIGINT,
  delivered_count BIGINT,
  opened_count BIGINT,
  clicked_count BIGINT,
  converted_count BIGINT,
  bounced_count BIGINT,
  unsubscribed_count BIGINT,
  open_rate NUMERIC,
  click_rate NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH recipient_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'sent' AND opened_at IS NOT NULL) as opened,
      COUNT(*) FILTER (WHERE status = 'sent' AND clicked_at IS NOT NULL) as clicked,
      COUNT(*) FILTER (WHERE status = 'sent' AND converted_at IS NOT NULL) as converted,
      COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
      COUNT(*) FILTER (WHERE unsubscribed_at IS NOT NULL) as unsubscribed
    FROM campaign_recipients
    WHERE campaign_id = p_campaign_id
  )
  SELECT 
    total,
    sent,
    sent, -- delivered = sent (simplified)
    opened,
    clicked,
    converted,
    bounced,
    unsubscribed,
    CASE WHEN sent > 0 THEN ROUND((opened::NUMERIC / sent::NUMERIC) * 100, 2) ELSE 0 END,
    CASE WHEN sent > 0 THEN ROUND((clicked::NUMERIC / sent::NUMERIC) * 100, 2) ELSE 0 END,
    CASE WHEN sent > 0 THEN ROUND((converted::NUMERIC / sent::NUMERIC) * 100, 2) ELSE 0 END
  FROM recipient_stats;
END;
$$ LANGUAGE plpgsql;

-- View for campaign performance overview
CREATE OR REPLACE VIEW campaign_performance_overview AS
SELECT 
  mc.id,
  mc.name,
  mc.type,
  mc.status,
  mc.created_at,
  mc.scheduled_at,
  mc.started_at,
  mc.completed_at,
  COUNT(DISTINCT cr.id) as total_recipients,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'sent') as sent_count,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.opened_at IS NOT NULL) as opened_count,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.clicked_at IS NOT NULL) as clicked_count,
  CASE 
    WHEN COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'sent') > 0 
    THEN ROUND((COUNT(DISTINCT cr.id) FILTER (WHERE cr.opened_at IS NOT NULL)::NUMERIC / 
                COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'sent')::NUMERIC) * 100, 2)
    ELSE 0 
  END as open_rate
FROM marketing_campaigns mc
LEFT JOIN campaign_recipients cr ON mc.id = cr.campaign_id
GROUP BY mc.id, mc.name, mc.type, mc.status, mc.created_at, mc.scheduled_at, mc.started_at, mc.completed_at;

-- Comments
COMMENT ON TABLE marketing_campaigns IS 'Marketing campaign definitions and configurations';
COMMENT ON TABLE campaign_analytics IS 'Time-series analytics data for campaign performance tracking';
COMMENT ON TABLE ab_test_variants IS 'A/B test variants for campaigns with traffic allocation';
COMMENT ON TABLE campaign_recipients IS 'Individual recipient tracking for campaigns';
COMMENT ON FUNCTION get_campaign_metrics IS 'Calculate comprehensive metrics for a campaign';
COMMENT ON VIEW campaign_performance_overview IS 'Aggregate view of campaign performance';
