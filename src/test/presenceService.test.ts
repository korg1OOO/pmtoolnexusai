/**
 * presenceService — Deep Tests
 * Tests generateUserColor pure function and PresenceManager class
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        channel: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
            track: vi.fn().mockResolvedValue(undefined),
            untrack: vi.fn().mockResolvedValue(undefined),
            presenceState: vi.fn(() => ({})),
        }),
        removeChannel: vi.fn(),
    },
}));

import { generateUserColor, PresenceManager } from '@/services/presenceService';

describe('presenceService', () => {
    describe('generateUserColor', () => {
        it('returns a string', () => {
            expect(typeof generateUserColor()).toBe('string');
        });

        it('returns a hex color', () => {
            expect(generateUserColor()).toMatch(/^#[0-9a-f]{6}$/);
        });

        it('returns a color from the predefined set', () => {
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
            for (let i = 0; i < 20; i++) {
                expect(colors).toContain(generateUserColor());
            }
        });
    });

    describe('PresenceManager', () => {
        it('can be constructed with required params', () => {
            const manager = new PresenceManager('sheet1', 'user1', 'Test User');
            expect(manager).toBeDefined();
        });

        it('can be constructed with optional params', () => {
            const manager = new PresenceManager('sheet1', 'user1', 'Test User', 'test@test.com', '#ff0000');
            expect(manager).toBeDefined();
        });

        it('getPresenceState returns empty object initially', () => {
            const manager = new PresenceManager('sheet1', 'user1', 'Test');
            expect(manager.getPresenceState()).toEqual({});
        });

        it('getActiveUsers returns empty array initially', () => {
            const manager = new PresenceManager('sheet1', 'user1', 'Test');
            expect(manager.getActiveUsers()).toEqual([]);
        });

        it('has subscribe method', () => {
            const manager = new PresenceManager('sheet1', 'user1', 'Test');
            expect(typeof manager.subscribe).toBe('function');
        });

        it('has updatePresence method', () => {
            const manager = new PresenceManager('sheet1', 'user1', 'Test');
            expect(typeof manager.updatePresence).toBe('function');
        });

        it('has updateCursor method', () => {
            const manager = new PresenceManager('sheet1', 'user1', 'Test');
            expect(typeof manager.updateCursor).toBe('function');
        });

        it('has updateSelection method', () => {
            const manager = new PresenceManager('sheet1', 'user1', 'Test');
            expect(typeof manager.updateSelection).toBe('function');
        });

        it('has unsubscribe method', () => {
            const manager = new PresenceManager('sheet1', 'user1', 'Test');
            expect(typeof manager.unsubscribe).toBe('function');
        });

        it('unsubscribe is safe to call without subscribing first', async () => {
            const manager = new PresenceManager('sheet1', 'user1', 'Test');
            await expect(manager.unsubscribe()).resolves.toBeUndefined();
        });
    });
});
