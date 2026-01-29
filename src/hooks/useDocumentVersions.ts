import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: string;
  file_url: string;
  file_size: number;
  change_notes: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  status: 'current' | 'approved' | 'superseded' | 'draft';
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
}

export function useDocumentVersions(documentId: string | undefined) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVersions = useCallback(async () => {
    if (!documentId) return;

    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVersions(data as DocumentVersion[]);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load version history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [documentId, toast]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const restoreVersion = async (versionId: string): Promise<boolean> => {
    if (!documentId || !user) return false;

    try {
      const version = versions.find(v => v.id === versionId);
      if (!version) return false;

      // Get current version
      const currentVersion = versions.find(v => v.status === 'current');
      if (!currentVersion) return false;

      // Calculate new version number
      const maxVersion = Math.max(...versions.map(v => parseFloat(v.version) || 0));
      const newVersion = (maxVersion + 0.1).toFixed(1);

      // Mark current as superseded
      await supabase
        .from('document_versions')
        .update({ status: 'superseded' })
        .eq('id', currentVersion.id);

      // Create new version based on restored version
      const { error: insertError } = await supabase.from('document_versions').insert({
        document_id: documentId,
        version: newVersion,
        file_url: version.file_url,
        file_size: version.file_size,
        uploaded_by: user.id,
        uploaded_by_name: user.email || 'Unknown',
        status: 'current',
        change_notes: `Restored from version ${version.version}`,
      });

      if (insertError) throw insertError;

      // Update document
      await supabase
        .from('documents')
        .update({
          version: newVersion,
          file_url: version.file_url,
          file_size: version.file_size,
        })
        .eq('id', documentId);

      toast({
        title: 'Version restored',
        description: `Restored to version ${version.version} as new version ${newVersion}`,
      });

      fetchVersions();
      return true;
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore version',
        variant: 'destructive',
      });
      return false;
    }
  };

  const approveVersion = async (versionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('document_versions')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_by_name: user.email || 'Unknown',
          approved_at: new Date().toISOString(),
        })
        .eq('id', versionId);

      if (error) throw error;

      toast({
        title: 'Version approved',
        description: 'Version has been approved',
      });

      fetchVersions();
      return true;
    } catch (error) {
      console.error('Error approving version:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve version',
        variant: 'destructive',
      });
      return false;
    }
  };

  const downloadVersion = (version: DocumentVersion) => {
    window.open(version.file_url, '_blank');
  };

  return {
    versions,
    loading,
    restoreVersion,
    approveVersion,
    downloadVersion,
    refetch: fetchVersions,
  };
}
