import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DocumentFolder {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FolderTreeNode extends DocumentFolder {
  children: FolderTreeNode[];
  documentCount: number;
}

export function useDocumentFolders(projectId: string | undefined) {
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFolders = useCallback(async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('document_folders')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setFolders(data as DocumentFolder[]);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load folders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchFolders();

    // Real-time subscription
    if (!projectId) return;

    const channel = supabase
      .channel(`document-folders-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_folders',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchFolders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchFolders]);

  const buildFolderTree = (documentCounts: Record<string, number> = {}): FolderTreeNode[] => {
    const folderMap = new Map<string, FolderTreeNode>();
    
    // Initialize all folders with children array
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        documentCount: documentCounts[folder.id] || 0,
      });
    });

    const rootFolders: FolderTreeNode[] = [];

    // Build tree structure
    folders.forEach(folder => {
      const node = folderMap.get(folder.id)!;
      if (folder.parent_id && folderMap.has(folder.parent_id)) {
        folderMap.get(folder.parent_id)!.children.push(node);
      } else {
        rootFolders.push(node);
      }
    });

    return rootFolders;
  };

  const createFolder = async (
    name: string,
    parentId: string | null = null,
    color = 'blue'
  ): Promise<DocumentFolder | null> => {
    if (!projectId) return null;

    try {
      const maxOrder = folders.reduce((max, f) => Math.max(max, f.sort_order), 0);

      const { data, error } = await supabase
        .from('document_folders')
        .insert({
          project_id: projectId,
          parent_id: parentId,
          name,
          color,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Folder created',
        description: `${name} created successfully`,
      });

      return data as DocumentFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateFolder = async (
    id: string,
    updates: Partial<DocumentFolder>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('document_folders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Folder updated',
        description: 'Folder updated successfully',
      });

      return true;
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to update folder',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteFolder = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('document_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Folder deleted',
        description: 'Folder deleted successfully',
      });

      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete folder',
        variant: 'destructive',
      });
      return false;
    }
  };

  const renameFolder = async (id: string, newName: string): Promise<boolean> => {
    return updateFolder(id, { name: newName });
  };

  const moveFolder = async (id: string, newParentId: string | null): Promise<boolean> => {
    // Prevent moving folder into itself or its descendants
    const folder = folders.find(f => f.id === id);
    if (!folder) return false;

    const getDescendantIds = (parentId: string): string[] => {
      const children = folders.filter(f => f.parent_id === parentId);
      return children.flatMap(c => [c.id, ...getDescendantIds(c.id)]);
    };

    if (newParentId && (newParentId === id || getDescendantIds(id).includes(newParentId))) {
      toast({
        title: 'Cannot move folder',
        description: 'Cannot move a folder into itself or its subfolders',
        variant: 'destructive',
      });
      return false;
    }

    return updateFolder(id, { parent_id: newParentId });
  };

  const getFolderPath = (folderId: string): DocumentFolder[] => {
    const path: DocumentFolder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parent_id;
      } else {
        break;
      }
    }

    return path;
  };

  return {
    folders,
    loading,
    buildFolderTree,
    createFolder,
    updateFolder,
    deleteFolder,
    renameFolder,
    moveFolder,
    getFolderPath,
    refetch: fetchFolders,
  };
}
