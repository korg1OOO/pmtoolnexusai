/**
 * MLPages Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { MLModelsPage, MLAlertsPage, MLPredictionsPage, MLRetrainingPage, MLAccuracyPage, MLTrainingDataPage } from '@/components/ml/MLPages';

describe('MLPages', () => {
    it('exports MLModelsPage', () => {
        expect(MLModelsPage).toBeDefined();
    });
    it('exports MLAlertsPage', () => {
        expect(MLAlertsPage).toBeDefined();
    });
    it('exports MLPredictionsPage', () => {
        expect(MLPredictionsPage).toBeDefined();
    });
    it('exports MLRetrainingPage', () => {
        expect(MLRetrainingPage).toBeDefined();
    });
    it('exports MLAccuracyPage', () => {
        expect(MLAccuracyPage).toBeDefined();
    });
    it('exports MLTrainingDataPage', () => {
        expect(MLTrainingDataPage).toBeDefined();
    });
});
