/**
 * mlPredictionService — Deep Tests
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
            gte: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import * as mlPred from '@/services/mlPredictionService';
import type { MLPrediction, CreatePredictionParams, PredictionFeedback } from '@/services/mlPredictionService';

describe('mlPredictionService', () => {
    describe('MLPrediction interface', () => {
        it('has feedback fields', () => {
            const pred: MLPrediction = {
                id: '1', project_id: 'p1', user_id: 'u1',
                prediction_type: 'cost_estimate', input_data: {},
                prediction: { cost: 5000 }, confidence: 0.85,
                user_accepted: true, user_modified: false,
                actual_outcome: null, user_rating: 4,
                feedback_notes: 'Accurate', was_correct: true,
                created_at: '2024-01-01',
            };
            expect(pred.prediction_type).toBe('cost_estimate');
        });

        it('nullable fields default correctly', () => {
            const pred: MLPrediction = {
                id: '1', project_id: null, user_id: null,
                prediction_type: 'test', input_data: {},
                prediction: {}, confidence: null,
                user_accepted: null, user_modified: null,
                actual_outcome: null, user_rating: null,
                feedback_notes: null, was_correct: null,
                created_at: '2024-01-01',
            };
            expect(pred.confidence).toBeNull();
        });
    });

    describe('CreatePredictionParams interface', () => {
        it('has required fields', () => {
            const params: CreatePredictionParams = {
                prediction_type: 'duration', input_data: { tasks: 5 },
                prediction: { days: 10 },
            };
            expect(params.prediction_type).toBe('duration');
        });

        it('has optional cost tracking', () => {
            const params: CreatePredictionParams = {
                prediction_type: 'cost', input_data: {},
                prediction: {}, latency_ms: 250,
                tokens_used: 500, cost_usd: 0.05,
            };
            expect(params.cost_usd).toBe(0.05);
        });
    });

    describe('PredictionFeedback interface', () => {
        it('has required boolean fields', () => {
            const feedback: PredictionFeedback = {
                user_accepted: true, user_modified: false,
            };
            expect(feedback.user_accepted).toBe(true);
        });

        it('has optional feedback fields', () => {
            const feedback: PredictionFeedback = {
                user_accepted: false, user_modified: true,
                actual_outcome: { cost: 6000 }, user_rating: 2,
                feedback_notes: 'Overestimated', feedback_category: 'accuracy',
            };
            expect(feedback.feedback_category).toBe('accuracy');
        });
    });

    describe('function exports', () => {
        const methods = [
            'logPrediction', 'recordFeedback', 'getPredictionsByType',
            'getProjectPredictions', 'getPredictionAccuracy',
            'getRecentPredictionsWithFeedback', 'analyzePredictionPatterns',
        ];

        methods.forEach(name => {
            it(`${name} is exported`, () => {
                expect(typeof (mlPred as any)[name]).toBe('function');
            });
        });
    });
});
