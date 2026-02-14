import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';

export interface UserPresence {
    user_id: string;
    user_name: string;
    user_email?: string;
    user_color: string;
    cursor_position?: { row: number; col: number };
    selection?: {
        start: { row: number; col: number };
        end: { row: number; col: number };
    };
    last_seen: string;
}

export interface PresenceState {
    [key: string]: UserPresence[];
}

/**
 * Manages real-time presence for a spreadsheet sheet
 */
export class PresenceManager {
    private channel: RealtimeChannel | null = null;
    private sheetId: string;
    private userId: string;
    private userName: string;
    private userEmail?: string;
    private userColor: string;
    private presenceCallback?: (state: PresenceState) => void;

    constructor(
        sheetId: string,
        userId: string,
        userName: string,
        userEmail?: string,
        userColor: string = '#3b82f6'
    ) {
        this.sheetId = sheetId;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.userColor = userColor;
    }

    /**
     * Subscribe to presence updates for this sheet
     */
    async subscribe(onPresenceChange: (state: PresenceState) => void) {
        this.presenceCallback = onPresenceChange;

        // Create a channel for this sheet
        this.channel = supabase.channel(`sheet:${this.sheetId}:presence`, {
            config: {
                presence: {
                    key: this.userId,
                },
            },
        });

        // Track presence state changes
        this.channel
            .on('presence', { event: 'sync' }, () => {
                const state = this.channel?.presenceState() as PresenceState;
                this.presenceCallback?.(state);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('User joined:', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('User left:', key, leftPresences);
            });

        // Subscribe and track own presence
        await this.channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await this.updatePresence({
                    user_id: this.userId,
                    user_name: this.userName,
                    user_email: this.userEmail,
                    user_color: this.userColor,
                    last_seen: new Date().toISOString(),
                });
            }
        });

        // Send heartbeat every 30 seconds to keep presence alive
        const heartbeatInterval = setInterval(() => {
            if (this.channel) {
                this.updatePresence({
                    last_seen: new Date().toISOString(),
                });
            }
        }, 30000);

        // Store interval for cleanup
        (this.channel as any)._heartbeatInterval = heartbeatInterval;
    }

    /**
     * Update current user's presence state
     */
    async updatePresence(updates: Partial<UserPresence>) {
        if (!this.channel) return;

        await this.channel.track({
            ...updates,
            user_id: this.userId,
        });
    }

    /**
     * Update cursor position
     */
    async updateCursor(row: number, col: number) {
        await this.updatePresence({
            cursor_position: { row, col },
            last_seen: new Date().toISOString(),
        });
    }

    /**
     * Update selection
     */
    async updateSelection(
        start: { row: number; col: number },
        end: { row: number; col: number }
    ) {
        await this.updatePresence({
            selection: { start, end },
            last_seen: new Date().toISOString(),
        });
    }

    /**
     * Get current presence state
     */
    getPresenceState(): PresenceState {
        return (this.channel?.presenceState() as PresenceState) || {};
    }

    /**
     * Get list of active users (excluding self)
     */
    getActiveUsers(): UserPresence[] {
        const state = this.getPresenceState();
        const users: UserPresence[] = [];

        Object.values(state).forEach((presences) => {
            presences.forEach((presence) => {
                if (presence.user_id !== this.userId) {
                    users.push(presence);
                }
            });
        });

        return users;
    }

    /**
     * Unsubscribe and cleanup
     */
    async unsubscribe() {
        if (this.channel) {
            // Clear heartbeat
            const interval = (this.channel as any)._heartbeatInterval;
            if (interval) {
                clearInterval(interval);
            }

            // Untrack presence
            await this.channel.untrack();

            // Unsubscribe from channel
            await supabase.removeChannel(this.channel);
            this.channel = null;
        }
    }
}

/**
 * Generate a random user color for presence
 */
export function generateUserColor(): string {
    const colors = [
        '#3b82f6', // Blue
        '#ef4444', // Red
        '#10b981', // Green
        '#f59e0b', // Amber
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#14b8a6', // Teal
        '#f97316', // Orange
    ];

    return colors[Math.floor(Math.random() * colors.length)];
}
