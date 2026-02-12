-- Phase 6: Admin Marketing Tables
-- Announcements and Feature Flags for marketing campaigns

-- =============================================
-- ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, warning, success, feature
  is_active BOOLEAN NOT NULL DEFAULT true,
  dismissal_count INTEGER NOT NULL DEFAULT 0,
  target_audience JSONB DEFAULT '[]'::jsonb, -- Array of user segments
  priority INTEGER DEFAULT 0, -- For ordering
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FEATURE FLAGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE, -- e.g., 'ml_analytics_v2'
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_tiers JSONB DEFAULT '[]'::jsonb, -- Array of tier names: ['pro', 'business']
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional config
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage announcements
CREATE POLICY "Admins can manage announcements"
  ON announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow all authenticated users to view active announcements
CREATE POLICY "Users can view active announcements"
  ON announcements
  FOR SELECT
  USING (is_active = true);

-- Allow admins to manage feature flags
CREATE POLICY "Admins can manage feature flags"
  ON feature_flags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow all authenticated users to view feature flags (for client-side checks)
CREATE POLICY "Users can view feature flags"
  ON feature_flags
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE announcements IS 'In-app announcements for marketing campaigns';
COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollouts and A/B testing';
COMMENT ON COLUMN announcements.dismissal_count IS 'Number of times users dismissed this announcement';
COMMENT ON COLUMN feature_flags.rollout_percentage IS 'Percentage of users who see this feature (0-100)';
