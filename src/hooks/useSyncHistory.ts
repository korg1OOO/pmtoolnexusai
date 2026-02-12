/**
 * Sync History Hook
 * Manages synchronization history tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { toast } from 'sonner';

export type SyncStatus = 'synced' | 'syncing' | 'partial' | 'failed' | 'pending';

export interface SyncHistoryEntry {
    id: string;
    project_id: string;
    user_id: string | null;
    status: SyncStatus;
    message: string;
    items_processed?: number;
    items_total?: number;
    errors?: string[];
    created_at: string;
    updated_at: string;
}

interface CreateSyncEntryInput {
    project_id: string;
    status: SyncStatus;
    message: string;
    items_processed?: number;
    items_total?: number;
    errors?: string[];
}

/**
 * Fetch sync history for a project
 */
export function useSyncHistory(projectId: string | undefined, limit = 10) {
    return useQuery({
        queryKey: ['sync-history', projectId],
        queryFn: async (): Promise<SyncHistoryEntry[]> => {
            if (!projectId) return [];

            const { data, error } = await supabase
                .from('sync_history')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        },
        enabled: !!projectId,
    });
}

/**
 * Get the latest sync entry
 */
export function useLatestSync(projectId: string | undefined) {
    return useQuery({
        queryKey: ['latest-sync', projectId],
        queryFn: async (): Promise<SyncHistoryEntry | null> => {
            if (!projectId) return null;

            const { data, error } = await supabase
                .from('sync_history')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        },
        enabled: !!projectId,
    });
}

/**
 * Create a new sync history entry
 */
export function useCreateSyncEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateSyncEntryInput) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('sync_history')
                .insert({
                    ...input,
                    user_id: user?.id || null,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sync-history', data.project_id] });
            queryClient.invalidateQueries({ queryKey: ['latest-sync', data.project_id] });
        },
        onError: (error: any) => {
            console.error('Failed to create sync entry:', error);
            toast.error('Failed to log sync event');
        },
    });
}

/**
 * Update sync entry status
 */
export function useUpdateSyncEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<SyncHistoryEntry> & { id: string }) => {
            const { data, error } = await supabase
                .from('sync_history')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sync-history', data.project_id] });
            queryClient.invalidateQueries({ queryKey: ['latest-sync', data.project_id] });
        },
        onError: (error: any) => {
            console.error('Failed to update sync entry:', error);
            toast.error('Failed to update sync status');
        },
    });
}

/**
 * Trigger a manual sync (creates a "syncing" entry)
 */
export function useTriggerSync(projectId: string | undefined) {
    const createEntry = useCreateSyncEntry();
    const updateEntry = useUpdateSyncEntry();

    return useMutation({
        mutationFn: async () => {
            if (!projectId) throw new Error('Project ID required');

            // Create initial "syncing" entry
            const entry = await createEntry.mutateAsync({
                project_id: projectId,
                status: 'syncing',
                message: 'Synchronization in progress...',
            });

            // Simulate sync operation (replace with actual sync logic)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Update to success
            await updateEntry.mutateAsync({
                id: entry.id,
                status: 'synced',
                message: 'Synchronization completed successfully',
                items_processed: 10,
                items_total: 10,
            });

            return entry;
        },
        onSuccess: () => {
            toast.success('Sync completed successfully');
        },
        onError: (error: any) => {
            console.error('Sync failed:', error);
            toast.error('Sync failed: ' + error.message);
        },
    });
}
