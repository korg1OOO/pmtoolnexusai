/**
 * useCursor Hook
 * Track and broadcast cursor positions using Supabase Broadcast
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { CursorPosition } from '@/types/collaboration';

const CURSOR_THROTTLE_MS = 50; // 20fps for cursor updates

export function useCursor(dashboardId: string, userId: string, username: string, userColor: string) {
    const [remoteCursors, setRemoteCursors] = useState<Map<string, CursorPosition>>(new Map());
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);
    const lastBroadcastTime = useRef<number>(0);
    const cursorCleanupTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const broadcastCursor = useCallback((x: number, y: number) => {
        const now = Date.now();
        if (now - lastBroadcastTime.current < CURSOR_THROTTLE_MS) {
            return; // Throttle
        }

        if (channel) {
            channel.send({
                type: 'broadcast',
                event: 'cursor',
                payload: {
                    userId,
                    username,
                    x,
                    y,
                    color: userColor,
                    timestamp: new Date().toISOString()
                }
            });
            lastBroadcastTime.current = now;
        }
    }, [channel, userId, username, userColor]);

    useEffect(() => {
        if (!dashboardId || !userId) return;

        // Create broadcast channel for cursors
        const cursorChannel = supabase.channel(`cursors:${dashboardId}`);

        // Subscribe to cursor broadcasts
        cursorChannel
            .on('broadcast', { event: 'cursor' }, ({ payload }) => {
                // Ignore own cursor
                if (payload.userId === userId) return;

                const cursorData: CursorPosition = {
                    userId: payload.userId,
                    username: payload.username,
                    x: payload.x,
                    y: payload.y,
                    color: payload.color,
                    timestamp: new Date(payload.timestamp)
                };

                setRemoteCursors(prev => {
                    const next = new Map(prev);
                    next.set(payload.userId, cursorData);
                    return next;
                });

                // Clear existing cleanup timer
                const existingTimer = cursorCleanupTimers.current.get(payload.userId);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                }

                // Set new cleanup timer (remove cursor after 3 seconds of inactivity)
                const timer = setTimeout(() => {
                    setRemoteCursors(prev => {
                        const next = new Map(prev);
                        next.delete(payload.userId);
                        return next;
                    });
                    cursorCleanupTimers.current.delete(payload.userId);
                }, 3000);

                cursorCleanupTimers.current.set(payload.userId, timer);
            })
            .subscribe();

        setChannel(cursorChannel);

        // Cleanup
        return () => {
            cursorCleanupTimers.current.forEach(timer => clearTimeout(timer));
            cursorCleanupTimers.current.clear();
            supabase.removeChannel(cursorChannel);
        };
    }, [dashboardId, userId]);

    return {
        remoteCursors: Array.from(remoteCursors.values()),
        broadcastCursor
    };
}
