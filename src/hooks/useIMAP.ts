/**
 * IMAP Hooks
 * React Query hooks for IMAP account management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { imapService, IMAPAccount } from '@/services/imapService';
import { toast } from 'sonner';

export function useIMAPAccounts() {
    return useQuery({
        queryKey: ['imap-accounts'],
        queryFn: () => imapService.getAccounts(),
    });
}

export function useIMAPPresets() {
    return useQuery({
        queryKey: ['imap-presets'],
        queryFn: () => imapService.getPresets(),
    });
}

export function useCreateIMAPAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (account: Partial<IMAPAccount>) => imapService.createAccount(account),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imap-accounts'] });
            toast.success('IMAP account added successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to add account: ${error.message}`);
        },
    });
}

export function useUpdateIMAPAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<IMAPAccount> }) =>
            imapService.updateAccount(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imap-accounts'] });
            toast.success('Account updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update account: ${error.message}`);
        },
    });
}

export function useDeleteIMAPAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => imapService.deleteAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imap-accounts'] });
            toast.success('Account deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete account: ${error.message}`);
        },
    });
}

export function useTestIMAPConnection() {
    return useMutation({
        mutationFn: (config: Partial<IMAPAccount>) => imapService.testConnection(config),
        onSuccess: () => {
            toast.success('Connection test successful');
        },
        onError: (error: Error) => {
            toast.error(`Connection failed: ${error.message}`);
        },
    });
}

export function useSyncIMAPAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => imapService.syncAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imap-accounts'] });
            toast.success('Sync started successfully');
        },
        onError: (error: Error) => {
            toast.error(`Sync failed: ${error.message}`);
        },
    });
}
