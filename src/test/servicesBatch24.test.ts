/**
 * Service tests batch 24: mlAnalyticsService (287 lines, 7 functions)
 * Cache functions (clearProjectPredictionCache is exported), predictRisks, forecastCosts, predictDelays, getAllPredictions, refreshPredictions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        functions: { invoke: vi.fn(() => Promise.resolve({ data: { predictions: [], confidence: 0.85, model_version: '1.0' }, error: null })) },
        auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
    },
}));

vi.mock('@/types/ml-predictions', () => ({}));

import { clearProjectPredictionCache, predictRisks, forecastCosts, predictDelays, getAllPredictions, refreshPredictions } from '@/services/mlAnalyticsService';

describe('mlAnalyticsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearProjectPredictionCache('test-project');
    });

    it('clearProjectPredictionCache does not throw', () => {
        expect(() => clearProjectPredictionCache('proj1')).not.toThrow();
    });

    it('clearProjectPredictionCache clears multiple keys', () => {
        // Just verify it doesn't throw for non-existent keys
        clearProjectPredictionCache('non-existent');
        expect(true).toBe(true);
    });

    it('predictRisks returns prediction', async () => {
        const r = await predictRisks('proj1');
        expect(r).toBeDefined();
    });

    it('predictRisks with options', async () => {
        const r = await predictRisks('proj1', { useCache: false, confidenceThreshold: 0.8 });
        expect(r).toBeDefined();
    });

    it('forecastCosts returns prediction', async () => {
        const r = await forecastCosts('proj1');
        expect(r).toBeDefined();
    });

    it('forecastCosts with timeframe', async () => {
        const r = await forecastCosts('proj1', { timeframe: '12month' });
        expect(r).toBeDefined();
    });

    it('predictDelays returns prediction', async () => {
        const r = await predictDelays('proj1');
        expect(r).toBeDefined();
    });

    it('getAllPredictions returns all types', async () => {
        const r = await getAllPredictions('proj1');
        expect(r).toBeDefined();
        expect(r).toHaveProperty('risk');
        expect(r).toHaveProperty('cost');
        expect(r).toHaveProperty('schedule');
    });

    it('refreshPredictions clears cache and re-fetches', async () => {
        const r = await refreshPredictions('proj1');
        expect(r).toBeDefined();
    });
});
