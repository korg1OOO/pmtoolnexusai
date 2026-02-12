-- Phase 14: Marketing Campaigns
-- Create in-app announcements and feature flags

-- In-App Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'feature')),
  target_audience JSONB, -- { tiers: ['pro', 'free'], created_after: '2024-01-01' }
  link_url TEXT,
  link_text TEXT,
  is_dismissible BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Announcement Dismissals
CREATE TABLE IF NOT EXISTS announcement_dismissals (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, announcement_id)
);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INT DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_tiers TEXT[], -- ['pro', 'enterprise']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Announcements View
CREATE OR REPLACE VIEW active_announcements AS
SELECT 
  a.*,
  COUNT(ad.user_id) as dismissal_count
FROM announcements a
LEFT JOIN announcement_dismissals ad ON a.id = ad.announcement_id
WHERE 
  a.is_active = true
  AND (a.starts_at IS NULL OR a.starts_at <= NOW())
  AND (a.ends_at IS NULL OR a.ends_at >= NOW())
GROUP BY a.id;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_announcement_dismissals_user ON announcement_dismissals(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- Comments
COMMENT ON TABLE announcements IS 'In-app announcements for users';
COMMENT ON TABLE announcement_dismissals IS 'Track which users have dismissed announcements';
COMMENT ON TABLE feature_flags IS 'Feature flag system for phased rollouts';
COMMENT ON VIEW active_announcements IS 'Currently active announcements with dismissal counts';
