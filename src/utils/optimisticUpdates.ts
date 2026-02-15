/**
 * Optimistic Updates Utility
 * Manage optimistic UI updates with rollback support
 */

import { QueryClient } from '@tanstack/react-query';
import type { OptimisticUpdate } from '@/types/realtime';

export class OptimisticUpdatesManager {
    private updates: Map<string, OptimisticUpdate> = new Map();
    private queryClient: QueryClient;

    constructor(queryClient: QueryClient) {
        this.queryClient = queryClient;
    }

    /**
     * Apply an optimistic update
     */
    apply<T>(
        queryKey: string[],
        update: Omit<OptimisticUpdate<T>, 'id' | 'timestamp' | 'status'>
    ): string {
        const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const optimisticUpdate: OptimisticUpdate<T> = {
            ...update,
            id,
            timestamp: new Date(),
            status: 'pending'
        };

        this.updates.set(id, optimisticUpdate);

        // Apply update to cache
        this.queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
            if (!old) return [update.data];

            switch (update.type) {
                case 'insert':
                    return [...old, update.data];
                case 'update':
                    return old.map(item =>
                        (item as any).id === (update.data as any).id ? update.data : item
                    );
                case 'delete':
                    return old.filter(item => (item as any).id !== (update.data as any).id);
                default:
                    return old;
            }
        });

        return id;
    }

    /**
     * Confirm an optimistic update (mark as success)
     */
    confirm(id: string): void {
        const update = this.updates.get(id);
        if (update) {
            update.status = 'success';
            // Remove after confirmation
            setTimeout(() => this.updates.delete(id), 1000);
        }
    }

    /**
     * Rollback an optimistic update
     */
    rollback<T>(id: string, queryKey: string[]): void {
        const update = this.updates.get(id);
        if (update) {
            update.status = 'failed';

            // Invalidate query to refetch real data
            this.queryClient.invalidateQueries({ queryKey });

            // Remove update
            this.updates.delete(id);
        }
    }

    /**
     * Get pending updates
     */
    getPending(): OptimisticUpdate[] {
        return Array.from(this.updates.values()).filter(u => u.status === 'pending');
    }

    /**
     * Clear all updates
     */
    clear(): void {
        this.updates.clear();
    }
}

/**
 * Create optimistic updates manager
 */
export function createOptimisticUpdatesManager(queryClient: QueryClient): OptimisticUpdatesManager {
    return new OptimisticUpdatesManager(queryClient);
}
