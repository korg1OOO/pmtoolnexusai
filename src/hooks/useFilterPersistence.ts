/**
 * useFilterPersistence Hook
 * Automatically save and restore filters from localStorage
 */

import { useEffect, useCallback } from 'react';
import type { FilterState } from '@/types/analytics';

const STORAGE_KEY_PREFIX = 'analytics_filters_';

interface UseFilterPersistenceOptions {
    dashboardId: string;
    userId: string;
    enabled?: boolean;
    debounceMs?: number;
}

export function useFilterPersistence(
    filters: FilterState,
    setFilters: (filters: FilterState) => void,
    options: UseFilterPersistenceOptions
) {
    const { dashboardId, userId, enabled = true, debounceMs = 500 } = options;
    const storageKey = `${STORAGE_KEY_PREFIX}${dashboardId}_${userId}`;

    // Restore filters on mount
    useEffect(() => {
        if (!enabled) return;

        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsedFilters = JSON.parse(stored);
                // Convert date strings back to Date objects
                if (parsedFilters.dateRange) {
                    if (parsedFilters.dateRange.start) {
                        parsedFilters.dateRange.start = new Date(parsedFilters.dateRange.start);
                    }
                    if (parsedFilters.dateRange.end) {
                        parsedFilters.dateRange.end = new Date(parsedFilters.dateRange.end);
                    }
                }
                setFilters(parsedFilters);
            }
        } catch (error) {
            console.error('Failed to restore filters from localStorage:', error);
        }
    }, [storageKey, enabled]); // Only run on mount

    // Save filters to localStorage (debounced)
    useEffect(() => {
        if (!enabled) return;

        const timeoutId = setTimeout(() => {
            try {
                localStorage.setItem(storageKey, JSON.stringify(filters));
            } catch (error) {
                console.error('Failed to save filters to localStorage:', error);
            }
        }, debounceMs);

        return () => clearTimeout(timeoutId);
    }, [filters, storageKey, enabled, debounceMs]);

    // Clear persisted filters
    const clearPersistedFilters = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('Failed to clear persisted filters:', error);
        }
    }, [storageKey]);

    return { clearPersistedFilters };
}
