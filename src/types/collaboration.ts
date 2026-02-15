/**
 * Collaboration Types
 * Type definitions for collaboration features
 */

export interface PresenceState {
    userId: string;
    username: string;
    avatar?: string;
    status: 'active' | 'idle' | 'away';
    lastActivity: Date;
    color: string;
}

export interface CursorPosition {
    userId: string;
    username: string;
    x: number;
    y: number;
    color: string;
    timestamp: Date;
}

export interface RecordLock {
    id: string;
    tableName: string;
    recordId: string;
    userId: string;
    username: string;
    lockedAt: Date;
    expiresAt: Date;
}

export interface ConflictData {
    recordId: string;
    localVersion: any;
    remoteVersion: any;
    conflictingFields: string[];
    timestamp: Date;
}

export interface QueuedUpdate {
    id: string;
    type: 'insert' | 'update' | 'delete';
    table: string;
    data: any;
    timestamp: Date;
    retries: number;
    status: 'pending' | 'syncing' | 'failed';
    error?: string;
}

export interface CustomEvent {
    id: string;
    type: 'notification' | 'action' | 'data' | 'status';
    senderId: string;
    senderName: string;
    message: string;
    data?: any;
    timestamp: Date;
    severity?: 'info' | 'success' | 'warning' | 'error';
}

export interface CollaborationConfig {
    enablePresence?: boolean;
    enableCursors?: boolean;
    enableLocking?: boolean;
    enableOfflineQueue?: boolean;
    enableCustomEvents?: boolean;
}
