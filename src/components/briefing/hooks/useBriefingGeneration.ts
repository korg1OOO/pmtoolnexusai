import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BriefingSectionId, AIBriefingResponse } from '../types';
import { logPrediction } from '@/services/mlPredictionService';

interface ProjectData {
  project?: Record<string, unknown>;
  tasks?: Record<string, unknown>[];
  risks?: Record<string, unknown>[];
  issues?: Record<string, unknown>[];
  actions?: Record<string, unknown>[];
  meetings?: Record<string, unknown>[];
  resources?: Record<string, unknown>[];
  financials?: Record<string, unknown>;
}

export function useBriefingGeneration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [briefingData, setBriefingData] = useState<AIBriefingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateBriefing = useCallback(
    async (
      projectId: string,
      enabledSections: BriefingSectionId[],
      projectData: ProjectData
    ) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'morning-briefing-generate',
          {
            body: {
              projectId,
              enabledSections,
              projectData,
            },
          }
        );

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setBriefingData(data);

        // Log this as an ML prediction for learning
        try {
          await logPrediction({
            project_id: projectId,
            prediction_type: 'morning_briefing',
            input_data: {
              enabled_sections: enabledSections,
              project_context: {
                tasks_count: projectData.tasks?.length || 0,
                risks_count: projectData.risks?.length || 0,
                issues_count: projectData.issues?.length || 0,
              },
            },
            prediction: data,
            confidence: 0.85, // Base confidence for briefing generation
          });
        } catch (mlError) {
          // Don't fail the briefing if ML logging fails
          console.warn('Failed to log ML prediction:', mlError);
        }

        toast({
          title: 'Briefing Generated',
          description: 'AI insights have been refreshed.',
        });

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate briefing';
        setError(message);
        toast({
          title: 'Generation Failed',
          description: message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const clearBriefing = useCallback(() => {
    setBriefingData(null);
    setError(null);
  }, []);

  return {
    loading,
    briefingData,
    error,
    generateBriefing,
    clearBriefing,
  };
}
