import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface SlideShape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'star' | 'callout';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  zIndex: number;
}

export interface SlideImage {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  alt: string;
}

export interface SlideChart {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'donut' | 'area';
  dataSource: string;
  title: string;
}

export interface PresentationSlide {
  id: string;
  presentation_id: string;
  title: string;
  template: string;
  content: Record<string, unknown>;
  html_content: string;
  speaker_notes: string;
  transition: {
    type: string;
    duration: number;
    direction?: string;
  };
  background: {
    type: 'solid' | 'gradient' | 'image';
    color?: string;
    gradient?: string;
    imageUrl?: string;
  };
  shapes: SlideShape[];
  images: SlideImage[];
  charts: SlideChart[];
  embedded_components?: Array<{
    id: string;
    componentId: string;
    componentType: string;
    sourceModule: string;
    position: { x: number; y: number; width: number; height: number };
    dataSnapshot: Record<string, unknown> | null;
    snapshotAt: string | null;
    isLive: boolean;
  }>;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface RawSlide {
  id: string;
  presentation_id: string;
  title: string;
  template: string;
  content: Json;
  html_content: string;
  speaker_notes: string;
  transition: Json;
  background: Json;
  shapes: Json;
  images: Json;
  charts: Json;
  embedded_components: Json;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const parseSlide = (raw: RawSlide): PresentationSlide => ({
  ...raw,
  content: (raw.content as Record<string, unknown>) || {},
  transition: (raw.transition as PresentationSlide['transition']) || { type: 'fade', duration: 0.5 },
  background: (raw.background as PresentationSlide['background']) || { type: 'solid', color: '#ffffff' },
  shapes: (Array.isArray(raw.shapes) ? raw.shapes : []) as unknown as SlideShape[],
  images: (Array.isArray(raw.images) ? raw.images : []) as unknown as SlideImage[],
  charts: (Array.isArray(raw.charts) ? raw.charts : []) as unknown as SlideChart[],
  embedded_components: (Array.isArray(raw.embedded_components) ? raw.embedded_components : []) as unknown as PresentationSlide['embedded_components'],
});

export function useSlides(presentationId: string | undefined) {
  const [slides, setSlides] = useState<PresentationSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchSlides = useCallback(async () => {
    if (!presentationId) return;

    try {
      const { data, error } = await supabase
        .from('presentation_slides')
        .select('*')
        .eq('presentation_id', presentationId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSlides((data as RawSlide[]).map(parseSlide));
    } catch (error) {
      console.error('Error fetching slides:', error);
      toast({
        title: 'Error',
        description: 'Failed to load slides',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [presentationId, toast]);

  useEffect(() => {
    fetchSlides();

    if (!presentationId) return;

    const channel = supabase
      .channel(`slides-${presentationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presentation_slides',
          filter: `presentation_id=eq.${presentationId}`,
        },
        () => {
          fetchSlides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [presentationId, fetchSlides]);

  const createSlide = async (
    template: string = 'blank',
    title: string = 'New Slide',
    content: Record<string, unknown> = {}
  ): Promise<PresentationSlide | null> => {
    if (!presentationId) return null;

    try {
      const maxOrder = slides.reduce((max, s) => Math.max(max, s.sort_order), -1);

      const insertData = {
        presentation_id: presentationId,
        title,
        template,
        content: content as unknown as Json,
        sort_order: maxOrder + 1,
      };

      const { data, error } = await supabase
        .from('presentation_slides')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return parseSlide(data as RawSlide);
    } catch (error) {
      console.error('Error creating slide:', error);
      toast({
        title: 'Error',
        description: 'Failed to create slide',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSlide = async (
    id: string,
    updates: Partial<Omit<PresentationSlide, 'id' | 'presentation_id' | 'created_at'>>
  ): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.template !== undefined) dbUpdates.template = updates.template;
      if (updates.content !== undefined) dbUpdates.content = updates.content as unknown as Json;
      if (updates.html_content !== undefined) dbUpdates.html_content = updates.html_content;
      if (updates.speaker_notes !== undefined) dbUpdates.speaker_notes = updates.speaker_notes;
      if (updates.transition !== undefined) dbUpdates.transition = updates.transition as unknown as Json;
      if (updates.background !== undefined) dbUpdates.background = updates.background as unknown as Json;
      if (updates.shapes !== undefined) dbUpdates.shapes = updates.shapes as unknown as Json;
      if (updates.images !== undefined) dbUpdates.images = updates.images as unknown as Json;
      if (updates.charts !== undefined) dbUpdates.charts = updates.charts as unknown as Json;
      if (updates.sort_order !== undefined) dbUpdates.sort_order = updates.sort_order;

      const { error } = await supabase
        .from('presentation_slides')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating slide:', error);
      toast({
        title: 'Error',
        description: 'Failed to update slide',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Debounced save for auto-save functionality
  const saveSlideDebounced = useCallback((id: string, updates: Partial<PresentationSlide>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateSlide(id, updates);
    }, 1000);
  }, []);

  const deleteSlide = async (id: string): Promise<boolean> => {
    try {
      const slideToDelete = slides.find(s => s.id === id);
      if (!slideToDelete) return false;

      const { error } = await supabase
        .from('presentation_slides')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reorder remaining slides
      const remainingSlides = slides.filter(s => s.id !== id);
      for (let i = 0; i < remainingSlides.length; i++) {
        if (remainingSlides[i].sort_order !== i) {
          await supabase
            .from('presentation_slides')
            .update({ sort_order: i })
            .eq('id', remainingSlides[i].id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete slide',
        variant: 'destructive',
      });
      return false;
    }
  };

  const duplicateSlide = async (id: string): Promise<PresentationSlide | null> => {
    const original = slides.find(s => s.id === id);
    if (!original || !presentationId) return null;

    try {
      const insertData = {
        presentation_id: presentationId,
        title: `${original.title} (Copy)`,
        template: original.template,
        content: original.content as unknown as Json,
        html_content: original.html_content,
        speaker_notes: original.speaker_notes,
        transition: original.transition as unknown as Json,
        background: original.background as unknown as Json,
        shapes: original.shapes as unknown as Json,
        images: original.images as unknown as Json,
        charts: original.charts as unknown as Json,
        sort_order: original.sort_order + 1,
      };

      const { data, error } = await supabase
        .from('presentation_slides')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Shift subsequent slides down
      const slidesToShift = slides.filter(s => s.sort_order > original.sort_order);
      for (const slide of slidesToShift) {
        await supabase
          .from('presentation_slides')
          .update({ sort_order: slide.sort_order + 1 })
          .eq('id', slide.id);
      }

      return parseSlide(data as RawSlide);
    } catch (error) {
      console.error('Error duplicating slide:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate slide',
        variant: 'destructive',
      });
      return null;
    }
  };

  const reorderSlides = async (slideIds: string[]): Promise<boolean> => {
    try {
      for (let i = 0; i < slideIds.length; i++) {
        await supabase
          .from('presentation_slides')
          .update({ sort_order: i })
          .eq('id', slideIds[i]);
      }

      return true;
    } catch (error) {
      console.error('Error reordering slides:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder slides',
        variant: 'destructive',
      });
      return false;
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${presentationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('presentation-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('presentation-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
      return null;
    }
  };

  const addShape = async (slideId: string, shape: Omit<SlideShape, 'id'>): Promise<boolean> => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return false;

    const newShape: SlideShape = {
      ...shape,
      id: `shape-${Date.now()}`,
    };

    return updateSlide(slideId, {
      shapes: [...slide.shapes, newShape],
    });
  };

  const updateShape = async (slideId: string, shapeId: string, updates: Partial<SlideShape>): Promise<boolean> => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return false;

    const updatedShapes = slide.shapes.map(s =>
      s.id === shapeId ? { ...s, ...updates } : s
    );

    return updateSlide(slideId, { shapes: updatedShapes });
  };

  const deleteShape = async (slideId: string, shapeId: string): Promise<boolean> => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return false;

    const updatedShapes = slide.shapes.filter(s => s.id !== shapeId);
    return updateSlide(slideId, { shapes: updatedShapes });
  };

  return {
    slides,
    loading,
    createSlide,
    updateSlide,
    saveSlideDebounced,
    deleteSlide,
    duplicateSlide,
    reorderSlides,
    uploadImage,
    addShape,
    updateShape,
    deleteShape,
    refetch: fetchSlides,
  };
}
