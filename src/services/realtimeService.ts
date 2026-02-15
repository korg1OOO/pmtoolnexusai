/**
 * Realtime Service
 * Manages Supabase Realtime subscriptions and connections
 */

import { supabase } from '@/lib/supabase';
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
        this.setupConnectionMonitoring();
    }

    /**
     * Setup connection state monitoring
     */
    private setupConnectionMonitoring(): void {
        // Monitor Supabase connection status
        supabase.realtime.onOpen(() => {
            this.updateConnectionState('connected');
            this.reconnectionManager.reset();
        });

        supabase.realtime.onClose(() => {
            this.updateConnectionState('disconnected');
            this.handleDisconnection();
        });

        supabase.realtime.onError((error) => {
            console.error('Realtime error:', error);
            this.updateConnectionState('error');
        });
    }

    /**
     * Handle disconnection with automatic reconnection
     */
    private async handleDisconnection(): Promise<void> {
        if (this.channels.size === 0) {
            // No active subscriptions, don't reconnect
            return;
        }

        this.updateConnectionState('connecting');

        const success = await this.reconnectionManager.reconnect(async () => {
            // Reconnect all channels
            const channelIds = Array.from(this.channels.keys());
            for (const channelId of channelIds) {
                const channel = this.channels.get(channelId);
                if (channel) {
                    await channel.subscribe();
                }
            }
        });

        if (!success && this.reconnectionManager.getAttempts() >= 10) {
            this.updateConnectionState('error');
        }
    }

    /**
     * Update connection state and notify listeners
     */
    private updateConnectionState(state: ConnectionState): void {
        this.connectionState = state;
        this.stateListeners.forEach(listener => listener(state));
    }

    /**
     * Subscribe to connection state changes
     */
    onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
        this.stateListeners.add(listener);
        // Return unsubscribe function
        return () => this.stateListeners.delete(listener);
    }

    /**
     * Subscribe to table changes
     */
    subscribe(subscription: RealtimeSubscription): () => void {
        const channelId = `${subscription.table}:${subscription.filter || '*'}`;

        // Check if channel already exists
        if (this.channels.has(channelId)) {
            console.warn(`Channel ${channelId} already exists`);
            return () => this.unsubscribe(channelId);
        }

        // Create channel
        const channel = supabase.channel(channelId);

        // Setup table change listeners
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
                    case 'INSERT':
                        subscription.onInsert?.(payload.new);
                        break;
                    case 'UPDATE':
                        subscription.onUpdate?.(payload.new);
                        break;
                    case 'DELETE':
                        subscription.onDelete?.(payload.old);
                        break;
                }
            }
        );

        // Subscribe to channel
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                this.updateConnectionState('connected');
            } else if (status === 'CHANNEL_ERROR') {
                subscription.onError?.(new Error('Channel subscription failed'));
            }
        });

        this.channels.set(channelId, channel);

        // Return unsubscribe function
        return () => this.unsubscribe(channelId);
    }

    /**
     * Unsubscribe from a channel
     */
    private async unsubscribe(channelId: string): Promise<void> {
        const channel = this.channels.get(channelId);
        if (channel) {
            await supabase.removeChannel(channel);
            this.channels.delete(channelId);

            // Update connection state if no more channels
            if (this.channels.size === 0) {
                this.updateConnectionState('disconnected');
            }
        }
    }

    /**
     * Unsubscribe from all channels
     */
    async unsubscribeAll(): Promise<void> {
        const channelIds = Array.from(this.channels.keys());
        for (const channelId of channelIds) {
            await this.unsubscribe(channelId);
        }
    }

    /**
     * Get current connection state
     */
    getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    /**
     * Get number of active channels
     */
    getActiveChannelCount(): number {
        return this.channels.size;
    }

    /**
     * Manually trigger reconnection
     */
    async reconnect(): Promise<void> {
        this.reconnectionManager.reset();
        await this.handleDisconnection();
    }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
