import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface UseRealtimeTableOptions {
    /** Supabase table name */
    table: string;
    /** Optional filter, e.g. `project_id=eq.${projectId}` */
    filter?: string;
    /** React Query cache keys to invalidate on any change */
    queryKeys: (string | null | undefined)[][];
    /** Whether to activate the subscription */
    enabled?: boolean;
    /** Called with the raw payload on any change (optional) */
    onPayload?: (payload: { eventType: string; new: unknown; old: unknown }) => void;
}

/**
 * useRealtimeTable — subscribes to Supabase postgres_changes for a table
 * and invalidates React Query caches on INSERT / UPDATE / DELETE.
 *
 * @example
 * useRealtimeTable({
 *   table: 'tasks',
 *   filter: `project_id=eq.${projectId}`,
 *   queryKeys: [['tasks', projectId]],
 *   enabled: !!projectId,
 * });
 */
export function useRealtimeTable({
    table,
    filter,
    queryKeys,
    enabled = true,
    onPayload,
}: UseRealtimeTableOptions) {
    const queryClient = useQueryClient();
    const payloadRef = useRef(onPayload);
    payloadRef.current = onPayload;

    const invalidate = useCallback(() => {
        queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key.filter(Boolean) as string[] });
        });
    }, [queryClient, queryKeys]);

    useEffect(() => {
        if (!enabled) return;

        const channelName = filter ? `${table}:${filter}` : table;

        const opts: Record<string, unknown> = {
            event: '*',
            schema: 'public',
            table,
        };
        if (filter) opts.filter = filter;

        const channel = (supabase as any)
            .channel(channelName)
            .on('postgres_changes', opts, (payload: any) => {
                invalidate();
                payloadRef.current?.({
                    eventType: payload.eventType,
                    new: payload.new,
                    old: payload.old,
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table, filter, enabled]);
}
