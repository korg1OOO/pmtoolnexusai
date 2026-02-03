-- Seed Portfolios
INSERT INTO portfolios (id, name, description, status)
VALUES 
  ('port-1', 'Digital Transformation', 'Strategic initiatives for digital reach and customer experience.', 'active'),
  ('port-2', 'Infrastructure Modernization', 'Upgrading core IT infrastructure and cloud capabilities.', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Programs
INSERT INTO programs (id, name, description, status, portfolio_id)
VALUES 
  ('prog-1', 'Customer Experience Platform', 'Modernizing customer touchpoints across web and mobile.', 'active', 'port-1'),
  ('prog-2', 'Data Analytics Initiative', 'Leveraging data for better business insights.', 'active', 'port-1'),
  ('prog-3', 'Cloud Migration', 'Moving legacy systems to AWS and Azure.', 'active', 'port-2')
ON CONFLICT (id) DO NOTHING;

-- Link existing projects to programs (guessing IDs based on mock data names if they exist)
-- Note: This assumes some projects already exist. If not, this part will be handled during project creation.
-- For now, let's just ensure the tables are ready.
