import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BriefingSectionId, AIBriefingResponse } from '../types';

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
