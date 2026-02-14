
-- Create missing tables referenced by the codebase

-- 1. collaboration_spaces
CREATE TABLE IF NOT EXISTS public.collaboration_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.collaboration_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_collaboration_spaces" ON public.collaboration_spaces FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. ai_credits
CREATE TABLE IF NOT EXISTS public.ai_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  user_id uuid NOT NULL,
  total_credits numeric NOT NULL DEFAULT 0,
  used_credits numeric NOT NULL DEFAULT 0,
  available_credits numeric NOT NULL DEFAULT 0,
  low_balance_threshold numeric NOT NULL DEFAULT 10,
  auto_recharge_enabled boolean NOT NULL DEFAULT false,
  auto_recharge_amount numeric NOT NULL DEFAULT 500,
  auto_recharge_threshold numeric NOT NULL DEFAULT 50,
  last_recharged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_ai_credits" ON public.ai_credits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. ai_credit_purchases
CREATE TABLE IF NOT EXISTS public.ai_credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  user_id uuid NOT NULL,
  credits_purchased numeric NOT NULL,
  amount_paid numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_method text,
  payment_id text,
  payment_status text NOT NULL DEFAULT 'pending',
  purchased_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz
);
ALTER TABLE public.ai_credit_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_ai_credit_purchases" ON public.ai_credit_purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. ai_credit_adjustments
CREATE TABLE IF NOT EXISTS public.ai_credit_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  reason text,
  adjusted_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_credit_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_ai_credit_adjustments" ON public.ai_credit_adjustments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. ai_credit_pricing
CREATE TABLE IF NOT EXISTS public.ai_credit_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name text NOT NULL,
  credits numeric NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  discount_percentage numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  description text
);
ALTER TABLE public.ai_credit_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_ai_credit_pricing" ON public.ai_credit_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. ml_auto_learning_config
CREATE TABLE IF NOT EXISTS public.ml_auto_learning_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  min_feedbacks_for_pattern integer NOT NULL DEFAULT 3,
  min_success_rate_threshold numeric NOT NULL DEFAULT 0.7,
  pruning_enabled boolean NOT NULL DEFAULT false,
  optimization_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ml_auto_learning_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_ml_auto_learning_config" ON public.ml_auto_learning_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default config
INSERT INTO public.ml_auto_learning_config (enabled, min_feedbacks_for_pattern, min_success_rate_threshold, pruning_enabled, optimization_enabled)
VALUES (false, 3, 0.7, false, false);

-- 7. password_policies
CREATE TABLE IF NOT EXISTS public.password_policies (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  min_length integer NOT NULL DEFAULT 8,
  require_uppercase boolean NOT NULL DEFAULT true,
  require_lowercase boolean NOT NULL DEFAULT true,
  require_numbers boolean NOT NULL DEFAULT true,
  require_special_chars boolean NOT NULL DEFAULT true,
  password_expiry_days integer NOT NULL DEFAULT 90,
  prevent_reuse_count integer NOT NULL DEFAULT 5,
  max_login_attempts integer NOT NULL DEFAULT 5,
  lockout_duration_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.password_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_password_policies" ON public.password_policies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default policy
INSERT INTO public.password_policies (id, min_length, require_uppercase, require_lowercase, require_numbers, require_special_chars)
VALUES ('00000000-0000-0000-0000-000000000001', 8, true, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- 8. security_audit_logs
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  user_id uuid,
  user_email text,
  ip_address text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_security_audit_logs" ON public.security_audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. user_tenants
CREATE TABLE IF NOT EXISTS public.user_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id text NOT NULL DEFAULT 'default',
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_user_tenants" ON public.user_tenants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. backup_jobs
CREATE TABLE IF NOT EXISTS public.backup_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL DEFAULT 'full',
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  file_size bigint,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_backup_jobs" ON public.backup_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. Add missing columns to ml_predictions
ALTER TABLE public.ml_predictions ADD COLUMN IF NOT EXISTS prediction jsonb;
ALTER TABLE public.ml_predictions ADD COLUMN IF NOT EXISTS confidence numeric;
ALTER TABLE public.ml_predictions ADD COLUMN IF NOT EXISTS user_rating integer;
ALTER TABLE public.ml_predictions ADD COLUMN IF NOT EXISTS user_accepted boolean;
ALTER TABLE public.ml_predictions ADD COLUMN IF NOT EXISTS user_modified boolean;
ALTER TABLE public.ml_predictions ADD COLUMN IF NOT EXISTS feedback_notes text;
ALTER TABLE public.ml_predictions ADD COLUMN IF NOT EXISTS input_data jsonb;
ALTER TABLE public.ml_predictions ADD COLUMN IF NOT EXISTS actual_outcome jsonb;
ALTER TABLE public.ml_predictions ADD COLUMN IF NOT EXISTS user_feedback_data jsonb;
