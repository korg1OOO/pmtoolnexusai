/**
 * useMLLearning Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { useLogMLPrediction, useRecordMLFeedback, useMLPredictionsByType, useMLProjectPredictions, useMLPredictionAccuracy, useActiveLearningPatterns, useCreateLearningPattern, useApplyLearningPatterns, useAllLearningPatterns, useToggleLearningPattern } from '@/hooks/useMLLearning';

describe('useMLLearning', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useLogMLPrediction).toBeDefined();
            expect(useRecordMLFeedback).toBeDefined();
            expect(useMLPredictionsByType).toBeDefined();
            expect(useMLProjectPredictions).toBeDefined();
            expect(useMLPredictionAccuracy).toBeDefined();
            expect(useActiveLearningPatterns).toBeDefined();
            expect(useCreateLearningPattern).toBeDefined();
            expect(useApplyLearningPatterns).toBeDefined();
            expect(useAllLearningPatterns).toBeDefined();
            expect(useToggleLearningPattern).toBeDefined();
        });
    });

    describe('useLogMLPrediction', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useLogMLPrediction(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
