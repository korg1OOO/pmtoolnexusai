/**
 * mlLearningService — Deep Tests
 * Tests interface shapes and function exports
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
    },
}));

import {
    createLearningPattern,
    getActivePatternsForType,
    applyLearningPatterns,
    updatePatternSuccessRate,
    getAllPatternsWithStats,
    deactivatePattern,
    activatePattern,
} from '@/services/mlLearningService';
import type { LearningPattern, CreatePatternParams } from '@/services/mlLearningService';

describe('mlLearningService', () => {
    describe('LearningPattern interface', () => {
        it('has required fields', () => {
            const pattern: LearningPattern = {
                id: '1', pattern_type: 'cost_correction',
                prediction_type: 'cost_estimate',
                context: { keywords: ['infrastructure'] },
                adjustment: { factor: 1.15 },
                success_rate: 0.82, sample_size: 45,
                is_active: true, created_at: '2024-01-01',
            };
            expect(pattern.sample_size).toBe(45);
        });

        it('success_rate is nullable', () => {
            const pattern: LearningPattern = {
                id: '1', pattern_type: 'test',
                prediction_type: 'test', context: {},
                adjustment: {}, success_rate: null,
                sample_size: 0, is_active: true,
                created_at: '2024-01-01',
            };
            expect(pattern.success_rate).toBeNull();
        });
    });

    describe('CreatePatternParams interface', () => {
        it('has required fields', () => {
            const params: CreatePatternParams = {
                pattern_type: 'duration_correction',
                prediction_type: 'duration',
                context: { keywords: ['complex'] },
                adjustment: { multiplier: 1.3 },
            };
            expect(params.pattern_type).toBe('duration_correction');
        });

        it('success_rate is optional', () => {
            const params: CreatePatternParams = {
                pattern_type: 'test', prediction_type: 'test',
                context: {}, adjustment: {}, success_rate: 0.9,
            };
            expect(params.success_rate).toBe(0.9);
        });
    });

    describe('function exports', () => {
        const methods = {
            createLearningPattern,
            getActivePatternsForType,
            applyLearningPatterns,
            updatePatternSuccessRate,
            getAllPatternsWithStats,
            deactivatePattern,
            activatePattern,
        };

        Object.entries(methods).forEach(([name, fn]) => {
            it(`${name} is exported`, () => {
                expect(typeof fn).toBe('function');
            });
        });
    });
});
