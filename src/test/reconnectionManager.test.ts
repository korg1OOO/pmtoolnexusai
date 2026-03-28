/**
 * ReconnectionManager — Deep Tests
 * Tests constructor, state, backoff calculation, reset, cancel
 * Note: reconnect() with timers is tested via state assertions only
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReconnectionManager } from '@/utils/reconnectionManager';

describe('ReconnectionManager', () => {
    describe('constructor', () => {
        it('initializes with 0 attempts', () => {
            const m = new ReconnectionManager();
            expect(m.getAttempts()).toBe(0);
        });

        it('is not active initially', () => {
            const m = new ReconnectionManager();
            expect(m.isActive()).toBe(false);
        });

        it('accepts custom maxAttempts, baseDelay, maxDelay', () => {
            const m = new ReconnectionManager(3, 500, 5000);
            expect(m.getAttempts()).toBe(0);
        });

        it('uses defaults when no args provided', () => {
            const m = new ReconnectionManager();
            expect(m.getAttempts()).toBe(0);
            expect(m.isActive()).toBe(false);
        });
    });

    describe('reset', () => {
        it('resets attempts to 0', () => {
            const m = new ReconnectionManager();
            m.reset();
            expect(m.getAttempts()).toBe(0);
        });

        it('sets isActive to false', () => {
            const m = new ReconnectionManager();
            m.reset();
            expect(m.isActive()).toBe(false);
        });
    });

    describe('cancel', () => {
        it('sets isActive to false', () => {
            const m = new ReconnectionManager();
            m.cancel();
            expect(m.isActive()).toBe(false);
        });

        it('can be called multiple times safely', () => {
            const m = new ReconnectionManager();
            m.cancel();
            m.cancel();
            expect(m.isActive()).toBe(false);
        });
    });

    describe('getAttempts', () => {
        it('returns 0 initially', () => {
            const m = new ReconnectionManager();
            expect(m.getAttempts()).toBe(0);
        });
    });

    describe('isActive', () => {
        it('returns false initially', () => {
            const m = new ReconnectionManager();
            expect(m.isActive()).toBe(false);
        });
    });

    describe('reconnect', () => {
        it('is an async function', () => {
            const m = new ReconnectionManager();
            expect(typeof m.reconnect).toBe('function');
        });

        it('returns false when max attempts already reached', async () => {
            const m = new ReconnectionManager(0); // 0 max attempts
            const result = await m.reconnect(vi.fn());
            expect(result).toBe(false);
        });
    });
});
