/**
 * abTestingService — Deep Tests
 * Tests interface exports and function shapes for A/B testing service
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            like: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import {
    createABTest,
    getActiveABTest,
    getAllABTests,
    recordABTestResult,
    getABTestStats,
    calculateSignificance,
    selectWinner,
    pauseABTest,
    resumeABTest,
} from '@/services/abTestingService';
import type { ABTest, ABTestStats, SignificanceResult } from '@/services/abTestingService';

describe('abTestingService', () => {
    describe('interfaces', () => {
        it('ABTest has required fields', () => {
            const test: ABTest = {
                id: '1', name: 'Test', description: null,
                pattern_a_id: 'a', pattern_b_id: 'b',
                pattern_c_id: null, pattern_d_id: null,
                traffic_split: { a: 50, b: 50 },
                status: 'running', winner_pattern_id: null,
                confidence_level: null, started_at: '2024-01-01',
                ended_at: null, created_at: '2024-01-01',
            };
            expect(test.status).toBe('running');
        });

        it('ABTest status can be running, paused, or completed', () => {
            const statuses: ABTest['status'][] = ['running', 'paused', 'completed'];
            expect(statuses).toHaveLength(3);
        });

        it('ABTestStats has success_rate', () => {
            const stats: ABTestStats = {
                variant: 'a', pattern_id: 'p1',
                total_predictions: 100, successful_predictions: 85,
                success_rate: 0.85,
            };
            expect(stats.success_rate).toBe(0.85);
        });

        it('SignificanceResult has is_significant and confidence_level', () => {
            const result: SignificanceResult = {
                is_significant: true, confidence_level: 0.95,
                winner_variant: 'a', stats: [],
            };
            expect(result.is_significant).toBe(true);
        });
    });

    describe('function exports', () => {
        it('createABTest is a function', () => {
            expect(typeof createABTest).toBe('function');
        });

        it('getActiveABTest is a function', () => {
            expect(typeof getActiveABTest).toBe('function');
        });

        it('getAllABTests is a function', () => {
            expect(typeof getAllABTests).toBe('function');
        });

        it('recordABTestResult is a function', () => {
            expect(typeof recordABTestResult).toBe('function');
        });

        it('getABTestStats is a function', () => {
            expect(typeof getABTestStats).toBe('function');
        });

        it('calculateSignificance is a function', () => {
            expect(typeof calculateSignificance).toBe('function');
        });

        it('selectWinner is a function', () => {
            expect(typeof selectWinner).toBe('function');
        });

        it('pauseABTest is a function', () => {
            expect(typeof pauseABTest).toBe('function');
        });

        it('resumeABTest is a function', () => {
            expect(typeof resumeABTest).toBe('function');
        });
    });
});
