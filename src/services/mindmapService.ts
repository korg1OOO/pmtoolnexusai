import { supabase } from '@/integrations/supabase/client';
import { MegaProject } from '@/types/mindmap';

export interface MindMapProject {
  id: string;
  user_id: string;
  workspace_id?: string;
  name: string;
  description?: string;
  data: MegaProject;
  overall_progress: number;
  created_at: string;
  updated_at: string;
  last_edited_at: string;
}

/**
 * Mind Map Service - Supabase integration for hierarchical projects
 */

export const mindmapService = {
  /**
   * Get all mind map projects for the current user
   */
  async getUserProjects(): Promise<MindMapProject[]> {
    const { data, error } = await supabase
      .from('mindmap_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching mind map projects:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      ...row,
      data: row.data as MegaProject,
    }));
  },

  /**
   * Get a single mind map project by ID
   */
  async getProjectById(id: string): Promise<MindMapProject | null> {
    const { data, error } = await supabase
      .from('mindmap_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching mind map project:', error);
      return null;
    }

    return {
      ...data,
      data: data.data as MegaProject,
    };
  },

  /**
   * Create a new mind map project
   */
  async createProject(project: {
    name: string;
    description?: string;
    data: MegaProject;
    workspace_id?: string;
  }): Promise<MindMapProject | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('mindmap_projects')
      .insert({
        user_id: user.id,
        workspace_id: project.workspace_id || null,
        name: project.name,
        description: project.description || null,
        data: project.data,
        overall_progress: project.data.overallProgress || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating mind map project:', error);
      return null;
    }

    return {
      ...data,
      data: data.data as MegaProject,
    };
  },

  /**
   * Update an existing mind map project
   */
  async updateProject(
    id: string,
    updates: {
      name?: string;
      description?: string;
      data?: MegaProject;
    }
  ): Promise<MindMapProject | null> {
    const updateData: any = { ...updates };

    if (updates.data) {
      updateData.overall_progress = updates.data.overallProgress || 0;
      updateData.data = updates.data;
      updateData.last_edited_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('mindmap_projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating mind map project:', error);
      return null;
    }

    return {
      ...data,
      data: data.data as MegaProject,
    };
  },

  /**
   * Delete a mind map project
   */
  async deleteProject(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('mindmap_projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting mind map project:', error);
      return false;
    }

    return true;
  },

  /**
   * Save current demo project (upsert by name for demo purposes)
   */
  async saveDemoProject(project: MegaProject): Promise<MindMapProject | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No user logged in, cannot save to Supabase');
      return null;
    }

    // Try to find existing demo project
    const { data: existing } = await supabase
      .from('mindmap_projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', project.name)
      .maybeSingle();

    if (existing?.id) {
      return this.updateProject(existing.id, {
        data: project,
      });
    } else {
      return this.createProject({
        name: project.name,
        description: project.description,
        data: project,
      });
    }
  },
};
