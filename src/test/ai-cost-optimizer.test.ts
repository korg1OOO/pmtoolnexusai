/**
 * AI Cost Optimizer — Deep Tests
 * Tests pure static methods: generateRecommendations, estimateAlternativeCost, getMonthStart
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            then: (r: any) => r({ data: [], error: null }),
        })),
    },
}));

import { CostOptimizationAnalyzer } from '@/lib/ai-cost-optimizer';

describe('CostOptimizationAnalyzer', () => {
    describe('generateRecommendations', () => {
        it('returns an array', () => {
            const result = CostOptimizationAnalyzer.generateRecommendations([], [], 0);
            expect(Array.isArray(result)).toBe(true);
        });

        it('always includes general best practices', () => {
            const result = CostOptimizationAnalyzer.generateRecommendations([], [], 100);
            expect(result.some(r => r.includes('caching'))).toBe(true);
            expect(result.some(r => r.includes('streaming'))).toBe(true);
            expect(result.some(r => r.includes('Monitor'))).toBe(true);
        });

        it('includes model switch recommendation when alternatives exist', () => {
            const alts = [{
                current_model: 'gpt-4',
                current_provider: 'openai',
                alternative_model: 'gpt-4-turbo',
                alternative_provider: 'openai',
                current_cost_per_request: 0.05,
                alternative_cost_per_request: 0.03,
                potential_savings_per_request: 0.02,
                potential_monthly_savings: 100,
                savings_percentage: 40,
                performance_tradeoff: 'minimal' as const,
                recommendation: 'Use turbo',
            }];
            const result = CostOptimizationAnalyzer.generateRecommendations(alts, [], 500);
            expect(result.some(r => r.includes('Switch from'))).toBe(true);
            expect(result.some(r => r.includes('$100.00'))).toBe(true);
        });

        it('includes usage pattern recommendations', () => {
            const patterns = [{
                pattern_type: 'high_error_rate',
                description: '10% of requests are failing',
                current_cost: 50,
                optimized_cost: 0,
                savings: 50,
                action_items: ['Fix errors'],
            }];
            const result = CostOptimizationAnalyzer.generateRecommendations([], patterns, 500);
            expect(result.some(r => r.includes('10% of requests'))).toBe(true);
        });

        it('includes budget recommendation when cost > 5000', () => {
            const result = CostOptimizationAnalyzer.generateRecommendations([], [], 6000);
            expect(result.some(r => r.includes('department-level budgets'))).toBe(true);
        });

        it('excludes budget recommendation when cost <= 5000', () => {
            const result = CostOptimizationAnalyzer.generateRecommendations([], [], 3000);
            expect(result.some(r => r.includes('department-level budgets'))).toBe(false);
        });
    });

    describe('estimateAlternativeCost', () => {
        it('calculates cost based on token distribution', () => {
            const usage = { total_tokens: 1000, request_count: 10 };
            const currentPricing = { prompt_token_cost: 0.01, completion_token_cost: 0.03 };
            const altPricing = { prompt_token_cost: 0.005, completion_token_cost: 0.015 };

            const cost = CostOptimizationAnalyzer.estimateAlternativeCost(usage, currentPricing, altPricing);
            // 100 tokens/request * 0.3 prompt + 100 * 0.7 completion
            // = 30 * 0.005 + 70 * 0.015 = 0.15 + 1.05 = 1.2
            expect(cost).toBeCloseTo(1.2, 1);
        });

        it('returns 0 when no tokens', () => {
            const usage = { total_tokens: 0, request_count: 1 };
            const pricing = { prompt_token_cost: 0.01, completion_token_cost: 0.03 };
            const cost = CostOptimizationAnalyzer.estimateAlternativeCost(usage, pricing, pricing);
            expect(cost).toBe(0);
        });
    });

    describe('getMonthStart', () => {
        it('returns an ISO date string', () => {
            const result = CostOptimizationAnalyzer.getMonthStart();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });

        it('returns the first of the month', () => {
            const date = new Date(CostOptimizationAnalyzer.getMonthStart());
            expect(date.getDate()).toBe(1);
        });

        it('returns midnight', () => {
            const date = new Date(CostOptimizationAnalyzer.getMonthStart());
            expect(date.getHours()).toBe(0);
            expect(date.getMinutes()).toBe(0);
            expect(date.getSeconds()).toBe(0);
        });
    });

    describe('async methods shape', () => {
        it('generateReport is a static method', () => {
            expect(typeof CostOptimizationAnalyzer.generateReport).toBe('function');
        });

        it('analyzeModelAlternatives is a static method', () => {
            expect(typeof CostOptimizationAnalyzer.analyzeModelAlternatives).toBe('function');
        });

        it('analyzeUsagePatterns is a static method', () => {
            expect(typeof CostOptimizationAnalyzer.analyzeUsagePatterns).toBe('function');
        });
    });
});
