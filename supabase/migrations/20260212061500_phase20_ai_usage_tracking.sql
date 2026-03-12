/**
 * Phase 20 Database Migration: AI Usage Tracking
 * Creates tables for AI provider usage, costs, and budget monitoring
 */

-- =============================================
-- AI USAGE LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  operation TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_provider ON ai_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_provider_created ON ai_usage_logs(provider, created_at DESC);

-- =============================================
-- AI PROVIDER COSTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ai_provider_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_token_cost NUMERIC(10, 8) NOT NULL,
  completion_token_cost NUMERIC(10, 8) NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index on provider+model+effective_date
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_provider_costs_unique 
ON ai_provider_costs(provider, model, effective_date);

-- Insert default pricing (as of Feb 2026)
INSERT INTO ai_provider_costs (provider, model, prompt_token_cost, completion_token_cost, notes) VALUES
('openai', 'gpt-4', 0.00003, 0.00006, 'GPT-4 standard pricing'),
('openai', 'gpt-4-turbo', 0.00001, 0.00003, 'GPT-4 Turbo pricing'),
('openai', 'gpt-3.5-turbo', 0.0000005, 0.0000015, 'GPT-3.5 Turbo pricing'),
('anthropic', 'claude-3-opus', 0.000015, 0.000075, 'Claude 3 Opus pricing'),
('anthropic', 'claude-3-sonnet', 0.000003, 0.000015, 'Claude 3 Sonnet pricing'),
('anthropic', 'claude-3-haiku', 0.00000025, 0.00000125, 'Claude 3 Haiku pricing'),
('google', 'gemini-pro', 0.00000025, 0.0000005, 'Gemini Pro pricing'),
('google', 'gemini-ultra', 0.00001, 0.00002, 'Gemini Ultra pricing')
ON CONFLICT DO NOTHING;

-- =============================================
-- AI BUDGETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ai_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  budget_type TEXT NOT NULL,
  target_id UUID,
  limit_usd NUMERIC(10, 2) NOT NULL,
  period TEXT NOT NULL,
  alert_threshold NUMERIC(3, 2) DEFAULT 0.8,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for active budgets
CREATE INDEX IF NOT EXISTS idx_ai_budgets_active ON ai_budgets(is_active, budget_type);

-- Insert default system budget
INSERT INTO ai_budgets (name, budget_type, limit_usd, period, start_date) VALUES
('System Monthly Budget', 'system', 10000.00, 'monthly', NOW())
ON CONFLICT DO NOTHING;

-- =============================================
-- VIEWS
-- =============================================

-- AI usage summary (last 30 days)
CREATE OR REPLACE VIEW ai_usage_summary AS
SELECT 
  provider,
  model,
  COUNT(*) as request_count,
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(completion_tokens) as total_completion_tokens,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(duration_ms) as avg_duration_ms,
  COUNT(*) FILTER (WHERE success = false) as error_count,
  DATE_TRUNC('day', created_at) as usage_date
FROM ai_usage_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY provider, model, DATE_TRUNC('day', created_at)
ORDER BY usage_date DESC, total_cost_usd DESC;

-- AI cost by provider (current month)
CREATE OR REPLACE VIEW ai_cost_by_provider AS
SELECT 
  provider,
  COUNT(*) as request_count,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(cost_usd) as avg_cost_per_request,
  COUNT(DISTINCT user_id) as unique_users
FROM ai_usage_logs
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY provider
ORDER BY total_cost_usd DESC;

-- AI usage by user (current month)
CREATE OR REPLACE VIEW ai_usage_by_user AS
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  COUNT(*) as request_count,
  SUM(aul.total_tokens) as total_tokens,
  SUM(aul.cost_usd) as total_cost_usd,
  array_agg(DISTINCT aul.provider) as providers_used,
  MAX(aul.created_at) as last_usage
FROM ai_usage_logs aul
JOIN auth.users u ON aul.user_id = u.id
WHERE aul.created_at >= DATE_TRUNC('month', NOW())
GROUP BY u.id, u.email, u.raw_user_meta_data->>'full_name'
ORDER BY total_cost_usd DESC;

-- Budget status
CREATE OR REPLACE VIEW ai_budget_status AS
SELECT 
  b.id,
  b.name,
  b.budget_type,
  b.limit_usd,
  b.period,
  b.alert_threshold,
  COALESCE(SUM(aul.cost_usd), 0) as spent_usd,
  b.limit_usd - COALESCE(SUM(aul.cost_usd), 0) as remaining_usd,
  (COALESCE(SUM(aul.cost_usd), 0) / b.limit_usd) as utilization,
  CASE 
    WHEN (COALESCE(SUM(aul.cost_usd), 0) / b.limit_usd) >= 1.0 THEN 'exceeded'
    WHEN (COALESCE(SUM(aul.cost_usd), 0) / b.limit_usd) >= b.alert_threshold THEN 'warning'
    ELSE 'normal'
  END as status,
  b.start_date,
  b.end_date,
  b.is_active
FROM ai_budgets b
LEFT JOIN ai_usage_logs aul ON 
  aul.created_at >= b.start_date 
  AND (b.end_date IS NULL OR aul.created_at <= b.end_date)
  AND (
    (b.budget_type = 'system') OR
    (b.budget_type = 'user' AND aul.user_id = b.target_id)
  )
WHERE b.is_active = true
GROUP BY b.id, b.name, b.budget_type, b.limit_usd, b.period, b.alert_threshold, b.start_date, b.end_date, b.is_active;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to log AI usage
CREATE OR REPLACE FUNCTION log_ai_usage(
  p_user_id UUID,
  p_provider TEXT,
  p_model TEXT,
  p_operation TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_duration_ms INTEGER DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_usage_id UUID;
  v_cost NUMERIC(10, 6);
  v_prompt_cost NUMERIC(10, 8);
  v_completion_cost NUMERIC(10, 8);
BEGIN
  -- Get pricing for this provider/model
  SELECT prompt_token_cost, completion_token_cost
  INTO v_prompt_cost, v_completion_cost
  FROM ai_provider_costs
  WHERE provider = p_provider 
    AND model = p_model
    AND effective_date <= NOW()
  ORDER BY effective_date DESC
  LIMIT 1;
  
  -- Calculate cost (default to 0 if pricing not found)
  v_cost := COALESCE(
    (p_prompt_tokens * v_prompt_cost) + (p_completion_tokens * v_completion_cost),
    0
  );
  
  -- Insert usage log
  INSERT INTO ai_usage_logs (
    user_id,
    provider,
    model,
    operation,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    cost_usd,
    duration_ms,
    success,
    error_message,
    metadata
  ) VALUES (
    p_user_id,
    p_provider,
    p_model,
    p_operation,
    p_prompt_tokens,
    p_completion_tokens,
    p_prompt_tokens + p_completion_tokens,
    v_cost,
    p_duration_ms,
    p_success,
    p_error_message,
    p_metadata
  ) RETURNING id INTO v_usage_id;
  
  RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current month cost for user
CREATE OR REPLACE FUNCTION get_user_monthly_cost(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_cost NUMERIC;
BEGIN
  SELECT COALESCE(SUM(cost_usd), 0)
  INTO v_cost
  FROM ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW());
  
  RETURN v_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at on ai_budgets
CREATE OR REPLACE FUNCTION update_ai_budget_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_budgets_updated_at
  BEFORE UPDATE ON ai_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_budget_timestamp();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budgets ENABLE ROW LEVEL SECURITY;

-- AI usage logs - admins can view all, users can view own
CREATE POLICY ai_usage_logs_select ON ai_usage_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
    )
  );

-- AI usage logs - users can insert own
CREATE POLICY ai_usage_logs_insert ON ai_usage_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- AI provider costs - anyone can view (for cost estimation)
CREATE POLICY ai_provider_costs_select ON ai_provider_costs
  FOR SELECT USING (true);

-- AI provider costs - only super admins can modify
CREATE POLICY ai_provider_costs_modify ON ai_provider_costs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
        AND ar.name = 'super_admin'
    )
  );

-- AI budgets - admins can view all
CREATE POLICY ai_budgets_select ON ai_budgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
    )
  );

-- AI budgets - only super admins can modify
CREATE POLICY ai_budgets_modify ON ai_budgets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.user_id = auth.uid()
        AND au.revoked_at IS NULL
        AND ar.name = 'super_admin'
    )
  );

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE ai_usage_logs IS 'Logs of all AI API calls with token usage and costs';
COMMENT ON TABLE ai_provider_costs IS 'Pricing information for AI providers and models';
COMMENT ON TABLE ai_budgets IS 'Budget limits and alerts for AI spending';
COMMENT ON FUNCTION log_ai_usage IS 'Log AI usage with automatic cost calculation';
COMMENT ON FUNCTION get_user_monthly_cost IS 'Get total AI cost for user in current month';
