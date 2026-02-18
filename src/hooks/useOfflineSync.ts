/**
 * useOfflineSync Hook
 * Manage offline queue and synchronization
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineQueue } from '@/utils/offlineQueue';
import { supabase as _supabase } from '@/integrations/supabase/client';
import type { QueuedUpdate } from '@/types/collaboration';

const supabase = _supabase as any;

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queueSize, setQueueSize] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingUpdates, setPendingUpdates] = useState<QueuedUpdate[]>([]);

    const updateQueueSize = useCallback(async () => {
        const pending = await offlineQueue.getPending();
        setQueueSize(pending.length);
        setPendingUpdates(pending);
    }, []);

    const sync = useCallback(async () => {
        if (!isOnline || isSyncing) return;
        setIsSyncing(true);
        const pending = await offlineQueue.getPending();

        for (const update of pending) {
            try {
                await offlineQueue.update(update.id, { status: 'syncing' });
                let result;
                switch (update.type) {
                    case 'insert':
                        result = await supabase.from(update.table).insert(update.data);
                        break;
                    case 'update':
                        result = await supabase.from(update.table).update(update.data).eq('id', update.data.id);
                        break;
                    case 'delete':
                        result = await supabase.from(update.table).delete().eq('id', update.data.id);
                        break;
                }
                if (result?.error) throw result.error;
                await offlineQueue.remove(update.id);
            } catch (error) {
                console.error('Sync error:', error);
                const retries = update.retries + 1;
                if (retries >= 3) {
                    await offlineQueue.update(update.id, { status: 'failed', retries, error: error instanceof Error ? error.message : 'Unknown error' });
                } else {
                    await offlineQueue.update(update.id, { status: 'pending', retries });
                }
            }
        }
        setIsSyncing(false);
        await updateQueueSize();
    }, [isOnline, isSyncing, updateQueueSize]);

    const queueUpdate = useCallback(async (type: 'insert' | 'update' | 'delete', table: string, data: any) => {
        await offlineQueue.add({ type, table, data, timestamp: new Date(), retries: 0, status: 'pending' });
        await updateQueueSize();
        if (isOnline) { sync(); }
    }, [isOnline, sync, updateQueueSize]);

    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); sync(); };
        const handleOffline = () => { setIsOnline(false); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, [sync]);

    useEffect(() => { updateQueueSize(); }, [updateQueueSize]);

    return { isOnline, queueSize, isSyncing, pendingUpdates, queueUpdate, sync, clearQueue: () => offlineQueue.clear() };
}
