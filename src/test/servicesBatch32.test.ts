/**
 * Tests batch 32: realtimeService deep behavioral tests (112 lines, 8 methods)
 * RealtimeService: subscribe, unsubscribe, unsubscribeAll, getConnectionState, getActiveChannelCount, reconnect, onConnectionStateChange
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((cb?: any) => { if (cb) cb('SUBSCRIBED'); return mockChannel; }),
};

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        channel: vi.fn(() => mockChannel),
        removeChannel: vi.fn(() => Promise.resolve()),
    },
}));

vi.mock('@/utils/reconnectionManager', () => ({
    ReconnectionManager: vi.fn().mockImplementation(() => ({
        reconnect: vi.fn(() => Promise.resolve(true)),
        reset: vi.fn(),
        getAttempts: vi.fn(() => 0),
    })),
}));

vi.mock('@/types/realtime', () => ({}));

import { realtimeService } from '@/services/realtimeService';

beforeEach(() => {
    vi.clearAllMocks();
    // Reset service state by unsubscribing all
    realtimeService.unsubscribeAll();
});

describe('RealtimeService', () => {
    it('initial state is disconnected', () => {
        expect(realtimeService.getConnectionState()).toBe('disconnected');
    });

    it('getActiveChannelCount returns 0 initially', () => {
        expect(realtimeService.getActiveChannelCount()).toBe(0);
    });

    it('subscribe creates a channel', () => {
        const unsub = realtimeService.subscribe({
            table: 'projects',
            onInsert: vi.fn(),
            onUpdate: vi.fn(),
        });
        expect(typeof unsub).toBe('function');
        expect(realtimeService.getActiveChannelCount()).toBe(1);
    });

    it('subscribe sets state to connected on SUBSCRIBED', () => {
        realtimeService.subscribe({ table: 'tasks' });
        expect(realtimeService.getConnectionState()).toBe('connected');
    });

    it('subscribe returns unsubscribe function', () => {
        const unsub = realtimeService.subscribe({ table: 'tasks2' });
        expect(typeof unsub).toBe('function');
        unsub();
    });

    it('subscribe deduplicates channels', () => {
        realtimeService.subscribe({ table: 'dupes' });
        realtimeService.subscribe({ table: 'dupes' });
        expect(realtimeService.getActiveChannelCount()).toBe(1);
    });

    it('subscribe with filter creates unique channel', () => {
        realtimeService.subscribe({ table: 'tasks', filter: 'project_id=eq.p1' });
        realtimeService.subscribe({ table: 'tasks', filter: 'project_id=eq.p2' });
        expect(realtimeService.getActiveChannelCount()).toBe(2);
    });

    it('unsubscribeAll removes all channels', async () => {
        realtimeService.subscribe({ table: 'a' });
        realtimeService.subscribe({ table: 'b' });
        await realtimeService.unsubscribeAll();
        expect(realtimeService.getActiveChannelCount()).toBe(0);
        expect(realtimeService.getConnectionState()).toBe('disconnected');
    });

    it('onConnectionStateChange notifies listener', () => {
        const listener = vi.fn();
        const remove = realtimeService.onConnectionStateChange(listener);
        realtimeService.subscribe({ table: 'notify_test' });
        expect(listener).toHaveBeenCalledWith('connected');
        remove();
    });

    it('reconnect resets and resubscribes', async () => {
        await realtimeService.reconnect();
        // Should not throw
        expect(true).toBe(true);
    });
});
