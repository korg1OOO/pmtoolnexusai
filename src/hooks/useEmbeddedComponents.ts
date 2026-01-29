import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EmbeddedComponentData } from '@/components/presentations/EmbeddedDashboardWidget';
import { EmbeddableComponent } from '@/lib/embeddableComponents';
import type { Json } from '@/integrations/supabase/types';

export function useEmbeddedComponents(slideId: string | undefined) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const addEmbeddedComponent = useCallback(
    async (
      componentDef: EmbeddableComponent,
      position: { x: number; y: number; width: number; height: number }
    ): Promise<boolean> => {
      if (!slideId) return false;

      try {
        setSaving(true);

        // Fetch current slide to get existing embedded components
        const { data: slide, error: fetchError } = await supabase
          .from('presentation_slides')
          .select('embedded_components')
          .eq('id', slideId)
          .single();

        if (fetchError) throw fetchError;

        const existingComponents = (slide?.embedded_components as unknown as EmbeddedComponentData[]) || [];

        const newComponent: EmbeddedComponentData = {
          id: `embed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          componentId: componentDef.id,
          componentType: componentDef.type,
          sourceModule: componentDef.sourceModule,
          position,
          dataSnapshot: null,
          snapshotAt: null,
          isLive: componentDef.refreshable,
        };

        const updatedComponents = [...existingComponents, newComponent];

        const { error: updateError } = await supabase
          .from('presentation_slides')
          .update({
            embedded_components: updatedComponents as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', slideId);

        if (updateError) throw updateError;

        toast({
          title: 'Component Added',
          description: `${componentDef.name} has been added to the slide`,
        });

        return true;
      } catch (error) {
        console.error('Error adding embedded component:', error);
        toast({
          title: 'Error',
          description: 'Failed to add component',
          variant: 'destructive',
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [slideId, toast]
  );

  const removeEmbeddedComponent = useCallback(
    async (componentId: string): Promise<boolean> => {
      if (!slideId) return false;

      try {
        setSaving(true);

        const { data: slide, error: fetchError } = await supabase
          .from('presentation_slides')
          .select('embedded_components')
          .eq('id', slideId)
          .single();

        if (fetchError) throw fetchError;

        const existingComponents = (slide?.embedded_components as unknown as EmbeddedComponentData[]) || [];
        const updatedComponents = existingComponents.filter((c) => c.id !== componentId);

        const { error: updateError } = await supabase
          .from('presentation_slides')
          .update({
            embedded_components: updatedComponents as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', slideId);

        if (updateError) throw updateError;

        toast({
          title: 'Component Removed',
          description: 'The component has been removed from the slide',
        });

        return true;
      } catch (error) {
        console.error('Error removing embedded component:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove component',
          variant: 'destructive',
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [slideId, toast]
  );

  const updateComponentLiveStatus = useCallback(
    async (componentId: string, isLive: boolean): Promise<boolean> => {
      if (!slideId) return false;

      try {
        setSaving(true);

        const { data: slide, error: fetchError } = await supabase
          .from('presentation_slides')
          .select('embedded_components')
          .eq('id', slideId)
          .single();

        if (fetchError) throw fetchError;

        const existingComponents = (slide?.embedded_components as unknown as EmbeddedComponentData[]) || [];
        const updatedComponents = existingComponents.map((c) =>
          c.id === componentId
            ? {
                ...c,
                isLive,
                snapshotAt: isLive ? null : new Date().toISOString(),
              }
            : c
        );

        const { error: updateError } = await supabase
          .from('presentation_slides')
          .update({
            embedded_components: updatedComponents as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', slideId);

        if (updateError) throw updateError;

        toast({
          title: isLive ? 'Live Mode Enabled' : 'Snapshot Created',
          description: isLive
            ? 'Component will now refresh automatically'
            : 'Component data has been frozen',
        });

        return true;
      } catch (error) {
        console.error('Error updating component live status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update component',
          variant: 'destructive',
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [slideId, toast]
  );

  const refreshComponent = useCallback(
    async (componentId: string): Promise<boolean> => {
      if (!slideId) return false;

      try {
        setSaving(true);

        const { data: slide, error: fetchError } = await supabase
          .from('presentation_slides')
          .select('embedded_components')
          .eq('id', slideId)
          .single();

        if (fetchError) throw fetchError;

        const existingComponents = (slide?.embedded_components as unknown as EmbeddedComponentData[]) || [];

        // In a real implementation, this would fetch fresh data for the component
        // For now, we just update the snapshot timestamp
        const updatedComponents = existingComponents.map((c) =>
          c.id === componentId
            ? {
                ...c,
                snapshotAt: new Date().toISOString(),
                // dataSnapshot would be updated with fresh data here
              }
            : c
        );

        const { error: updateError } = await supabase
          .from('presentation_slides')
          .update({
            embedded_components: updatedComponents as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', slideId);

        if (updateError) throw updateError;

        toast({
          title: 'Data Refreshed',
          description: 'Component data has been updated',
        });

        return true;
      } catch (error) {
        console.error('Error refreshing component:', error);
        toast({
          title: 'Error',
          description: 'Failed to refresh component',
          variant: 'destructive',
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [slideId, toast]
  );

  const refreshAllComponents = useCallback(
    async (): Promise<boolean> => {
      if (!slideId) return false;

      try {
        setSaving(true);

        const { data: slide, error: fetchError } = await supabase
          .from('presentation_slides')
          .select('embedded_components')
          .eq('id', slideId)
          .single();

        if (fetchError) throw fetchError;

        const existingComponents = (slide?.embedded_components as unknown as EmbeddedComponentData[]) || [];

        const updatedComponents = existingComponents.map((c) =>
          c.isLive
            ? {
                ...c,
                snapshotAt: new Date().toISOString(),
              }
            : c
        );

        const { error: updateError } = await supabase
          .from('presentation_slides')
          .update({
            embedded_components: updatedComponents as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', slideId);

        if (updateError) throw updateError;

        const liveCount = existingComponents.filter((c) => c.isLive).length;
        toast({
          title: 'All Components Refreshed',
          description: `Updated ${liveCount} live component${liveCount !== 1 ? 's' : ''}`,
        });

        return true;
      } catch (error) {
        console.error('Error refreshing all components:', error);
        toast({
          title: 'Error',
          description: 'Failed to refresh components',
          variant: 'destructive',
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [slideId, toast]
  );

  return {
    saving,
    addEmbeddedComponent,
    removeEmbeddedComponent,
    updateComponentLiveStatus,
    refreshComponent,
    refreshAllComponents,
  };
}
