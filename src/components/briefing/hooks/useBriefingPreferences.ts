import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  BriefingPreferences,
  BriefingSectionId,
  DEFAULT_ENABLED_SECTIONS,
  DEFAULT_SECTION_ORDER,
} from '../types';

export function useBriefingPreferences(projectId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<BriefingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const query = supabase
        .from('briefing_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (projectId) {
        query.eq('project_id', projectId);
      } else {
        query.is('project_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          ...data,
          enabled_sections: data.enabled_sections as BriefingSectionId[],
          section_order: data.section_order as BriefingSectionId[],
        });
      } else {
        // Return default preferences (not yet saved)
        setPreferences({
          id: '',
          user_id: user.id,
          project_id: projectId,
          enabled_sections: DEFAULT_ENABLED_SECTIONS,
          section_order: DEFAULT_SECTION_ORDER,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching briefing preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load briefing preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, projectId, toast]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Save preferences
  const savePreferences = useCallback(
    async (enabledSections: BriefingSectionId[], sectionOrder: BriefingSectionId[]) => {
      if (!user?.id) return;

      setSaving(true);
      try {
        const { data, error } = await supabase
          .from('briefing_preferences')
          .upsert(
            {
              user_id: user.id,
              project_id: projectId,
              enabled_sections: enabledSections,
              section_order: sectionOrder,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,project_id',
            }
          )
          .select()
          .single();

        if (error) throw error;

        setPreferences({
          ...data,
          enabled_sections: data.enabled_sections as BriefingSectionId[],
          section_order: data.section_order as BriefingSectionId[],
        });

        toast({
          title: 'Saved',
          description: 'Briefing preferences updated',
        });
      } catch (error) {
        console.error('Error saving briefing preferences:', error);
        toast({
          title: 'Error',
          description: 'Failed to save preferences',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    },
    [user?.id, projectId, toast]
  );

  // Toggle section enabled/disabled
  const toggleSection = useCallback(
    (sectionId: BriefingSectionId) => {
      if (!preferences) return;

      const newEnabled = preferences.enabled_sections.includes(sectionId)
        ? preferences.enabled_sections.filter(id => id !== sectionId)
        : [...preferences.enabled_sections, sectionId];

      setPreferences(prev =>
        prev ? { ...prev, enabled_sections: newEnabled } : null
      );
    },
    [preferences]
  );

  // Reorder sections
  const reorderSections = useCallback(
    (newOrder: BriefingSectionId[]) => {
      setPreferences(prev =>
        prev ? { ...prev, section_order: newOrder } : null
      );
    },
    []
  );

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setPreferences(prev =>
      prev
        ? {
            ...prev,
            enabled_sections: DEFAULT_ENABLED_SECTIONS,
            section_order: DEFAULT_SECTION_ORDER,
          }
        : null
    );
  }, []);

  // Get ordered sections (enabled first, in order)
  const getOrderedSections = useCallback(() => {
    if (!preferences) return [];
    
    return preferences.section_order.filter(id =>
      preferences.enabled_sections.includes(id)
    );
  }, [preferences]);

  return {
    preferences,
    loading,
    saving,
    toggleSection,
    reorderSections,
    savePreferences,
    resetToDefaults,
    getOrderedSections,
    refetch: fetchPreferences,
  };
}
