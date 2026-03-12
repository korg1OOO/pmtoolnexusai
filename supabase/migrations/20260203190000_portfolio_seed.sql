-- Seed Portfolios
INSERT INTO portfolios (id, name, description, status)
VALUES 
  ('d47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid, 'Digital Transformation', 'Strategic initiatives for digital reach and customer experience.', 'active'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d480'::uuid, 'Infrastructure Modernization', 'Upgrading core IT infrastructure and cloud capabilities.', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Programs
INSERT INTO programs (id, name, description, status, portfolio_id)
VALUES 
  ('e47ac10b-58cc-4372-a567-0e02b2c3d481'::uuid, 'Customer Experience Platform', 'Modernizing customer touchpoints across web and mobile.', 'active', 'd47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d482'::uuid, 'Data Analytics Initiative', 'Leveraging data for better business insights.', 'active', 'd47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid),
  ('e47ac10b-58cc-4372-a567-0e02b2c3d483'::uuid, 'Cloud Migration', 'Moving legacy systems to AWS and Azure.', 'active', 'f47ac10b-58cc-4372-a567-0e02b2c3d480'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Link existing projects to programs (guessing IDs based on mock data names if they exist)
-- Note: This assumes some projects already exist. If not, this part will be handled during project creation.
-- For now, let's just ensure the tables are ready.
