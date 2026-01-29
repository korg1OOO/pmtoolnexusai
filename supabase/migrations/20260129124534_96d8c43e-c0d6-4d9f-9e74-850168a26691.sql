-- Create briefing_preferences table for storing user section preferences
CREATE TABLE public.briefing_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  enabled_sections JSONB NOT NULL DEFAULT '["critical-alerts", "ai-insights", "profit-loss", "schedule-slippage", "budget-analysis", "risk-assessment", "actions-due", "issues-summary", "meetings-today", "recent-decisions", "team-availability"]'::jsonb,
  section_order JSONB NOT NULL DEFAULT '["critical-alerts", "ai-insights", "profit-loss", "schedule-slippage", "budget-analysis", "risk-assessment", "actions-due", "issues-summary", "meetings-today", "recent-decisions", "team-availability", "communication-intelligence"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE public.briefing_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own briefing preferences"
ON public.briefing_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own briefing preferences"
ON public.briefing_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own briefing preferences"
ON public.briefing_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete their own briefing preferences"
ON public.briefing_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_briefing_preferences_updated_at
BEFORE UPDATE ON public.briefing_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();