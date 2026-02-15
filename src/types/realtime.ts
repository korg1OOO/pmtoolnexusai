/**
 * Real-Time Types
 * Type definitions for real-time data synchronization
 */

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeSubscription {
    channel: string;
    table: string;
    filter?: string;
    onInsert?: (record: any) => void;
    onUpdate?: (record: any) => void;
    onDelete?: (record: any) => void;
    onError?: (error: Error) => void;
}

export interface ConnectionStatus {
    state: ConnectionState;
    lastSync?: Date;
    error?: string;
    reconnectAttempts: number;
    activeChannels: number;
}

export interface OptimisticUpdate<T = any> {
    id: string;
    type: 'insert' | 'update' | 'delete';
    data: T;
    timestamp: Date;
    status: 'pending' | 'success' | 'failed';
}

export interface RealtimeConfig {
    enableReconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    enableOptimisticUpdates?: boolean;
    debugMode?: boolean;
}

export interface RealtimePayload<T = any> {
    schema: string;
    table: string;
    commit_timestamp: string;
    eventType: RealtimeEvent;
    new: T;
    old: T;
    errors: string[] | null;
}

export interface LiveDataOptions<T = any> {
    table: string;
    filter?: string;
    select?: string;
    onInsert?: (record: T) => void;
    onUpdate?: (record: T) => void;
    onDelete?: (record: T) => void;
    enabled?: boolean;
}
