/**
 * useCustomEvents Hook
 * Broadcast and receive custom events using Supabase Broadcast
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { CustomEvent } from '@/types/collaboration';

export function useCustomEvents(dashboardId: string, userId: string, username: string) {
    const [events, setEvents] = useState<CustomEvent[]>([]);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    const broadcast = useCallback((
        type: 'notification' | 'action' | 'data' | 'status',
        message: string,
        data?: any,
        severity?: 'info' | 'success' | 'warning' | 'error'
    ) => {
        if (!channel) return;

        const event: Omit<CustomEvent, 'id'> = {
            type,
            senderId: userId,
            senderName: username,
            message,
            data,
            timestamp: new Date(),
            severity: severity || 'info'
        };

        channel.send({
            type: 'broadcast',
            event: 'custom_event',
            payload: event
        });
    }, [channel, userId, username]);

    const subscribe = useCallback((
        handler: (event: CustomEvent) => void
    ): (() => void) => {
        const listener = (event: CustomEvent) => {
            // Don't receive own events
            if (event.senderId === userId) return;
            handler(event);
        };

        // Add to events list
        setEvents(prev => [...prev, event]);

        return () => {
            // Cleanup if needed
        };
    }, [userId]);

    useEffect(() => {
        if (!dashboardId) return;

        const eventChannel = supabase.channel(`events:${dashboardId}`);

        eventChannel
            .on('broadcast', { event: 'custom_event' }, ({ payload }) => {
                const event: CustomEvent = {
                    ...payload,
                    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date(payload.timestamp)
                };

                setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
            })
            .subscribe();

        setChannel(eventChannel);

        return () => {
            supabase.removeChannel(eventChannel);
        };
    }, [dashboardId]);

    return {
        events,
        broadcast,
        subscribe,
        clearEvents: () => setEvents([])
    };
}
