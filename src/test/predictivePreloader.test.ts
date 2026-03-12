/**
 * Predictive Preloader Tests
 *
 * Tests pure functions: getPredictedRoutes, updateRoutePredictions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/routePreloader', () => ({
    preloadRoutes: vi.fn(),
}));

import {
    getPredictedRoutes,
    updateRoutePredictions,
    preloadPredictedRoutes,
} from '@/utils/predictivePreloader';

describe('predictivePreloader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── getPredictedRoutes (pure map lookup) ────────────────────────

    describe('getPredictedRoutes', () => {
        it('returns predictions for dashboard', () => {
            const routes = getPredictedRoutes('/dashboard');
            expect(routes).toContain('/gantt');
            expect(routes).toContain('/sprint-board');
            expect(routes.length).toBeGreaterThanOrEqual(3);
        });

        it('returns predictions for gantt', () => {
            const routes = getPredictedRoutes('/gantt');
            expect(routes).toContain('/sprint-board');
            expect(routes).toContain('/planning');
        });

        it('returns predictions for financials', () => {
            const routes = getPredictedRoutes('/financials');
            expect(routes).toContain('/evm');
        });

        it('returns predictions for meetings', () => {
            const routes = getPredictedRoutes('/meetings');
            expect(routes).toContain('/calendar');
        });

        it('returns empty array for unknown route', () => {
            const routes = getPredictedRoutes('/nonexistent');
            expect(routes).toEqual([]);
        });
    });

    // ─── updateRoutePredictions (pure map mutation) ──────────────────

    describe('updateRoutePredictions', () => {
        it('adds new route predictions', () => {
            updateRoutePredictions('/custom-page', ['/dashboard', '/settings']);

            const routes = getPredictedRoutes('/custom-page');
            expect(routes).toEqual(['/dashboard', '/settings']);
        });

        it('overwrites existing route predictions', () => {
            const original = getPredictedRoutes('/dashboard');
            updateRoutePredictions('/dashboard', ['/new-route']);

            const updated = getPredictedRoutes('/dashboard');
            expect(updated).toEqual(['/new-route']);

            // Restore
            updateRoutePredictions('/dashboard', original);
        });
    });

    // ─── Service shape ──────────────────────────────────────────────

    describe('exports', () => {
        it('exports all expected functions', () => {
            expect(typeof getPredictedRoutes).toBe('function');
            expect(typeof updateRoutePredictions).toBe('function');
            expect(typeof preloadPredictedRoutes).toBe('function');
        });
    });
});
