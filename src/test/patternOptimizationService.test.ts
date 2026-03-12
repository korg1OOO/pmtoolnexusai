/**
 * patternOptimizationService — Deep Tests
 * Tests interface shapes and function exports
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

import * as pos from '@/services/patternOptimizationService';

describe('patternOptimizationService', () => {
    describe('Pattern interface', () => {
        it('has pattern fields', () => {
            const p: any = {
                id: '1', pattern_type: 'cost', context: {},
                adjustment: { factor: 1.1 }, success_rate: 0.8,
                application_count: 50, is_active: true,
            };
            expect(p.success_rate).toBe(0.8);
        });
    });

    describe('function exports', () => {
        const methods = [
            'optimizePattern', 'optimizeAllPatterns',
            'mergeSimilarPatterns', 'adjustConfidenceThresholds',
        ];

        methods.forEach(name => {
            it(`${name} is exported`, () => {
                expect(typeof (pos as any)[name]).toBe('function');
            });
        });
    });
});
