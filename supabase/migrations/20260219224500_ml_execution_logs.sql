-- Migration: ml_execution_logs
-- Tracks individual ML prediction execution details for performance monitoring.
-- Enables real error_count, cache_hit_rate, and avg_execution_time_ms in mlModelOperations.ts

CREATE TABLE IF NOT EXISTS public.ml_execution_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id uuid REFERENCES public.ml_predictions(id) ON DELETE SET NULL,
    prediction_type text NOT NULL,                  -- 'risk' | 'cost' | 'schedule' | 'resource'
    execution_time_ms integer NOT NULL DEFAULT 0,   -- wall-clock time for this prediction
    cache_hit boolean NOT NULL DEFAULT false,        -- true if served from cache, not re-computed
    error_occurred boolean NOT NULL DEFAULT false,   -- true if the prediction threw an error
    error_message text,                             -- error details if error_occurred = true
    model_version text,                             -- which model version was used
    input_hash text,                                -- hash of input features (for cache keying)
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for the queries in mlModelOperations.ts
CREATE INDEX IF NOT EXISTS ml_execution_logs_type_created_at
    ON public.ml_execution_logs (prediction_type, created_at);

CREATE INDEX IF NOT EXISTS ml_execution_logs_prediction_id
    ON public.ml_execution_logs (prediction_id);

-- Row Level Security: only accessible via service role (Edge Functions)
ALTER TABLE public.ml_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to ml_execution_logs"
    ON public.ml_execution_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can read (for admin dashboards)
CREATE POLICY "Authenticated users can read ml_execution_logs"
    ON public.ml_execution_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- Optional: also track retraining schedules if not already present
CREATE TABLE IF NOT EXISTS public.ml_retraining_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type text NOT NULL UNIQUE,    -- 'risk' | 'cost' | 'schedule'
    frequency text NOT NULL DEFAULT 'monthly',
    next_run timestamptz NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    last_run timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ml_retraining_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to ml_retraining_schedules"
    ON public.ml_retraining_schedules
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read ml_retraining_schedules"
    ON public.ml_retraining_schedules
    FOR SELECT
    TO authenticated
    USING (true);

-- Seed default schedules (idempotent)
INSERT INTO public.ml_retraining_schedules (model_type, frequency, next_run, enabled)
VALUES
    ('risk',     'monthly', date_trunc('month', now()) + interval '1 month' + interval '3 hours', true),
    ('cost',     'monthly', date_trunc('month', now()) + interval '1 month' + interval '3 hours', true),
    ('schedule', 'monthly', date_trunc('month', now()) + interval '1 month' + interval '3 hours', true)
ON CONFLICT (model_type) DO NOTHING;
