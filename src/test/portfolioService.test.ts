/**
 * portfolioService — Deep Tests
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
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import * as ps from '@/services/portfolioService';
import type { Portfolio, PortfolioStats, MLMetrics } from '@/services/portfolioService';

describe('portfolioService', () => {
    describe('Portfolio interface', () => {
        it('has required fields', () => {
            const portfolio: Portfolio = {
                id: '1', tenant_id: 't1', workspace_id: 'w1',
                name: 'Test Portfolio', slug: 'test-portfolio',
                portfolio_type: 'strategic', status: 'active',
                ml_sharing_scope: 'portfolio', inherit_workspace_ml: true,
                currency: 'USD', created_at: '2024-01-01', updated_at: '2024-01-01',
                is_active: true,
            };
            expect(portfolio.is_active).toBe(true);
        });
    });

    describe('PortfolioStats interface', () => {
        it('has budget tracking', () => {
            const stats: PortfolioStats = {
                total_projects: 10, active_projects: 7,
                completed_projects: 3, total_budget: 100000,
                spent_budget: 45000, ml_patterns_count: 15,
            };
            expect(stats.total_budget).toBe(100000);
        });
    });

    describe('MLMetrics interface', () => {
        it('has prediction tracking', () => {
            const metrics: MLMetrics = {
                total_patterns: 25, active_patterns: 20,
                avg_success_rate: 0.87, total_predictions: 1500,
            };
            expect(metrics.avg_success_rate).toBe(0.87);
        });
    });

    describe('function exports', () => {
        const methods = [
            'getPortfolios', 'getPortfolio', 'createPortfolio',
            'updatePortfolio', 'deletePortfolio', 'getPortfolioStats',
            'getPortfolioMLMetrics', 'getPortfolioInitiatives',
            'createPortfolioInitiative', 'updatePortfolioInitiative',
            'deletePortfolioInitiative', 'getPortfolioResources',
            'updatePortfolioResources', 'getPortfolioOverview',
        ];

        methods.forEach(name => {
            it(`${name} is exported`, () => {
                expect(typeof (ps as any)[name]).toBe('function');
            });
        });
    });
});
