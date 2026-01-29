import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActivePresentation {
  id: string;
  user_id: string;
  presentation_id: string;
  activated_at: string;
}

export function useActivePresentation() {
  const [activePresentation, setActivePresentation] = useState<ActivePresentation | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchActivePresentation = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActivePresentation(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('active_presentations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setActivePresentation(data);
    } catch (error) {
      console.error('Error fetching active presentation:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivePresentation();

    // Subscribe to changes
    const channel = supabase
      .channel('active-presentation-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_presentations',
        },
        () => {
          fetchActivePresentation();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActivePresentation]);

  const setActivePresentationId = async (presentationId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to activate a presentation',
          variant: 'destructive',
        });
        return false;
      }

      // Upsert to handle both insert and update
      const { error } = await supabase
        .from('active_presentations')
        .upsert(
          {
            user_id: user.id,
            presentation_id: presentationId,
            activated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) throw error;

      toast({
        title: 'Presentation Activated',
        description: 'Live components will now refresh automatically',
      });

      return true;
    } catch (error) {
      console.error('Error setting active presentation:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate presentation',
        variant: 'destructive',
      });
      return false;
    }
  };

  const clearActivePresentation = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('active_presentations')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setActivePresentation(null);
      return true;
    } catch (error) {
      console.error('Error clearing active presentation:', error);
      return false;
    }
  };

  const isPresentation = (presentationId: string): boolean => {
    return activePresentation?.presentation_id === presentationId;
  };

  return {
    activePresentation,
    loading,
    setActivePresentationId,
    clearActivePresentation,
    isPresentation,
    refetch: fetchActivePresentation,
  };
}
