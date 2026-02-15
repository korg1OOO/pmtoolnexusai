/**
 * useLiveData Hook
 * Subscribe to real-time table changes with React Query integration
 */

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import type { LiveDataOptions, ConnectionState } from '@/types/realtime';

export function useLiveData<T = any>(options: LiveDataOptions<T>) {
    const queryClient = useQueryClient();
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

    const {
        table,
        filter,
        onInsert,
        onUpdate,
        onDelete,
        enabled = true
    } = options;

    // Handle insert events
    const handleInsert = useCallback((record: T) => {
        // Update React Query cache
        queryClient.setQueryData([table], (old: T[] | undefined) => {
            if (!old) return [record];
            return [...old, record];
        });

        // Call custom handler
        onInsert?.(record);
    }, [table, onInsert, queryClient]);

    // Handle update events
    const handleUpdate = useCallback((record: T & { id: string }) => {
        // Update React Query cache
        queryClient.setQueryData([table], (old: T[] | undefined) => {
            if (!old) return [record];
            return old.map(item =>
                (item as any).id === record.id ? record : item
            );
        });

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [table, record.id] });

        // Call custom handler
        onUpdate?.(record);
    }, [table, onUpdate, queryClient]);

    // Handle delete events
    const handleDelete = useCallback((record: T & { id: string }) => {
        // Update React Query cache
        queryClient.setQueryData([table], (old: T[] | undefined) => {
            if (!old) return [];
            return old.filter(item => (item as any).id !== record.id);
        });

        // Call custom handler
        onDelete?.(record);
    }, [table, onDelete, queryClient]);

    useEffect(() => {
        if (!enabled) return;

        // Subscribe to connection state changes
        const unsubscribeState = realtimeService.onConnectionStateChange((state) => {
            setConnectionState(state);
            setIsConnected(state === 'connected');
        });

        // Subscribe to table changes
        const unsubscribe = realtimeService.subscribe({
            channel: `${table}-live`,
            table,
            filter,
            onInsert: handleInsert,
            onUpdate: handleUpdate,
            onDelete: handleDelete,
            onError: (error) => {
                console.error(`Live data error for ${table}:`, error);
            }
        });

        // Cleanup on unmount
        return () => {
            unsubscribe();
            unsubscribeState();
        };
    }, [enabled, table, filter, handleInsert, handleUpdate, handleDelete]);

    return {
        isConnected,
        connectionState,
        reconnect: () => realtimeService.reconnect()
    };
}
