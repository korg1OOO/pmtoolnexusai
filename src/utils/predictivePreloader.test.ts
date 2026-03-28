/**
 * Deep tests for predictivePreloader (111 lines)
 * Tests: getPredictedRoutes, updateRoutePredictions, preloadPredictedRoutes
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock routePreloader since it imports lazy React components
vi.mock('./routePreloader', () => ({
    preloadRoutes: vi.fn(),
}));

import { getPredictedRoutes, updateRoutePredictions, preloadPredictedRoutes } from './predictivePreloader';
import { preloadRoutes } from './routePreloader';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getPredictedRoutes', () => {
    it('returns predictions for /dashboard', () => {
        const r = getPredictedRoutes('/dashboard');
        expect(r).toContain('/gantt');
        expect(r).toContain('/sprint-board');
        expect(r.length).toBeGreaterThan(0);
    });

    it('returns predictions for /gantt', () => {
        const r = getPredictedRoutes('/gantt');
        expect(r).toContain('/sprint-board');
    });

    it('returns predictions for /meetings', () => {
        const r = getPredictedRoutes('/meetings');
        expect(r).toContain('/calendar');
    });

    it('returns empty for unknown route', () => {
        expect(getPredictedRoutes('/totally-random')).toEqual([]);
    });

    it('returns predictions for /financials', () => {
        const r = getPredictedRoutes('/financials');
        expect(r).toContain('/evm');
        expect(r).toContain('/reports');
    });

    it('returns predictions for /reports', () => {
        const r = getPredictedRoutes('/reports');
        expect(r).toContain('/dashboard');
    });

    it('returns predictions for /settings', () => {
        const r = getPredictedRoutes('/settings');
        expect(r).toContain('/project-admin');
    });

    it('returns predictions for /risks', () => {
        expect(getPredictedRoutes('/risks').length).toBeGreaterThan(0);
    });

    it('returns predictions for /communications', () => {
        expect(getPredictedRoutes('/communications')).toContain('/communication-intelligence');
    });
});

describe('updateRoutePredictions', () => {
    it('adds new route predictions', () => {
        updateRoutePredictions('/custom-page', ['/dashboard', '/reports']);
        expect(getPredictedRoutes('/custom-page')).toEqual(['/dashboard', '/reports']);
    });

    it('overwrites existing predictions', () => {
        updateRoutePredictions('/dashboard', ['/custom']);
        expect(getPredictedRoutes('/dashboard')).toEqual(['/custom']);
        // Restore
        updateRoutePredictions('/dashboard', ['/gantt', '/sprint-board', '/planning', '/meetings']);
    });
});

describe('preloadPredictedRoutes', () => {
    it('calls preloadRoutes for valid route', () => {
        preloadPredictedRoutes('/gantt');
        expect(preloadRoutes).toHaveBeenCalledWith(expect.arrayContaining(['/sprint-board']));
    });

    it('does not call preloadRoutes for unknown route', () => {
        preloadPredictedRoutes('/nonexistent');
        expect(preloadRoutes).not.toHaveBeenCalled();
    });
});
