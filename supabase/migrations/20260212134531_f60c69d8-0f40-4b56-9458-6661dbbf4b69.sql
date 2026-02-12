
-- =============================================
-- COMPREHENSIVE MIGRATION: All missing tables
-- =============================================

-- 1. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    category TEXT,
    user_id UUID,
    user_email TEXT,
    assigned_to TEXT,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_replies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_id UUID,
    user_email TEXT,
    is_staff BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ML Tables
CREATE TABLE IF NOT EXISTS public.ml_training_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    snapshot_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    snapshot_data JSONB,
    data_quality_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ml_models (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    model_type TEXT,
    version TEXT,
    status TEXT DEFAULT 'active',
    accuracy NUMERIC,
    metadata JSONB,
    training_data_count INTEGER DEFAULT 0,
    last_trained_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ml_predictions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    model_id UUID REFERENCES public.ml_models(id) ON DELETE SET NULL,
    prediction_type TEXT,
    prediction_data JSONB,
    confidence_score NUMERIC,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ml_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    alert_type TEXT,
    severity TEXT DEFAULT 'medium',
    title TEXT,
    message TEXT,
    metadata JSONB,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ml_retraining_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id UUID REFERENCES public.ml_models(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    trigger_reason TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metrics JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    channel TEXT DEFAULT 'in_app',
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    channel TEXT NOT NULL,
    category TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    settings JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    channel TEXT DEFAULT 'email',
    variables JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    plan_id TEXT,
    tier TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    billing_cycle TEXT DEFAULT 'monthly',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    tier TEXT NOT NULL,
    price_monthly NUMERIC DEFAULT 0,
    price_annual NUMERIC DEFAULT 0,
    features JSONB,
    limits JSONB,
    active BOOLEAN DEFAULT true,
    stripe_price_id_monthly TEXT,
    stripe_price_id_annual TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_features (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT,
    tiers JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending',
    stripe_invoice_id TEXT,
    invoice_url TEXT,
    pdf_url TEXT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Marketing
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'draft',
    channel TEXT,
    subject TEXT,
    content TEXT,
    template_id TEXT,
    audience_filter JSONB,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    stats JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    user_id UUID,
    email TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Affiliates
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    code TEXT UNIQUE,
    name TEXT,
    email TEXT,
    status TEXT DEFAULT 'active',
    commission_rate NUMERIC DEFAULT 0.1,
    total_earnings NUMERIC DEFAULT 0,
    total_referrals INTEGER DEFAULT 0,
    payout_method TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
    referred_user_id UUID,
    status TEXT DEFAULT 'pending',
    amount NUMERIC DEFAULT 0,
    commission NUMERIC DEFAULT 0,
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Backups
CREATE TABLE IF NOT EXISTS public.backups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    type TEXT DEFAULT 'full',
    status TEXT DEFAULT 'pending',
    size_bytes BIGINT,
    storage_path TEXT,
    metadata JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. AI Provider Settings
CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL,
    model TEXT,
    api_key_configured BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    settings JSONB,
    rate_limits JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Sync History
CREATE TABLE IF NOT EXISTS public.sync_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    sync_type TEXT DEFAULT 'full',
    status TEXT DEFAULT 'pending',
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Admin Logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type TEXT NOT NULL,
    user_id UUID,
    user_email TEXT,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'running',
    type TEXT,
    uptime_percentage NUMERIC DEFAULT 100,
    last_check_at TIMESTAMPTZ,
    health_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Content Management
CREATE TABLE IF NOT EXISTS public.content_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT,
    type TEXT DEFAULT 'page',
    status TEXT DEFAULT 'draft',
    content TEXT,
    metadata JSONB,
    author_id UUID,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Health Checks
CREATE TABLE IF NOT EXISTS public.health_checks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL,
    status TEXT DEFAULT 'healthy',
    response_time_ms INTEGER,
    details JSONB,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. AI Usage & Cost
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    provider TEXT,
    model TEXT,
    operation TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost NUMERIC DEFAULT 0,
    latency_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_cost_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    provider TEXT,
    total_cost NUMERIC DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    request_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Email Templates
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT,
    html_content TEXT,
    text_content TEXT,
    category TEXT,
    variables JSONB,
    active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Stripe Integration
CREATE TABLE IF NOT EXISTS public.stripe_customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE,
    stripe_customer_id TEXT UNIQUE,
    email TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    plan_id TEXT,
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. FAQs table (for PublicFAQs page)
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Deliverables table
CREATE TABLE IF NOT EXISTS public.deliverables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    acceptance_criteria TEXT,
    assignee_id UUID,
    assignee_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_retraining_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cost_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- Permissive RLS policies (authenticated users can access all rows for now)
-- Support Tickets
CREATE POLICY "auth_support_tickets" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_ticket_replies" ON public.ticket_replies FOR ALL USING (true) WITH CHECK (true);

-- ML Tables
CREATE POLICY "auth_ml_training_data" ON public.ml_training_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_ml_models" ON public.ml_models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_ml_predictions" ON public.ml_predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_ml_alerts" ON public.ml_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_ml_retraining_jobs" ON public.ml_retraining_jobs FOR ALL USING (true) WITH CHECK (true);

-- Notifications
CREATE POLICY "auth_notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_notification_preferences" ON public.notification_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_notification_templates" ON public.notification_templates FOR ALL USING (true) WITH CHECK (true);

-- Subscriptions
CREATE POLICY "auth_subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_subscription_plans" ON public.subscription_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_subscription_features" ON public.subscription_features FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

-- Marketing
CREATE POLICY "auth_marketing_campaigns" ON public.marketing_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_campaign_events" ON public.campaign_events FOR ALL USING (true) WITH CHECK (true);

-- Affiliates
CREATE POLICY "auth_affiliates" ON public.affiliates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_affiliate_referrals" ON public.affiliate_referrals FOR ALL USING (true) WITH CHECK (true);

-- Backups
CREATE POLICY "auth_backups" ON public.backups FOR ALL USING (true) WITH CHECK (true);

-- AI & Admin
CREATE POLICY "auth_ai_provider_settings" ON public.ai_provider_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_sync_history" ON public.sync_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_admin_logs" ON public.admin_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_admin_services" ON public.admin_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_content_items" ON public.content_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_health_checks" ON public.health_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_ai_usage_logs" ON public.ai_usage_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_ai_cost_records" ON public.ai_cost_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_email_templates" ON public.email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_stripe_customers" ON public.stripe_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_stripe_subscriptions" ON public.stripe_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_faqs" ON public.faqs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_deliverables" ON public.deliverables FOR ALL USING (true) WITH CHECK (true);
