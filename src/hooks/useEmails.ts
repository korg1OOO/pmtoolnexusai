import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Email {
  id: string;
  account_id: string;
  folder_id: string;
  message_id: string;
  thread_id: string | null;
  in_reply_to: string | null;
  references_ids: string[];
  subject: string | null;
  from_address: string;
  from_name: string | null;
  to_addresses: { email: string; name?: string }[];
  cc_addresses: { email: string; name?: string }[];
  bcc_addresses: { email: string; name?: string }[];
  reply_to: string | null;
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  has_attachments: boolean;
  attachments: { name: string; size: number; type: string; url?: string }[];
  is_read: boolean;
  is_starred: boolean;
  is_flagged: boolean;
  labels: string[];
  sent_at: string | null;
  received_at: string;
  created_at: string;
}

export interface EmailFolder {
  id: string;
  account_id: string;
  name: string;
  remote_name: string;
  folder_type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
  unread_count: number;
  total_count: number;
  created_at: string;
}

export interface EmailThread {
  thread_id: string;
  subject: string;
  participants: string[];
  emails: Email[];
  unread_count: number;
  last_email_at: string;
}

export function useEmails(accountIds: string[]) {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch folders for all accounts
  const fetchFolders = useCallback(async () => {
    if (accountIds.length === 0) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('email_folders')
        .select('*')
        .in('account_id', accountIds)
        .order('folder_type', { ascending: true });

      if (fetchError) throw fetchError;
      setFolders((data as EmailFolder[]) || []);
      
      // Auto-select inbox if not selected
      if (!selectedFolderId && data && data.length > 0) {
        const inbox = data.find((f: any) => f.folder_type === 'inbox');
        if (inbox) setSelectedFolderId(inbox.id);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  }, [accountIds, selectedFolderId]);

  // Fetch emails for selected folder
  const fetchEmails = useCallback(async () => {
    if (accountIds.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('emails')
        .select('*')
        .in('account_id', accountIds)
        .order('received_at', { ascending: false })
        .limit(100);

      if (selectedFolderId) {
        query = query.eq('folder_id', selectedFolderId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setEmails((data as Email[]) || []);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to load emails');
    } finally {
      setIsLoading(false);
    }
  }, [accountIds, selectedFolderId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Realtime subscription
  useEffect(() => {
    if (accountIds.length === 0) return;

    const channel = supabase
      .channel('emails_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emails' },
        () => fetchEmails()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountIds, fetchEmails]);

  // Group emails by thread
  const threads = useMemo((): EmailThread[] => {
    const threadMap = new Map<string, Email[]>();
    
    emails.forEach((email) => {
      const threadId = email.thread_id || email.message_id;
      const existing = threadMap.get(threadId) || [];
      existing.push(email);
      threadMap.set(threadId, existing);
    });

    return Array.from(threadMap.entries()).map(([threadId, threadEmails]) => {
      const sortedEmails = threadEmails.sort(
        (a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );
      const lastEmail = sortedEmails[sortedEmails.length - 1];
      const participants = [...new Set(threadEmails.map((e) => e.from_address))];
      const unreadCount = threadEmails.filter((e) => !e.is_read).length;

      return {
        thread_id: threadId,
        subject: lastEmail.subject || '(No subject)',
        participants,
        emails: sortedEmails,
        unread_count: unreadCount,
        last_email_at: lastEmail.received_at,
      };
    }).sort((a, b) => new Date(b.last_email_at).getTime() - new Date(a.last_email_at).getTime());
  }, [emails]);

  // Mark email as read
  const markAsRead = useCallback(
    async (id: string, isRead: boolean = true): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('emails')
          .update({ is_read: isRead })
          .eq('id', id);

        if (updateError) throw updateError;
        fetchEmails();
        return true;
      } catch (err) {
        console.error('Error updating email:', err);
        return false;
      }
    },
    [fetchEmails]
  );

  // Toggle star
  const toggleStar = useCallback(
    async (id: string): Promise<boolean> => {
      const email = emails.find((e) => e.id === id);
      if (!email) return false;

      try {
        const { error: updateError } = await supabase
          .from('emails')
          .update({ is_starred: !email.is_starred })
          .eq('id', id);

        if (updateError) throw updateError;
        fetchEmails();
        return true;
      } catch (err) {
        console.error('Error updating email:', err);
        return false;
      }
    },
    [emails, fetchEmails]
  );

  // Move to folder
  const moveToFolder = useCallback(
    async (emailId: string, folderId: string): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('emails')
          .update({ folder_id: folderId })
          .eq('id', emailId);

        if (updateError) throw updateError;
        toast.success('Email moved');
        fetchEmails();
        return true;
      } catch (err) {
        console.error('Error moving email:', err);
        toast.error('Failed to move email');
        return false;
      }
    },
    [fetchEmails]
  );

  // Delete email (move to trash or permanent delete)
  const deleteEmail = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        // Find trash folder
        const trashFolder = folders.find((f) => f.folder_type === 'trash');
        
        if (trashFolder) {
          // Move to trash
          return await moveToFolder(id, trashFolder.id);
        } else {
          // Permanent delete
          const { error: deleteError } = await supabase
            .from('emails')
            .delete()
            .eq('id', id);

          if (deleteError) throw deleteError;
          toast.success('Email deleted');
          fetchEmails();
          return true;
        }
      } catch (err) {
        console.error('Error deleting email:', err);
        toast.error('Failed to delete email');
        return false;
      }
    },
    [folders, moveToFolder, fetchEmails]
  );

  // Get unread count
  const unreadCount = useMemo(() => {
    return emails.filter((e) => !e.is_read).length;
  }, [emails]);

  return {
    emails,
    folders,
    threads,
    selectedFolderId,
    setSelectedFolderId,
    isLoading,
    error,
    unreadCount,
    fetchEmails,
    fetchFolders,
    markAsRead,
    toggleStar,
    moveToFolder,
    deleteEmail,
  };
}
