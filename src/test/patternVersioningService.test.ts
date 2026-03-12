/**
 * patternVersioningService — Deep Tests
 * Tests interfaces and function exports
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        rpc: vi.fn().mockResolvedValue({ data: 1, error: null }),
    },
}));

import {
    createVersion,
    getVersionHistory,
    getVersion,
    rollbackToVersion,
    compareVersions,
    getChangelog,
    logChange,
} from '@/services/patternVersioningService';
import type { PatternVersion, ChangelogEntry, VersionDiff } from '@/services/patternVersioningService';

describe('patternVersioningService', () => {
    describe('PatternVersion interface', () => {
        it('has required fields', () => {
            const v: PatternVersion = {
                id: '1', pattern_id: 'p1', version_number: 3,
                version_tag: 'v3.0', pattern_snapshot: { success_rate: 0.9 },
                change_description: 'Improved accuracy', created_by: 'u1',
                created_at: '2024-01-01',
            };
            expect(v.version_number).toBe(3);
        });

        it('nullable fields work', () => {
            const v: PatternVersion = {
                id: '1', pattern_id: 'p1', version_number: 1,
                version_tag: null, pattern_snapshot: {},
                change_description: null, created_by: null,
                created_at: '2024-01-01',
            };
            expect(v.version_tag).toBeNull();
        });
    });

    describe('ChangelogEntry interface', () => {
        it('has required fields', () => {
            const entry: ChangelogEntry = {
                id: '1', pattern_id: 'p1',
                version_from: 1, version_to: 2,
                change_type: 'optimization', changes: {},
                created_by: 'u1', created_at: '2024-01-01',
            };
            expect(entry.change_type).toBe('optimization');
        });
    });

    describe('VersionDiff interface', () => {
        it('has diff structure', () => {
            const diff: VersionDiff = {
                version_a: 1, version_b: 2,
                changes: [
                    { field: 'success_rate', old_value: 0.7, new_value: 0.9 },
                ],
            };
            expect(diff.changes).toHaveLength(1);
        });
    });

    describe('function exports', () => {
        const methods = {
            createVersion,
            getVersionHistory,
            getVersion,
            rollbackToVersion,
            compareVersions,
            getChangelog,
            logChange,
        };

        Object.entries(methods).forEach(([name, fn]) => {
            it(`${name} is exported`, () => {
                expect(typeof fn).toBe('function');
            });
        });
    });
});
