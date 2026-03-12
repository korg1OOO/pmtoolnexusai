/**
 * Realtime Service
 * Manages Supabase Realtime subscriptions and connections
 */

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ReconnectionManager } from '@/utils/reconnectionManager';
import type { RealtimeSubscription, ConnectionState, RealtimePayload } from '@/types/realtime';

class RealtimeService {
    private channels: Map<string, RealtimeChannel> = new Map();
    private connectionState: ConnectionState = 'disconnected';
    private reconnectionManager: ReconnectionManager;
    private stateListeners: Set<(state: ConnectionState) => void> = new Set();

    constructor() {
        this.reconnectionManager = new ReconnectionManager();
    }

    private updateConnectionState(state: ConnectionState): void {
        this.connectionState = state;
        this.stateListeners.forEach(listener => listener(state));
    }

    onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
        this.stateListeners.add(listener);
        return () => this.stateListeners.delete(listener);
    }

    private async handleDisconnection(): Promise<void> {
        if (this.channels.size === 0) return;
        this.updateConnectionState('connecting');

        const success = await this.reconnectionManager.reconnect(async () => {
            const channelIds = Array.from(this.channels.keys());
            for (const channelId of channelIds) {
                const channel = this.channels.get(channelId);
                if (channel) await channel.subscribe();
            }
        });

        if (!success && this.reconnectionManager.getAttempts() >= 10) {
            this.updateConnectionState('error');
        }
    }

    subscribe(subscription: RealtimeSubscription): () => void {
        const channelId = `${subscription.table}:${subscription.filter || '*'}`;

        if (this.channels.has(channelId)) {
            console.warn(`Channel ${channelId} already exists`);
            return () => this.unsubscribe(channelId);
        }

        const channel = supabase.channel(channelId);

        channel.on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: subscription.table,
                filter: subscription.filter
            },
            (payload: RealtimePayload) => {
                switch (payload.eventType) {
                    case 'INSERT': subscription.onInsert?.(payload.new); break;
                    case 'UPDATE': subscription.onUpdate?.(payload.new); break;
                    case 'DELETE': subscription.onDelete?.(payload.old); break;
                }
            }
        );

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') this.updateConnectionState('connected');
            else if (status === 'CHANNEL_ERROR') {
                subscription.onError?.(new Error('Channel subscription failed'));
                this.handleDisconnection();
            }
        });

        this.channels.set(channelId, channel);
        return () => this.unsubscribe(channelId);
    }

    private async unsubscribe(channelId: string): Promise<void> {
        const channel = this.channels.get(channelId);
        if (channel) {
            await supabase.removeChannel(channel);
            this.channels.delete(channelId);
            if (this.channels.size === 0) this.updateConnectionState('disconnected');
        }
    }

    async unsubscribeAll(): Promise<void> {
        for (const channelId of Array.from(this.channels.keys())) {
            await this.unsubscribe(channelId);
        }
    }

    getConnectionState(): ConnectionState { return this.connectionState; }
    getActiveChannelCount(): number { return this.channels.size; }

    async reconnect(): Promise<void> {
        this.reconnectionManager.reset();
        await this.handleDisconnection();
    }
}

export const realtimeService = new RealtimeService();
