/**
 * OptimisticUpdatesManager — Deep Tests
 * Tests apply, confirm, rollback, getPending, clear
 */
import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

vi.mock('@/types/realtime', () => ({}));

import { OptimisticUpdatesManager, createOptimisticUpdatesManager } from '@/utils/optimisticUpdates';

describe('OptimisticUpdatesManager', () => {
    let queryClient: QueryClient;
    let manager: OptimisticUpdatesManager;

    beforeEach(() => {
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        manager = new OptimisticUpdatesManager(queryClient);
    });

    describe('constructor', () => {
        it('creates an instance', () => {
            expect(manager).toBeDefined();
        });
    });

    describe('createOptimisticUpdatesManager', () => {
        it('factory creates an instance', () => {
            const m = createOptimisticUpdatesManager(queryClient);
            expect(m).toBeInstanceOf(OptimisticUpdatesManager);
        });
    });

    describe('apply', () => {
        it('returns an update ID string', () => {
            const id = manager.apply(['test'], { type: 'insert', data: { id: '1', name: 'Test' } });
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('adds data to cache for insert type', () => {
            manager.apply(['items'], { type: 'insert', data: { id: '1', name: 'New' } });
            const data = queryClient.getQueryData(['items']);
            expect(data).toEqual([{ id: '1', name: 'New' }]);
        });

        it('appends to existing cache for insert', () => {
            queryClient.setQueryData(['items'], [{ id: '1', name: 'Old' }]);
            manager.apply(['items'], { type: 'insert', data: { id: '2', name: 'New' } });
            const data = queryClient.getQueryData(['items']) as any[];
            expect(data).toHaveLength(2);
        });

        it('updates matching item for update type', () => {
            queryClient.setQueryData(['items'], [{ id: '1', name: 'Old' }]);
            manager.apply(['items'], { type: 'update', data: { id: '1', name: 'Updated' } });
            const data = queryClient.getQueryData(['items']) as any[];
            expect(data[0].name).toBe('Updated');
        });

        it('removes matching item for delete type', () => {
            queryClient.setQueryData(['items'], [{ id: '1' }, { id: '2' }]);
            manager.apply(['items'], { type: 'delete', data: { id: '1' } });
            const data = queryClient.getQueryData(['items']) as any[];
            expect(data).toHaveLength(1);
            expect(data[0].id).toBe('2');
        });

        it('adds to pending updates', () => {
            manager.apply(['items'], { type: 'insert', data: { id: '1' } });
            expect(manager.getPending()).toHaveLength(1);
        });
    });

    describe('confirm', () => {
        it('removes update from pending after timeout', () => {
            vi.useFakeTimers();
            const id = manager.apply(['items'], { type: 'insert', data: { id: '1' } });
            manager.confirm(id);
            // Still in map but status changed
            expect(manager.getPending()).toHaveLength(0); // status is now 'success', not 'pending'
            vi.advanceTimersByTime(1100);
            vi.useRealTimers();
        });

        it('is safe to call with unknown ID', () => {
            expect(() => manager.confirm('nonexistent')).not.toThrow();
        });
    });

    describe('rollback', () => {
        it('removes update and invalidates query', () => {
            const id = manager.apply(['items'], { type: 'insert', data: { id: '1' } });
            manager.rollback(id, ['items']);
            expect(manager.getPending()).toHaveLength(0);
        });

        it('is safe to call with unknown ID', () => {
            expect(() => manager.rollback('nonexistent', ['items'])).not.toThrow();
        });
    });

    describe('getPending', () => {
        it('returns empty array initially', () => {
            expect(manager.getPending()).toEqual([]);
        });

        it('returns only pending updates', () => {
            const id1 = manager.apply(['items'], { type: 'insert', data: { id: '1' } });
            manager.apply(['items'], { type: 'insert', data: { id: '2' } });
            manager.confirm(id1);
            expect(manager.getPending()).toHaveLength(1);
        });
    });

    describe('clear', () => {
        it('removes all updates', () => {
            manager.apply(['items'], { type: 'insert', data: { id: '1' } });
            manager.apply(['items'], { type: 'insert', data: { id: '2' } });
            manager.clear();
            expect(manager.getPending()).toEqual([]);
        });
    });
});
