/**
 * IMAP Account Service
 * Service for managing IMAP account configurations
 */

import { supabase } from '@/integrations/supabase/client';

export interface IMAPAccount {
    id: string;
    user_id: string;
    provider: 'gmail' | 'outlook' | 'zoho' | 'custom';
    email_address: string;
    imap_host: string;
    imap_port: number;
    imap_username: string;
    imap_password_encrypted: string;
    use_ssl: boolean;
    folder_to_sync: string;
    sync_frequency_minutes: number;
    last_sync_at: string | null;
    status: 'active' | 'inactive' | 'error';
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface IMAPPreset {
    provider: string;
    display_name: string;
    imap_host: string;
    imap_port: number;
    use_ssl: boolean;
    instructions: string | null;
    help_url: string | null;
}

export const imapService = {
    // Get all IMAP accounts for current user
    async getAccounts() {
        const { data, error } = await supabase
            .from('imap_accounts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as IMAPAccount[];
    },

    // Get provider presets
    async getPresets() {
        const { data, error } = await supabase
            .from('imap_presets')
            .select('*')
            .order('display_name');

        if (error) throw error;
        return data as IMAPPreset[];
    },

    // Get single account
    async getAccount(id: string) {
        const { data, error } = await supabase
            .from('imap_accounts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as IMAPAccount;
    },

    // Create IMAP account
    async createAccount(account: Partial<IMAPAccount>) {
        const { data: user } = await supabase.auth.getUser();

        // Encrypt password (in production, this should be done server-side)
        const { data, error } = await supabase
            .from('imap_accounts')
            .insert({
                ...account,
                user_id: user.user?.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data as IMAPAccount;
    },

    // Update IMAP account
    async updateAccount(id: string, updates: Partial<IMAPAccount>) {
        const { data, error } = await supabase
            .from('imap_accounts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as IMAPAccount;
    },

    // Delete IMAP account
    async deleteAccount(id: string) {
        const { error } = await supabase
            .from('imap_accounts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Test IMAP connection
    async testConnection(config: Partial<IMAPAccount>) {
        const { data, error } = await supabase.functions.invoke('imap-tester', {
            body: {
                host: config.imap_host,
                port: config.imap_port,
                username: config.imap_username,
                password: config.imap_password_encrypted,
                use_ssl: config.use_ssl,
            },
        });

        if (error) throw error;
        return data;
    },

    // Trigger manual sync
    async syncAccount(id: string) {
        const { data, error } = await supabase.functions.invoke('imap-sync', {
            body: { account_id: id },
        });

        if (error) throw error;
        return data;
    },
};
