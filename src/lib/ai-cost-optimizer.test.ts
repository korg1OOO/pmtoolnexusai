/**
 * Tests for CostOptimizationAnalyzer static pure methods (425 lines)
 * generateRecommendations, estimateAlternativeCost, getMonthStart
 */
import { describe, it, expect, vi } from 'vitest';

// Mock supabase so the module loads
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn(),
        auth: { getUser: vi.fn() },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
    },
}));

import { CostOptimizationAnalyzer } from '@/lib/ai-cost-optimizer';

describe('CostOptimizationAnalyzer', () => {
    // === getMonthStart ===
    describe('getMonthStart', () => {
        it('returns ISO string', () => {
            const r = CostOptimizationAnalyzer.getMonthStart();
            expect(r).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });

        it('starts on day 1', () => {
            const r = CostOptimizationAnalyzer.getMonthStart();
            const d = new Date(r);
            expect(d.getDate()).toBe(1);
        });

        it('starts at midnight', () => {
            const r = CostOptimizationAnalyzer.getMonthStart();
            const d = new Date(r);
            expect(d.getHours()).toBe(0);
            expect(d.getMinutes()).toBe(0);
        });
    });

    // === estimateAlternativeCost ===
    describe('estimateAlternativeCost', () => {
        it('calculates cost with 30/70 split', () => {
            const usage = { total_tokens: 10000, request_count: 10 }; // 1000 tokens per request
            const currentPricing = { prompt_token_cost: 0.01, completion_token_cost: 0.03 };
            const altPricing = { prompt_token_cost: 0.005, completion_token_cost: 0.015 };

            const r = CostOptimizationAnalyzer.estimateAlternativeCost(usage, currentPricing, altPricing);
            // 300 prompt * 0.005 + 700 completion * 0.015 = 1.5 + 10.5 = 12
            expect(r).toBe(12);
        });

        it('returns 0 for 0 tokens', () => {
            const usage = { total_tokens: 0, request_count: 1 };
            const r = CostOptimizationAnalyzer.estimateAlternativeCost(usage, { prompt_token_cost: 0.01, completion_token_cost: 0.03 }, { prompt_token_cost: 0.005, completion_token_cost: 0.015 });
            expect(r).toBe(0);
        });
    });

    // === generateRecommendations ===
    describe('generateRecommendations', () => {
        it('always includes best practices', () => {
            const r = CostOptimizationAnalyzer.generateRecommendations([], [], 100);
            expect(r.length).toBeGreaterThanOrEqual(3);
            expect(r.some(x => x.includes('caching'))).toBe(true);
            expect(r.some(x => x.includes('streaming'))).toBe(true);
            expect(r.some(x => x.includes('Monitor'))).toBe(true);
        });

        it('includes model alternative when available', () => {
            const alts = [{
                current_model: 'gpt-4', current_provider: 'openai',
                alternative_model: 'gpt-4-turbo', alternative_provider: 'openai',
                current_cost_per_request: 0.10, alternative_cost_per_request: 0.05,
                potential_savings_per_request: 0.05, potential_monthly_savings: 50,
                savings_percentage: 50, performance_tradeoff: 'minimal' as const,
                recommendation: 'Switch',
            }];
            const r = CostOptimizationAnalyzer.generateRecommendations(alts, [], 100);
            expect(r.some(x => x.includes('Switch'))).toBe(true);
            expect(r.some(x => x.includes('$50.00'))).toBe(true);
        });

        it('includes pattern recommendations', () => {
            const patterns = [{
                pattern_type: 'error_rate', description: 'High error rate',
                current_cost: 100, optimized_cost: 80, savings: 20,
                action_items: ['Reduce errors'],
            }];
            const r = CostOptimizationAnalyzer.generateRecommendations([], patterns, 100);
            expect(r.some(x => x.includes('High error rate'))).toBe(true);
            expect(r.some(x => x.includes('$20.00'))).toBe(true);
        });

        it('includes budget recommendation for >$5000', () => {
            const r = CostOptimizationAnalyzer.generateRecommendations([], [], 6000);
            expect(r.some(x => x.includes('budget') || x.includes('$6000'))).toBe(true);
        });

        it('no budget recommendation for <$5000', () => {
            const r = CostOptimizationAnalyzer.generateRecommendations([], [], 100);
            expect(r.some(x => x.includes('department-level'))).toBe(false);
        });
    });
});
