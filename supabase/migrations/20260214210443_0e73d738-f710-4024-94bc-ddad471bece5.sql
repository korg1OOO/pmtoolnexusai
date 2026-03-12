
-- Create additional missing tables

-- ml_learning_velocity
CREATE TABLE IF NOT EXISTS public.ml_learning_velocity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  patterns_created integer NOT NULL DEFAULT 0,
  patterns_optimized integer NOT NULL DEFAULT 0,
  patterns_pruned integer NOT NULL DEFAULT 0,
  avg_success_rate numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ml_learning_velocity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_ml_learning_velocity" ON public.ml_learning_velocity FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ml_learning_patterns
CREATE TABLE IF NOT EXISTS public.ml_learning_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type text NOT NULL,
  pattern_data jsonb,
  success_rate numeric NOT NULL DEFAULT 0,
  application_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ml_learning_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all_ml_learning_patterns" ON public.ml_learning_patterns FOR ALL TO authenticated USING (true) WITH CHECK (true);
