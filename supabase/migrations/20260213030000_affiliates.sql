-- Phase 16: Affiliates Enhancement  
-- Extend referral system with commission tracking

-- Extend referral_codes table (if not already extended)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'referral_codes' AND column_name = 'commission_rate') THEN
    ALTER TABLE referral_codes
      ADD COLUMN commission_rate NUMERIC DEFAULT 0.10,
      ADD COLUMN total_earnings NUMERIC DEFAULT 0,
      ADD COLUMN payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'completed')),
      ADD COLUMN payout_method JSONB;
  END IF;
END $$;

-- Affiliate Payouts Table
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method TEXT,
  transaction_id TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Affiliate Performance View
CREATE OR REPLACE VIEW affiliate_performance AS
SELECT 
  rc.id,
  rc.code,
  rc.referrer_user_id,
  u.email as referrer_email,
  rc.uses_count,
  rc.successful_conversions,
  rc.total_earnings,
  rc.commission_rate,
  rc.payout_status,
  CASE WHEN rc.uses_count > 0 
    THEN ROUND((rc.successful_conversions::FLOAT / rc.uses_count) * 100, 2)
    ELSE 0 
  END as conversion_rate
FROM referral_codes rc
LEFT JOIN auth.users u ON rc.referrer_user_id = u.id
WHERE rc.is_active = true;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_code ON affiliate_payouts(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

-- Comments
COMMENT ON TABLE affiliate_payouts IS 'Affiliate payout tracking and processing';
COMMENT ON VIEW affiliate_performance IS 'Affiliate performance metrics with earnings and conversion rates';
