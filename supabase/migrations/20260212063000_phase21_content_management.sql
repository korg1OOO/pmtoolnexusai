-- =====================================================
-- Phase 21: Content Management System - Database Schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CONTENT CATEGORIES
-- =====================================================

CREATE TABLE content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('faq', 'blog', 'docs')),
  description TEXT,
  icon VARCHAR(50),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_categories_type ON content_categories(type);
CREATE INDEX idx_content_categories_slug ON content_categories(slug);

-- =====================================================
-- 2. FAQs TABLE
-- =====================================================

CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[], -- For additional search terms
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_faqs_category ON faqs(category_id);
CREATE INDEX idx_faqs_published ON faqs(is_published) WHERE deleted_at IS NULL;
CREATE INDEX idx_faqs_display_order ON faqs(display_order);
CREATE INDEX idx_faqs_search ON faqs USING GIN (to_tsvector('english', question || ' ' || answer));

-- =====================================================
-- 3. BLOG POSTS TABLE
-- =====================================================

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL, -- Rich text/Markdown
  featured_image_url TEXT,
  category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  view_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  reading_time_minutes INT, -- Auto-calculated
  
  -- SEO
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),
  meta_keywords TEXT[],
  
  -- Scheduling
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_blog_posts_status ON blog_posts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_search ON blog_posts USING GIN (to_tsvector('english', title || ' ' || COALESCE(excerpt, '') || ' ' || content));

-- =====================================================
-- 4. BLOG TAGS
-- =====================================================

CREATE TABLE blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

CREATE TABLE blog_post_tags (
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  blog_tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, blog_tag_id)
);

CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(blog_post_id);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(blog_tag_id);

-- =====================================================
-- 5. DOCUMENTATION TABLE
-- =====================================================

CREATE TABLE documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  content TEXT NOT NULL, -- Markdown
  category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  version VARCHAR(20) NOT NULL DEFAULT 'v1.0', -- e.g., 'v1.0', 'v1.1'
  order_index INT DEFAULT 0,
  parent_id UUID REFERENCES documentation(id) ON DELETE SET NULL, -- For nested docs
  is_published BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  
  -- SEO
  meta_description VARCHAR(160),
  
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(slug, version)
);

CREATE INDEX idx_docs_version_published ON documentation(version, is_published) WHERE deleted_at IS NULL;
CREATE INDEX idx_docs_parent ON documentation(parent_id);
CREATE INDEX idx_docs_slug_version ON documentation(slug, version);
CREATE INDEX idx_docs_order ON documentation(order_index);
CREATE INDEX idx_docs_search ON documentation USING GIN (to_tsvector('english', title || ' ' || content));

-- =====================================================
-- 6. MEDIA LIBRARY TABLE
-- =====================================================

CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'document'
  file_size BIGINT NOT NULL, -- bytes
  mime_type VARCHAR(100),
  
  -- Metadata for images/videos
  width INT,
  height INT,
  duration NUMERIC, -- For videos (seconds)
  alt_text TEXT,
  caption TEXT,
  
  -- Organization
  folder VARCHAR(100) DEFAULT 'uploads',
  tags TEXT[],
  
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_media_type ON media_library(file_type);
CREATE INDEX idx_media_folder ON media_library(folder);
CREATE INDEX idx_media_uploader ON media_library(uploaded_by);
CREATE INDEX idx_media_created ON media_library(created_at DESC);

-- =====================================================
-- 7. VIEWS
-- =====================================================

-- Published FAQs with category info
CREATE VIEW published_faqs AS
SELECT 
  f.id,
  f.question,
  f.answer,
  f.display_order,
  f.view_count,
  f.helpful_count,
  f.not_helpful_count,
  f.created_at,
  f.updated_at,
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon
FROM faqs f
LEFT JOIN content_categories c ON f.category_id = c.id
WHERE f.is_published = true AND f.deleted_at IS NULL
ORDER BY f.display_order, f.created_at DESC;

-- Published Blog Posts with full metadata
CREATE VIEW published_blog_posts AS
SELECT 
  bp.id,
  bp.title,
  bp.slug,
  bp.excerpt,
  bp.content,
  bp.featured_image_url,
  bp.view_count,
  bp.likes_count,
  bp.reading_time_minutes,
  bp.published_at,
  bp.meta_title,
  bp.meta_description,
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  u.id as author_id,
  u.email as author_email,
  (
    SELECT ARRAY_AGG(bt.name ORDER BY bt.name)
    FROM blog_post_tags bpt
    JOIN blog_tags bt ON bpt.blog_tag_id = bt.id
    WHERE bpt.blog_post_id = bp.id
  ) as tags
FROM blog_posts bp
LEFT JOIN content_categories c ON bp.category_id = c.id
LEFT JOIN auth.users u ON bp.author_id = u.id
WHERE bp.status = 'published' 
  AND bp.published_at <= NOW()
  AND bp.deleted_at IS NULL
ORDER BY bp.published_at DESC;

-- Published Documentation with hierarchy
CREATE VIEW published_documentation AS
SELECT 
  d.id,
  d.title,
  d.slug,
  d.content,
  d.version,
  d.order_index,
  d.view_count,
  d.meta_description,
  d.created_at,
  d.updated_at,
  c.id as category_id,
  c.name as category_name,
  d.parent_id,
  parent.title as parent_title,
  parent.slug as parent_slug
FROM documentation d
LEFT JOIN content_categories c ON d.category_id = c.id
LEFT JOIN documentation parent ON d.parent_id = parent.id
WHERE d.is_published = true AND d.deleted_at IS NULL
ORDER BY d.version DESC, d.order_index;

-- =====================================================
-- 8. FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_content_categories_updated_at BEFORE UPDATE ON content_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documentation_updated_at BEFORE UPDATE ON documentation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_library_updated_at BEFORE UPDATE ON media_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_content_views(
  content_type TEXT,
  content_id UUID
) RETURNS void AS $$
BEGIN
  CASE content_type
    WHEN 'faq' THEN
      UPDATE faqs SET view_count = view_count + 1 WHERE id = content_id;
    WHEN 'blog' THEN
      UPDATE blog_posts SET view_count = view_count + 1 WHERE id = content_id;
    WHEN 'docs' THEN
      UPDATE documentation SET view_count = view_count + 1 WHERE id = content_id;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_tags SET usage_count = usage_count + 1 WHERE id = NEW.blog_tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_tags SET usage_count = usage_count - 1 WHERE id = OLD.blog_tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tag_usage_on_post_tag
AFTER INSERT OR DELETE ON blog_post_tags
FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Public read access to published content
CREATE POLICY "Public can view published FAQs"
  ON faqs FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);

CREATE POLICY "Public can view published blog posts"
  ON blog_posts FOR SELECT
  USING (status = 'published' AND published_at <= NOW() AND deleted_at IS NULL);

CREATE POLICY "Public can view published documentation"
  ON documentation FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);

CREATE POLICY "Public can view categories"
  ON content_categories FOR SELECT
  USING (true);

CREATE POLICY "Public can view tags"
  ON blog_tags FOR SELECT
  USING (true);

CREATE POLICY "Public can view blog post tags"
  ON blog_post_tags FOR SELECT
  USING (true);

-- Admin full access
CREATE POLICY "Admins have full access to categories"
  ON content_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins have full access to FAQs"
  ON faqs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins have full access to blog posts"
  ON blog_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins have full access to tags"
  ON blog_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins have full access to blog post tags"
  ON blog_post_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins have full access to documentation"
  ON documentation FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins have full access to media library"
  ON media_library FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Public read access to media (for blog images, etc.)
CREATE POLICY "Public can view media"
  ON media_library FOR SELECT
  USING (deleted_at IS NULL);

-- =====================================================
-- 10. SEED DATA
-- =====================================================

-- Insert default categories
INSERT INTO content_categories (name, slug, type, description, icon, display_order) VALUES
  ('General', 'general', 'faq', 'General questions and answers', 'HelpCircle', 1),
  ('Technical', 'technical', 'faq', 'Technical support and troubleshooting', 'Wrench', 2),
  ('Billing', 'billing', 'faq', 'Billing and payment questions', 'CreditCard', 3),
  ('Product Updates', 'product-updates', 'blog', 'Latest product features and updates', 'Sparkles', 1),
  ('Tutorials', 'tutorials', 'blog', 'How-to guides and tutorials', 'BookOpen', 2),
  ('Company News', 'company-news', 'blog', 'Company announcements and news', 'Newspaper', 3),
  ('Getting Started', 'getting-started', 'docs', 'Beginner guides and setup instructions', 'Rocket', 1),
  ('API Reference', 'api-reference', 'docs', 'API documentation and reference', 'Code', 2),
  ('Advanced', 'advanced', 'docs', 'Advanced features and configurations', 'Zap', 3);

-- Insert sample FAQs
INSERT INTO faqs (category_id, question, answer, keywords, display_order, is_published, created_by, updated_by) VALUES
  (
    (SELECT id FROM content_categories WHERE slug = 'general' AND type = 'faq'),
    'What is Kiroxys?',
    'Kiroxys is a comprehensive project management platform designed to help teams collaborate, track progress, and deliver projects successfully. It combines task management, resource allocation, budget tracking, and AI-powered analytics in one unified platform.',
    ARRAY['about', 'platform', 'features'],
    1,
    true,
    NULL,
    NULL
  ),
  (
    (SELECT id FROM content_categories WHERE slug = 'general' AND type = 'faq'),
    'How do I get started?',
    'Getting started with Kiroxys is easy! Simply sign up for an account, create your first project, invite your team members, and start adding tasks. Our onboarding guide will walk you through the process step by step.',
    ARRAY['onboarding', 'setup', 'beginner'],
    2,
    true,
    NULL,
    NULL
  ),
  (
    (SELECT id FROM content_categories WHERE slug = 'billing' AND type = 'faq'),
    'What payment methods do you accept?',
    'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers. All payments are processed securely through Stripe.',
    ARRAY['payment', 'credit card', 'stripe'],
    1,
    true,
    NULL,
    NULL
  );

-- Insert sample blog tags
INSERT INTO blog_tags (name, slug) VALUES
  ('Product Updates', 'product-updates'),
  ('Best Practices', 'best-practices'),
  ('Case Studies', 'case-studies'),
  ('Tutorials', 'tutorials'),
  ('AI & ML', 'ai-ml');

COMMENT ON TABLE content_categories IS 'Content categories for FAQs, blog posts, and documentation';
COMMENT ON TABLE faqs IS 'Frequently Asked Questions with search and analytics';
COMMENT ON TABLE blog_posts IS 'Blog posts with rich text content, SEO, and scheduling';
COMMENT ON TABLE blog_tags IS 'Tags for categorizing blog posts';
COMMENT ON TABLE documentation IS 'Versioned documentation with hierarchical structure';
COMMENT ON TABLE media_library IS 'Centralized media storage with metadata';
