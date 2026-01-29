import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface EmailAccount {
  id: string;
  user_id: string | null;
  project_id: string | null;
  account_type: 'personal' | 'shared';
  email_address: string;
  display_name: string | null;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_encryption: 'ssl' | 'tls' | 'none';
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_encryption: 'ssl' | 'tls' | 'none' | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: 'pending' | 'syncing' | 'success' | 'error';
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailAccountInput {
  account_type: 'personal' | 'shared';
  email_address: string;
  display_name?: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  imap_encryption: 'ssl' | 'tls' | 'none';
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_encryption?: 'ssl' | 'tls' | 'none';
  project_id?: string;
}

export function useEmailAccounts(projectId?: string | null) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('email_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      // Get personal accounts for the user + shared accounts for the project
      if (projectId) {
        query = query.or(`user_id.eq.${user.id},project_id.eq.${projectId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setAccounts((data as EmailAccount[]) || []);
    } catch (err) {
      console.error('Error fetching email accounts:', err);
      setError('Failed to load email accounts');
    } finally {
      setIsLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = useCallback(
    async (input: CreateEmailAccountInput): Promise<EmailAccount | null> => {
      if (!user) {
        toast.error('You must be logged in');
        return null;
      }

      try {
        const { data, error: insertError } = await supabase
          .from('email_accounts')
          .insert({
            ...input,
            user_id: input.account_type === 'personal' ? user.id : null,
            project_id: input.account_type === 'shared' ? input.project_id : null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        toast.success('Email account added successfully');
        fetchAccounts();
        return data as EmailAccount;
      } catch (err: any) {
        console.error('Error creating email account:', err);
        toast.error(err.message || 'Failed to add email account');
        return null;
      }
    },
    [user, fetchAccounts]
  );

  const updateAccount = useCallback(
    async (id: string, updates: Partial<CreateEmailAccountInput>): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('email_accounts')
          .update(updates)
          .eq('id', id);

        if (updateError) throw updateError;

        toast.success('Email account updated');
        fetchAccounts();
        return true;
      } catch (err) {
        console.error('Error updating email account:', err);
        toast.error('Failed to update email account');
        return false;
      }
    },
    [fetchAccounts]
  );

  const deleteAccount = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from('email_accounts')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        toast.success('Email account removed');
        fetchAccounts();
        return true;
      } catch (err) {
        console.error('Error deleting email account:', err);
        toast.error('Failed to remove email account');
        return false;
      }
    },
    [fetchAccounts]
  );

  const syncAccount = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        // Update status to syncing
        await supabase
          .from('email_accounts')
          .update({ sync_status: 'syncing' })
          .eq('id', id);

        // Call the sync edge function
        const response = await supabase.functions.invoke('email-sync', {
          body: { accountId: id },
        });

        if (response.error) throw response.error;

        toast.success('Email sync started');
        fetchAccounts();
        return true;
      } catch (err) {
        console.error('Error syncing email account:', err);
        toast.error('Failed to sync emails');
        return false;
      }
    },
    [fetchAccounts]
  );

  const testConnection = useCallback(
    async (input: CreateEmailAccountInput): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await supabase.functions.invoke('email-test-connection', {
          body: input,
        });

        if (response.error) throw response.error;
        
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Connection failed' };
      }
    },
    []
  );

  return {
    accounts,
    isLoading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    syncAccount,
    testConnection,
  };
}
