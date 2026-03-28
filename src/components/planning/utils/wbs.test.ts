/**
 * Deep behavioral tests for WBS recalculation
 */
import { describe, it, expect } from 'vitest';
import { recalculateWBS } from './wbs';
import type { DbTask } from '@/hooks/useTasks';

// Helper to create minimal task objects
const makeTask = (overrides: Partial<DbTask> & { id: string }): DbTask => ({
    id: overrides.id,
    project_id: 'proj-1',
    name: overrides.name || `Task ${overrides.id}`,
    parent_id: overrides.parent_id || null,
    sort_order: overrides.sort_order ?? 0,
    wbs: overrides.wbs || '',
    status: 'not_started',
    priority: 'medium',
    progress: 0,
    is_milestone: false,
    is_summary: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
} as DbTask);

describe('recalculateWBS', () => {
    it('assigns WBS to flat tasks in sort order', () => {
        const tasks = [
            makeTask({ id: '1', sort_order: 1 }),
            makeTask({ id: '2', sort_order: 2 }),
            makeTask({ id: '3', sort_order: 3 }),
        ];
        const updates = recalculateWBS(tasks);
        expect(updates).toEqual([
            { id: '1', wbs: '1' },
            { id: '2', wbs: '2' },
            { id: '3', wbs: '3' },
        ]);
    });

    it('assigns hierarchical WBS to nested tasks', () => {
        const tasks = [
            makeTask({ id: 'p1', sort_order: 1 }),
            makeTask({ id: 'c1', parent_id: 'p1', sort_order: 1 }),
            makeTask({ id: 'c2', parent_id: 'p1', sort_order: 2 }),
            makeTask({ id: 'p2', sort_order: 2 }),
        ];
        const updates = recalculateWBS(tasks);
        expect(updates).toContainEqual({ id: 'p1', wbs: '1' });
        expect(updates).toContainEqual({ id: 'c1', wbs: '1.1' });
        expect(updates).toContainEqual({ id: 'c2', wbs: '1.2' });
        expect(updates).toContainEqual({ id: 'p2', wbs: '2' });
    });

    it('handles 3 levels of nesting', () => {
        const tasks = [
            makeTask({ id: 'a', sort_order: 1 }),
            makeTask({ id: 'b', parent_id: 'a', sort_order: 1 }),
            makeTask({ id: 'c', parent_id: 'b', sort_order: 1 }),
        ];
        const updates = recalculateWBS(tasks);
        expect(updates).toContainEqual({ id: 'a', wbs: '1' });
        expect(updates).toContainEqual({ id: 'b', wbs: '1.1' });
        expect(updates).toContainEqual({ id: 'c', wbs: '1.1.1' });
    });

    it('skips tasks with already correct WBS', () => {
        const tasks = [
            makeTask({ id: '1', sort_order: 1, wbs: '1' }),
            makeTask({ id: '2', sort_order: 2, wbs: '2' }),
        ];
        const updates = recalculateWBS(tasks);
        expect(updates).toHaveLength(0);
    });

    it('returns empty for empty tasks', () => {
        expect(recalculateWBS([])).toEqual([]);
    });

    it('sorts by sort_order correctly', () => {
        const tasks = [
            makeTask({ id: 'z', sort_order: 3 }),
            makeTask({ id: 'a', sort_order: 1 }),
            makeTask({ id: 'm', sort_order: 2 }),
        ];
        const updates = recalculateWBS(tasks);
        expect(updates).toContainEqual({ id: 'a', wbs: '1' });
        expect(updates).toContainEqual({ id: 'm', wbs: '2' });
        expect(updates).toContainEqual({ id: 'z', wbs: '3' });
    });
});
