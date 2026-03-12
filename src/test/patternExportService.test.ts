/**
 * patternExportService — Deep Tests
 * Tests validatePattern pure function and downloadExportBundle
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            like: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnThis(),
        })),
    },
}));

// Stub URL for jsdom
beforeAll(() => {
    if (!URL.createObjectURL) (URL as any).createObjectURL = vi.fn(() => 'blob:test');
    if (!URL.revokeObjectURL) (URL as any).revokeObjectURL = vi.fn();
});

import {
    validatePattern,
    downloadExportBundle,
    exportPattern,
    exportAllPatterns,
    exportPatternsByType,
    importPatterns,
} from '@/services/patternExportService';
import type { PatternExport, ExportBundle } from '@/services/patternExportService';

const validPattern: PatternExport = {
    pattern_type: 'cost_estimation',
    context: { scope: 'project' },
    adjustment: { factor: 1.2 },
    success_rate: 0.85,
    application_count: 10,
    is_active: true,
    metadata: { exported_at: '2024-01-01', created_at: '2023-01-01' },
};

describe('patternExportService', () => {
    describe('validatePattern', () => {
        it('accepts valid pattern', () => {
            const result = validatePattern(validPattern);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('rejects missing pattern_type', () => {
            const result = validatePattern({ ...validPattern, pattern_type: '' });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing pattern_type');
        });

        it('rejects missing adjustment', () => {
            const result = validatePattern({ ...validPattern, adjustment: null as any });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing adjustment');
        });

        it('rejects success_rate below 0', () => {
            const result = validatePattern({ ...validPattern, success_rate: -0.1 });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid success_rate (must be 0-1)');
        });

        it('rejects success_rate above 1', () => {
            const result = validatePattern({ ...validPattern, success_rate: 1.5 });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid success_rate (must be 0-1)');
        });

        it('rejects non-numeric success_rate', () => {
            const result = validatePattern({ ...validPattern, success_rate: 'high' as any });
            expect(result.valid).toBe(false);
        });

        it('accepts success_rate = 0', () => {
            const result = validatePattern({ ...validPattern, success_rate: 0 });
            expect(result.valid).toBe(true);
        });

        it('accepts success_rate = 1', () => {
            const result = validatePattern({ ...validPattern, success_rate: 1 });
            expect(result.valid).toBe(true);
        });

        it('rejects negative application_count', () => {
            const result = validatePattern({ ...validPattern, application_count: -1 });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid application_count');
        });

        it('rejects non-numeric application_count', () => {
            const result = validatePattern({ ...validPattern, application_count: 'many' as any });
            expect(result.valid).toBe(false);
        });

        it('accepts application_count = 0', () => {
            const result = validatePattern({ ...validPattern, application_count: 0 });
            expect(result.valid).toBe(true);
        });

        it('returns multiple errors for completely invalid pattern', () => {
            const result = validatePattern({
                pattern_type: '',
                context: null,
                adjustment: null,
                success_rate: -1,
                application_count: -1,
                is_active: false,
                metadata: { exported_at: '', created_at: '' },
            } as any);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('downloadExportBundle', () => {
        it('does not throw', () => {
            const bundle: ExportBundle = { version: '1.0', exported_at: '2024-01-01', patterns: [] };
            expect(() => downloadExportBundle(bundle)).not.toThrow();
        });

        it('accepts custom filename', () => {
            const bundle: ExportBundle = { version: '1.0', exported_at: '2024-01-01', patterns: [] };
            expect(() => downloadExportBundle(bundle, 'my-patterns.json')).not.toThrow();
        });
    });

    describe('async functions shape', () => {
        it('exportPattern is a function', () => {
            expect(typeof exportPattern).toBe('function');
        });

        it('exportAllPatterns is a function', () => {
            expect(typeof exportAllPatterns).toBe('function');
        });

        it('exportPatternsByType is a function', () => {
            expect(typeof exportPatternsByType).toBe('function');
        });

        it('importPatterns is a function', () => {
            expect(typeof importPatterns).toBe('function');
        });
    });
});
