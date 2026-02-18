/**
 * useRecordLock Hook
 * Lock records to prevent concurrent edits
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RecordLock } from '@/types/collaboration';

const supabase = _supabase as any;
const LOCK_DURATION_MINUTES = 10;

export function useRecordLock(tableName: string, recordId: string) {
    const { user } = useAuth();
    const [isLocked, setIsLocked] = useState(false);
    const [lockedBy, setLockedBy] = useState<string | null>(null);
    const [lockData, setLockData] = useState<RecordLock | null>(null);
    const [isOwnLock, setIsOwnLock] = useState(false);

    // Check if record is locked
    const checkLock = useCallback(async () => {
        if (!recordId || !tableName) return;

        const { data, error } = await supabase
            .from('record_locks')
            .select('*, profiles(full_name)')
            .eq('table_name', tableName)
            .eq('record_id', recordId)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error checking lock:', error);
            return;
        }

        if (data) {
            const lock: RecordLock = {
                id: data.id,
                tableName: data.table_name,
                recordId: data.record_id,
                userId: data.user_id,
                username: data.profiles?.full_name || 'Unknown User',
                lockedAt: new Date(data.locked_at),
                expiresAt: new Date(data.expires_at)
            };

            setLockData(lock);
            setIsLocked(true);
            setLockedBy(lock.username);
            setIsOwnLock(user?.id === lock.userId);
        } else {
            setLockData(null);
            setIsLocked(false);
            setLockedBy(null);
            setIsOwnLock(false);
        }
    }, [tableName, recordId, user?.id]);

    const lock = useCallback(async (): Promise<boolean> => {
        if (!user || !recordId || !tableName) return false;
        await checkLock();
        if (isLocked && !isOwnLock) return false;

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + LOCK_DURATION_MINUTES);

        const { error } = await supabase
            .from('record_locks')
            .insert({
                table_name: tableName,
                record_id: recordId,
                user_id: user.id,
                expires_at: expiresAt.toISOString()
            });

        if (error) { console.error('Error acquiring lock:', error); return false; }
        await checkLock();
        return true;
    }, [user, recordId, tableName, checkLock, isLocked, isOwnLock]);

    const unlock = useCallback(async (): Promise<boolean> => {
        if (!user || !recordId || !tableName) return false;
        const { error } = await supabase
            .from('record_locks')
            .delete()
            .eq('table_name', tableName)
            .eq('record_id', recordId)
            .eq('user_id', user.id);

        if (error) { console.error('Error releasing lock:', error); return false; }
        setLockData(null); setIsLocked(false); setLockedBy(null); setIsOwnLock(false);
        return true;
    }, [user, recordId, tableName]);

    const extendLock = useCallback(async (): Promise<boolean> => {
        if (!user || !recordId || !tableName || !isOwnLock) return false;
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + LOCK_DURATION_MINUTES);

        const { error } = await supabase
            .from('record_locks')
            .update({ expires_at: expiresAt.toISOString() })
            .eq('table_name', tableName)
            .eq('record_id', recordId)
            .eq('user_id', user.id);

        if (error) { console.error('Error extending lock:', error); return false; }
        await checkLock();
        return true;
    }, [user, recordId, tableName, isOwnLock, checkLock]);

    useEffect(() => {
        checkLock();
        const interval = setInterval(checkLock, 10000);
        return () => clearInterval(interval);
    }, [checkLock]);

    useEffect(() => {
        if (!isOwnLock) return;
        const interval = setInterval(() => { extendLock(); }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isOwnLock, extendLock]);

    return { isLocked, lockedBy, lockData, isOwnLock, lock, unlock, extendLock, checkLock };
}
