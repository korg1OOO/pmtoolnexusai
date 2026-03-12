
CREATE TABLE IF NOT EXISTS public.ai_interaction_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT,
    query_summary TEXT,
    response_time_ms INTEGER,
    tokens INTEGER,
    provider TEXT,
    model TEXT,
    feedback_score INTEGER,
    feedback_text TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_interaction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view interaction logs"
ON public.ai_interaction_logs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert interaction logs"
ON public.ai_interaction_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update interaction logs"
ON public.ai_interaction_logs FOR UPDATE
USING (auth.uid() IS NOT NULL);

NOTIFY pgrst, 'reload schema';
