/**
 * Agent Pipeline — Query Hints Unit Tests
 *
 * Tests the action-to-query-key mapping for cache invalidation.
 */
import { describe, it, expect } from 'vitest';
import { getQueryHints, hasQueryHints } from '@/lib/agent-pipeline/query-hints';

describe('getQueryHints', () => {
    it('returns query keys for known action', () => {
        const hints = getQueryHints('create_project');
        expect(hints).toEqual([['projects'], ['project-stats']]);
    });

    it('returns empty array for unknown action', () => {
        const hints = getQueryHints('unknown_action');
        expect(hints).toEqual([]);
    });

    it('appends projectId to scoped keys', () => {
        const hints = getQueryHints('create_phase', 'proj-123');
        expect(hints).toContainEqual(['tasks', 'proj-123']);
        expect(hints).toContainEqual(['project-phases', 'proj-123']);
    });

    it('does not append projectId to global keys', () => {
        const hints = getQueryHints('create_project', 'proj-123');
        expect(hints).toContainEqual(['projects']); // global — no projectId appended
    });

    it('returns multiple keys for compound actions', () => {
        const hints = getQueryHints('setup_agile_backlog');
        expect(hints.length).toBeGreaterThanOrEqual(3);
    });

    it('covers all major action categories', () => {
        // Spot-check coverage across categories
        expect(getQueryHints('assign_members').length).toBeGreaterThan(0);
        expect(getQueryHints('set_budget').length).toBeGreaterThan(0);
        expect(getQueryHints('log_issue').length).toBeGreaterThan(0);
        expect(getQueryHints('create_sprint').length).toBeGreaterThan(0);
        expect(getQueryHints('schedule_meeting').length).toBeGreaterThan(0);
        expect(getQueryHints('create_charter').length).toBeGreaterThan(0);
    });
});

describe('hasQueryHints', () => {
    it('returns true for known actions', () => {
        expect(hasQueryHints('create_project')).toBe(true);
        expect(hasQueryHints('log_issue')).toBe(true);
    });

    it('returns false for unknown actions', () => {
        expect(hasQueryHints('xyz')).toBe(false);
    });
});
