/**
 * Deep behavioral tests for OptimisticUpdatesManager
 * Tests all methods: apply, confirm, rollback, getPending, clear
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { OptimisticUpdatesManager, createOptimisticUpdatesManager } from './optimisticUpdates';

describe('OptimisticUpdatesManager', () => {
    let queryClient: QueryClient;
    let manager: OptimisticUpdatesManager;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        manager = new OptimisticUpdatesManager(queryClient);
    });

    describe('apply - insert', () => {
        it('returns a unique id', () => {
            const id = manager.apply(['items'], {
                type: 'insert',
                data: { id: '1', name: 'New Item' },
                table: 'items',
            });
            expect(id).toBeDefined();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(5);
        });

        it('adds item to empty cache', () => {
            const key = ['test-items'];
            manager.apply(key, {
                type: 'insert',
                data: { id: '1', name: 'Item 1' },
                table: 'items',
            });
            const cached = queryClient.getQueryData(key) as any[];
            expect(cached).toBeDefined();
            expect(cached).toHaveLength(1);
            expect(cached[0]).toEqual({ id: '1', name: 'Item 1' });
        });

        it('appends item to existing cache', () => {
            const key = ['test-items-2'];
            queryClient.setQueryData(key, [{ id: '0', name: 'Existing' }]);

            manager.apply(key, {
                type: 'insert',
                data: { id: '1', name: 'New' },
                table: 'items',
            });

            const cached = queryClient.getQueryData(key) as any[];
            expect(cached).toHaveLength(2);
            expect(cached[0].name).toBe('Existing');
            expect(cached[1].name).toBe('New');
        });

        it('tracks update as pending', () => {
            manager.apply(['items'], {
                type: 'insert',
                data: { id: '1' },
                table: 'items',
            });
            const pending = manager.getPending();
            expect(pending).toHaveLength(1);
            expect(pending[0].status).toBe('pending');
        });
    });

    describe('apply - update', () => {
        it('updates existing item in cache by id', () => {
            const key = ['items-update'];
            queryClient.setQueryData(key, [
                { id: '1', name: 'Old Name', status: 'draft' },
                { id: '2', name: 'Other Item' },
            ]);

            manager.apply(key, {
                type: 'update',
                data: { id: '1', name: 'New Name', status: 'active' },
                table: 'items',
            });

            const cached = queryClient.getQueryData(key) as any[];
            expect(cached).toHaveLength(2);
            expect(cached[0]).toEqual({ id: '1', name: 'New Name', status: 'active' });
            expect(cached[1]).toEqual({ id: '2', name: 'Other Item' });
        });
    });

    describe('apply - delete', () => {
        it('removes item from cache by id', () => {
            const key = ['items-delete'];
            queryClient.setQueryData(key, [
                { id: '1', name: 'Keep' },
                { id: '2', name: 'Remove' },
                { id: '3', name: 'Keep Too' },
            ]);

            manager.apply(key, {
                type: 'delete',
                data: { id: '2' },
                table: 'items',
            });

            const cached = queryClient.getQueryData(key) as any[];
            expect(cached).toHaveLength(2);
            expect(cached.find((i: any) => i.id === '2')).toBeUndefined();
        });
    });

    describe('confirm', () => {
        it('marks update as success', () => {
            const id = manager.apply(['items'], {
                type: 'insert',
                data: { id: '1' },
                table: 'items',
            });

            manager.confirm(id);

            // After confirm, the update should no longer appear as pending
            const pending = manager.getPending();
            expect(pending).toHaveLength(0);
        });

        it('does nothing for unknown id', () => {
            manager.confirm('nonexistent-id');
            expect(manager.getPending()).toHaveLength(0);
        });
    });

    describe('rollback', () => {
        it('removes update from tracking', () => {
            const key = ['items-rollback'];
            const id = manager.apply(key, {
                type: 'insert',
                data: { id: '1' },
                table: 'items',
            });

            manager.rollback(id, key);
            expect(manager.getPending()).toHaveLength(0);
        });

        it('invalidates query on rollback', () => {
            const key = ['items-rollback-2'];
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const id = manager.apply(key, {
                type: 'insert',
                data: { id: '1' },
                table: 'items',
            });

            manager.rollback(id, key);
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: key });
        });

        it('does nothing for unknown id', () => {
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
            manager.rollback('nonexistent', ['items']);
            expect(invalidateSpy).not.toHaveBeenCalled();
        });
    });

    describe('getPending', () => {
        it('returns empty array when no updates', () => {
            expect(manager.getPending()).toEqual([]);
        });

        it('returns only pending updates', () => {
            const id1 = manager.apply(['items'], {
                type: 'insert',
                data: { id: '1' },
                table: 'items',
            });
            manager.apply(['items'], {
                type: 'insert',
                data: { id: '2' },
                table: 'items',
            });

            manager.confirm(id1);

            const pending = manager.getPending();
            expect(pending).toHaveLength(1);
        });

        it('does not include rolled-back updates', () => {
            const key = ['items'];
            const id = manager.apply(key, {
                type: 'insert',
                data: { id: '1' },
                table: 'items',
            });

            manager.rollback(id, key);
            expect(manager.getPending()).toHaveLength(0);
        });
    });

    describe('clear', () => {
        it('removes all tracked updates', () => {
            manager.apply(['items'], { type: 'insert', data: { id: '1' }, table: 'items' });
            manager.apply(['items'], { type: 'insert', data: { id: '2' }, table: 'items' });
            manager.apply(['items'], { type: 'insert', data: { id: '3' }, table: 'items' });

            expect(manager.getPending()).toHaveLength(3);
            manager.clear();
            expect(manager.getPending()).toHaveLength(0);
        });
    });

    describe('createOptimisticUpdatesManager', () => {
        it('creates a new manager instance', () => {
            const mgr = createOptimisticUpdatesManager(queryClient);
            expect(mgr).toBeInstanceOf(OptimisticUpdatesManager);
        });
    });

    describe('multiple operations', () => {
        it('handles insert then update then delete on same item', () => {
            const key = ['items-multi'];
            queryClient.setQueryData(key, []);

            // Insert
            manager.apply(key, { type: 'insert', data: { id: '1', name: 'Original' }, table: 'items' });
            let cached = queryClient.getQueryData(key) as any[];
            expect(cached).toHaveLength(1);

            // Update
            manager.apply(key, { type: 'update', data: { id: '1', name: 'Updated' }, table: 'items' });
            cached = queryClient.getQueryData(key) as any[];
            expect(cached).toHaveLength(1);
            expect(cached[0].name).toBe('Updated');

            // Delete
            manager.apply(key, { type: 'delete', data: { id: '1' }, table: 'items' });
            cached = queryClient.getQueryData(key) as any[];
            expect(cached).toHaveLength(0);
        });
    });
});
