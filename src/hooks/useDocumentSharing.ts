import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DocumentShare {
  id: string;
  document_id: string | null;
  folder_id: string | null;
  shared_with_user_id: string | null;
  shared_with_email: string | null;
  permission: 'view' | 'comment' | 'edit';
  share_link: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

export function useDocumentSharing(documentId: string | undefined) {
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchShares = useCallback(async () => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('document_shares')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShares(data as DocumentShare[]);
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sharing info',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [documentId, toast]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const shareWithEmail = async (
    email: string,
    permission: 'view' | 'comment' | 'edit' = 'view',
    expiresAt?: Date
  ): Promise<DocumentShare | null> => {
    if (!documentId || !user) return null;

    try {
      // Check if already shared
      const existing = shares.find(s => s.shared_with_email === email);
      if (existing) {
        // Update existing share
        const { data, error } = await supabase
          .from('document_shares')
          .update({
            permission,
            expires_at: expiresAt?.toISOString() || null,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Share updated',
          description: `Updated permissions for ${email}`,
        });

        fetchShares();
        return data as DocumentShare;
      }

      const { data, error } = await supabase
        .from('document_shares')
        .insert({
          document_id: documentId,
          shared_with_email: email,
          permission,
          expires_at: expiresAt?.toISOString() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Document shared',
        description: `Shared with ${email}`,
      });

      fetchShares();
      return data as DocumentShare;
    } catch (error) {
      console.error('Error sharing document:', error);
      toast({
        title: 'Error',
        description: 'Failed to share document',
        variant: 'destructive',
      });
      return null;
    }
  };

  const generateShareLink = async (
    permission: 'view' | 'comment' | 'edit' = 'view',
    expiresAt?: Date
  ): Promise<string | null> => {
    if (!documentId || !user) return null;

    try {
      // Generate unique link token
      const linkToken = crypto.randomUUID();
      const shareLink = `${window.location.origin}/shared/${linkToken}`;

      const { error } = await supabase.from('document_shares').insert({
        document_id: documentId,
        permission,
        share_link: shareLink,
        expires_at: expiresAt?.toISOString() || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Link generated',
        description: 'Share link created successfully',
      });

      fetchShares();
      return shareLink;
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
      return null;
    }
  };

  const removeShare = async (shareId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('document_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: 'Share removed',
        description: 'Access has been revoked',
      });

      fetchShares();
      return true;
    } catch (error) {
      console.error('Error removing share:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove share',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateSharePermission = async (
    shareId: string,
    permission: 'view' | 'comment' | 'edit'
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('document_shares')
        .update({ permission })
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: 'Permission updated',
        description: 'Share permission updated',
      });

      fetchShares();
      return true;
    } catch (error) {
      console.error('Error updating share:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permission',
        variant: 'destructive',
      });
      return false;
    }
  };

  const copyShareLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied',
      description: 'Share link copied to clipboard',
    });
  };

  return {
    shares,
    loading,
    shareWithEmail,
    generateShareLink,
    removeShare,
    updateSharePermission,
    copyShareLink,
    refetch: fetchShares,
  };
}
