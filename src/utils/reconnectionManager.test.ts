/**
 * Deep tests for ReconnectionManager (104 lines)
 * Tests synchronous methods and exponential backoff calculation.
 * Async reconnect() is NOT tested due to vi.fakeTimers + async Promise limitations.
 */
import { describe, it, expect } from 'vitest';
import { ReconnectionManager } from './reconnectionManager';

describe('ReconnectionManager', () => {
    // === Constructor ===
    it('initializes with default values', () => {
        const m = new ReconnectionManager();
        expect(m.getAttempts()).toBe(0);
        expect(m.isActive()).toBe(false);
    });

    it('custom constructor', () => {
        const m = new ReconnectionManager(5, 500, 10000);
        expect(m.getAttempts()).toBe(0);
        expect(m.isActive()).toBe(false);
    });

    // === calculateDelay (exponential backoff) ===
    it('calculateDelay base case', () => {
        const m = new ReconnectionManager(10, 1000, 30000) as any;
        m.attempts = 0;
        expect(m.calculateDelay()).toBe(1000); // 1000 * 2^0
    });

    it('calculateDelay exponential growth', () => {
        const m = new ReconnectionManager(10, 1000, 30000) as any;
        m.attempts = 1;
        expect(m.calculateDelay()).toBe(2000); // 1000 * 2^1
        m.attempts = 2;
        expect(m.calculateDelay()).toBe(4000); // 1000 * 2^2
        m.attempts = 3;
        expect(m.calculateDelay()).toBe(8000); // 1000 * 2^3
        m.attempts = 4;
        expect(m.calculateDelay()).toBe(16000); // 1000 * 2^4
    });

    it('calculateDelay capped at maxDelay', () => {
        const m = new ReconnectionManager(20, 1000, 5000) as any;
        m.attempts = 10; // 1000 * 2^10 = 1024000, should cap
        expect(m.calculateDelay()).toBe(5000);
    });

    it('calculateDelay with small base', () => {
        const m = new ReconnectionManager(10, 100, 1000) as any;
        m.attempts = 0;
        expect(m.calculateDelay()).toBe(100);
        m.attempts = 3;
        expect(m.calculateDelay()).toBe(800); // 100 * 2^3
    });

    // === reset ===
    it('reset clears attempts and state', () => {
        const m = new ReconnectionManager() as any;
        m.attempts = 5;
        m.isReconnecting = true;
        m.reset();
        expect(m.getAttempts()).toBe(0);
        expect(m.isActive()).toBe(false);
    });

    // === cancel ===
    it('cancel stops reconnection', () => {
        const m = new ReconnectionManager() as any;
        m.isReconnecting = true;
        m.cancel();
        expect(m.isActive()).toBe(false);
    });

    // === getAttempts ===
    it('getAttempts tracks count', () => {
        const m = new ReconnectionManager() as any;
        expect(m.getAttempts()).toBe(0);
        m.attempts = 3;
        expect(m.getAttempts()).toBe(3);
    });

    // === isActive ===
    it('isActive reflects state', () => {
        const m = new ReconnectionManager() as any;
        expect(m.isActive()).toBe(false);
        m.isReconnecting = true;
        expect(m.isActive()).toBe(true);
    });

    // === reconnect guard ===
    it('reconnect rejects when already reconnecting', async () => {
        const m = new ReconnectionManager() as any;
        m.isReconnecting = true;
        const result = await m.reconnect(() => Promise.resolve());
        expect(result).toBe(false);
    });

    it('reconnect rejects when max attempts exceeded', async () => {
        const m = new ReconnectionManager(2) as any;
        m.attempts = 5;
        const result = await m.reconnect(() => Promise.resolve());
        expect(result).toBe(false);
    });
});
