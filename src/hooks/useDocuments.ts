import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Document {
  id: string;
  project_id: string;
  folder_id: string | null;
  name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  is_starred: boolean;
  is_locked: boolean;
  locked_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  metadata: Record<string, string | number | boolean | null> | null;
  created_at: string;
  updated_at: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}

export function useDocuments(projectId: string | undefined) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data as Document[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchDocuments();

    // Real-time subscription
    if (!projectId) return;

    const channel = supabase
      .channel(`documents-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchDocuments]);

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['xls', 'xlsx'].includes(ext)) return 'xls';
    if (['ppt', 'pptx'].includes(ext)) return 'ppt';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    return 'other';
  };

  const uploadDocument = async (
    file: File,
    folderId: string | null = null
  ): Promise<Document | null> => {
    if (!projectId || !user) return null;

    const uploadId = `${file.name}-${Date.now()}`;
    setUploadProgress(prev => [
      ...prev,
      { fileName: file.name, progress: 0, status: 'uploading' },
    ]);

    try {
      // Generate unique path
      const docId = crypto.randomUUID();
      const filePath = `${projectId}/${docId}/v1/${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          id: docId,
          project_id: projectId,
          folder_id: folderId,
          name: file.name,
          file_type: getFileType(file.name),
          file_url: urlData.publicUrl,
          file_size: file.size,
          version: '1.0',
          status: 'draft',
          uploaded_by: user.id,
          uploaded_by_name: user.email || 'Unknown',
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial version record
      await supabase.from('document_versions').insert({
        document_id: docId,
        version: '1.0',
        file_url: urlData.publicUrl,
        file_size: file.size,
        uploaded_by: user.id,
        uploaded_by_name: user.email || 'Unknown',
        status: 'current',
        change_notes: 'Initial upload',
      });

      setUploadProgress(prev =>
        prev.map(p =>
          p.fileName === file.name ? { ...p, progress: 100, status: 'complete' } : p
        )
      );

      toast({
        title: 'Upload complete',
        description: `${file.name} uploaded successfully`,
      });

      return data as Document;
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadProgress(prev =>
        prev.map(p =>
          p.fileName === file.name ? { ...p, status: 'error' } : p
        )
      );
      toast({
        title: 'Upload failed',
        description: `Failed to upload ${file.name}`,
        variant: 'destructive',
      });
      return null;
    }
  };

  const uploadNewVersion = async (
    documentId: string,
    file: File,
    changeNotes?: string
  ): Promise<boolean> => {
    if (!projectId || !user) return false;

    try {
      // Get current document
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new version
      const currentVersion = parseFloat(doc.version) || 1.0;
      const newVersion = (currentVersion + 0.1).toFixed(1);

      // Upload new file
      const filePath = `${projectId}/${documentId}/v${newVersion}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);

      // Mark old version as superseded
      await supabase
        .from('document_versions')
        .update({ status: 'superseded' })
        .eq('document_id', documentId)
        .eq('status', 'current');

      // Create new version record
      await supabase.from('document_versions').insert({
        document_id: documentId,
        version: newVersion,
        file_url: urlData.publicUrl,
        file_size: file.size,
        uploaded_by: user.id,
        uploaded_by_name: user.email || 'Unknown',
        status: 'current',
        change_notes: changeNotes,
      });

      // Update document
      await supabase
        .from('documents')
        .update({
          version: newVersion,
          file_url: urlData.publicUrl,
          file_size: file.size,
          name: file.name,
        })
        .eq('id', documentId);

      toast({
        title: 'Version uploaded',
        description: `New version ${newVersion} uploaded successfully`,
      });

      return true;
    } catch (error) {
      console.error('Error uploading new version:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload new version',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateDocument = async (
    id: string,
    updates: Partial<Document>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to update document',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteDocument = async (id: string, permanent = false): Promise<boolean> => {
    try {
      if (permanent) {
        // Delete from storage and database
        const doc = documents.find(d => d.id === id);
        if (doc) {
          await supabase.storage
            .from('project-documents')
            .remove([`${projectId}/${id}`]);
        }
        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } else {
        // Soft delete
        const { error } = await supabase
          .from('documents')
          .update({ is_deleted: true, deleted_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      }

      toast({
        title: 'Document deleted',
        description: permanent ? 'Document permanently deleted' : 'Document moved to trash',
      });
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
      return false;
    }
  };

  const restoreDocument = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Document restored',
        description: 'Document has been restored',
      });
      return true;
    } catch (error) {
      console.error('Error restoring document:', error);
      return false;
    }
  };

  const toggleStar = async (id: string): Promise<boolean> => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return false;

    return updateDocument(id, { is_starred: !doc.is_starred });
  };

  const moveDocument = async (
    id: string,
    folderId: string | null
  ): Promise<boolean> => {
    return updateDocument(id, { folder_id: folderId });
  };

  const copyDocument = async (id: string, folderId: string | null): Promise<Document | null> => {
    if (!projectId || !user) return null;

    try {
      const doc = documents.find(d => d.id === id);
      if (!doc) return null;

      // Create copy in database (storage file is shared)
      const { data, error } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          folder_id: folderId,
          name: `${doc.name} (Copy)`,
          file_type: doc.file_type,
          file_url: doc.file_url,
          file_size: doc.file_size,
          version: '1.0',
          status: 'draft',
          uploaded_by: user.id,
          uploaded_by_name: user.email || 'Unknown',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Document copied',
        description: 'Document copied successfully',
      });

      return data as Document;
    } catch (error) {
      console.error('Error copying document:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy document',
        variant: 'destructive',
      });
      return null;
    }
  };

  const renameDocument = async (id: string, newName: string): Promise<boolean> => {
    return updateDocument(id, { name: newName });
  };

  const clearUploadProgress = () => {
    setUploadProgress([]);
  };

  return {
    documents,
    loading,
    uploadProgress,
    uploadDocument,
    uploadNewVersion,
    updateDocument,
    deleteDocument,
    restoreDocument,
    toggleStar,
    moveDocument,
    copyDocument,
    renameDocument,
    clearUploadProgress,
    refetch: fetchDocuments,
  };
}
