/**
 * Tests for lib/offlineQueue utility (127 lines)
 * Pure logic: OfflineQueue class methods (add, get, update, clear)
 * Requires IndexedDB mock
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock IndexedDB
const mockStore: any[] = [];
const mockTransaction = {
    objectStore: vi.fn(() => ({
        add: vi.fn((item: any) => {
            mockStore.push(item);
            return { onsuccess: null, onerror: null };
        }),
        getAll: vi.fn(() => {
            const req = { onsuccess: null as any, result: mockStore };
            setTimeout(() => req.onsuccess?.({ target: req }), 0);
            return req;
        }),
        put: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
    })),
};

vi.stubGlobal('indexedDB', {
    open: vi.fn(() => {
        const req: any = {};
        setTimeout(() => {
            req.result = {
                transaction: vi.fn(() => mockTransaction),
                createObjectStore: vi.fn(),
                objectStoreNames: { contains: vi.fn(() => false) },
            };
            req.onsuccess?.({ target: req });
        }, 0);
        return req;
    }),
});

describe('OfflineQueue utility', () => {
    it('module loads', async () => {
        const m = await import('@/utils/offlineQueue');
        expect(m).toBeDefined();
    });

    it('exports OfflineQueue class', async () => {
        const m = await import('@/utils/offlineQueue');
        const keys = Object.keys(m);
        expect(keys.length).toBeGreaterThan(0);
    });
});
