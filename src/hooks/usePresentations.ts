import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface Presentation {
  id: string;
  project_id: string;
  folder_id: string | null;
  title: string;
  template: string;
  theme: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  slide_master: {
    showHeader: boolean;
    showFooter: boolean;
    showPageNumbers: boolean;
    headerText?: string;
    footerText?: string;
    logoUrl?: string;
  };
  transitions: {
    type: string;
    duration: number;
    direction?: string;
  };
  created_by: string | null;
  created_by_name: string | null;
  is_shared: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface RawPresentation {
  id: string;
  project_id: string;
  folder_id: string | null;
  title: string;
  template: string;
  theme: Json;
  slide_master: Json;
  transitions: Json;
  created_by: string | null;
  created_by_name: string | null;
  is_shared: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

const parsePresentation = (raw: RawPresentation): Presentation => ({
  ...raw,
  theme: (raw.theme as Presentation['theme']) || { primaryColor: '#3b82f6', accentColor: '#10b981', fontFamily: 'Inter' },
  slide_master: (raw.slide_master as Presentation['slide_master']) || { showHeader: true, showFooter: true, showPageNumbers: true },
  transitions: (raw.transitions as Presentation['transitions']) || { type: 'fade', duration: 0.5 },
});

export function usePresentations(projectId: string | undefined, folderId?: string | null) {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPresentations = useCallback(async () => {
    if (!projectId) return;

    try {
      let query = supabase
        .from('presentations')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (folderId !== undefined) {
        if (folderId === null) {
          query = query.is('folder_id', null);
        } else {
          query = query.eq('folder_id', folderId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setPresentations((data as RawPresentation[]).map(parsePresentation));
    } catch (error) {
      console.error('Error fetching presentations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load presentations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, folderId, toast]);

  useEffect(() => {
    fetchPresentations();

    if (!projectId) return;

    const channel = supabase
      .channel(`presentations-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presentations',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchPresentations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchPresentations]);

  const createPresentation = async (
    title: string,
    template: string = 'custom',
    folderId: string | null = null
  ): Promise<Presentation | null> => {
    if (!projectId) return null;

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('presentations')
        .insert({
          project_id: projectId,
          folder_id: folderId,
          title,
          template,
          created_by: userData?.user?.id || null,
          created_by_name: userData?.user?.email || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Presentation created',
        description: `${title} created successfully`,
      });

      return parsePresentation(data as RawPresentation);
    } catch (error) {
      console.error('Error creating presentation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create presentation',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updatePresentation = async (
    id: string,
    updates: Partial<Omit<Presentation, 'id' | 'project_id' | 'created_at'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('presentations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating presentation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update presentation',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deletePresentation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('presentations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Presentation deleted',
        description: 'Presentation deleted successfully',
      });

      return true;
    } catch (error) {
      console.error('Error deleting presentation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete presentation',
        variant: 'destructive',
      });
      return false;
    }
  };

  const duplicatePresentation = async (id: string): Promise<Presentation | null> => {
    const original = presentations.find(p => p.id === id);
    if (!original || !projectId) return null;

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('presentations')
        .insert({
          project_id: projectId,
          folder_id: original.folder_id,
          title: `${original.title} (Copy)`,
          template: original.template,
          theme: original.theme,
          slide_master: original.slide_master,
          transitions: original.transitions,
          created_by: userData?.user?.id || null,
          created_by_name: userData?.user?.email || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Copy slides
      const { data: slides } = await supabase
        .from('presentation_slides')
        .select('*')
        .eq('presentation_id', id);

      if (slides && slides.length > 0) {
        await supabase.from('presentation_slides').insert(
          slides.map(slide => ({
            presentation_id: data.id,
            title: slide.title,
            template: slide.template,
            content: slide.content,
            html_content: slide.html_content,
            speaker_notes: slide.speaker_notes,
            transition: slide.transition,
            background: slide.background,
            shapes: slide.shapes,
            images: slide.images,
            charts: slide.charts,
            sort_order: slide.sort_order,
          }))
        );
      }

      toast({
        title: 'Presentation duplicated',
        description: `${original.title} duplicated successfully`,
      });

      return parsePresentation(data as RawPresentation);
    } catch (error) {
      console.error('Error duplicating presentation:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate presentation',
        variant: 'destructive',
      });
      return null;
    }
  };

  const movePresentation = async (id: string, newFolderId: string | null): Promise<boolean> => {
    return updatePresentation(id, { folder_id: newFolderId });
  };

  return {
    presentations,
    loading,
    createPresentation,
    updatePresentation,
    deletePresentation,
    duplicatePresentation,
    movePresentation,
    refetch: fetchPresentations,
  };
}
