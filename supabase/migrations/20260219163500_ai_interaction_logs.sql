-- Create AI Interaction Logs table for performance analytics and feedback

CREATE TABLE IF NOT EXISTS public.ai_interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    query_summary TEXT, -- Truncated or redacted query for context
    response_time_ms INTEGER,
    tokens_total INTEGER,
    provider TEXT,
    model TEXT,
    feedback_score SMALLINT CHECK (feedback_score >= 1 AND feedback_score <= 5),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_ai_logs_agent_id ON public.ai_interaction_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON public.ai_interaction_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feedback_score ON public.ai_interaction_logs(feedback_score);

-- RLS
ALTER TABLE public.ai_interaction_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert their own AI logs"
  ON public.ai_interaction_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own logs
CREATE POLICY "Users can view their own AI logs"
  ON public.ai_interaction_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own logs (for adding feedback later)
CREATE POLICY "Users can update their own AI logs"
  ON public.ai_interaction_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Admins can view all logs
CREATE POLICY "Admins can view all AI logs"
  ON public.ai_interaction_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
