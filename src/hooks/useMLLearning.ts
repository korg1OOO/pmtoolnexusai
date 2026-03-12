/**
 * React hooks for ML Learning Loop - feedback and pattern management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as mlPredictionService from '@/services/mlPredictionService';
import * as mlLearningService from '@/services/mlLearningService';

/**
 * Hook to log a new ML prediction
 */
export function useLogMLPrediction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: mlPredictionService.logPrediction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ml-learning-predictions'] });
        },
        onError: (error: Error) => {
            console.error('Failed to log prediction:', error);
        },
    });
}

/**
 * Hook to record user feedback on a prediction
 */
export function useRecordMLFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ predictionId, feedback }: {
            predictionId: string;
            feedback: mlPredictionService.PredictionFeedback
        }) => mlPredictionService.recordFeedback(predictionId, feedback),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ml-learning-predictions'] });
            queryClient.invalidateQueries({ queryKey: ['ml-learning-accuracy'] });
            toast.success('Thank you for your feedback!');
        },
        onError: (error: Error) => {
            toast.error('Failed to record feedback');
            console.error('Failed to record feedback:', error);
        },
    });
}

/**
 * Hook to get predictions by type
 */
export function useMLPredictionsByType(predictionType: string, limit?: number) {
    return useQuery({
        queryKey: ['ml-learning-predictions', predictionType, limit],
        queryFn: () => mlPredictionService.getPredictionsByType(predictionType, limit),
    });
}

/**
 * Hook to get project predictions
 */
export function useMLProjectPredictions(projectId: string, limit?: number) {
    return useQuery({
        queryKey: ['ml-learning-predictions', 'project', projectId, limit],
        queryFn: () => mlPredictionService.getProjectPredictions(projectId, limit),
        enabled: !!projectId,
    });
}

/**
 * Hook to get prediction accuracy metrics
 */
export function useMLPredictionAccuracy(predictionType: string, days?: number) {
    return useQuery({
        queryKey: ['ml-learning-accuracy', predictionType, days],
        queryFn: () => mlPredictionService.getPredictionAccuracy(predictionType, days),
    });
}

/**
 * Hook to get active learning patterns
 */
export function useActiveLearningPatterns(predictionType: string) {
    return useQuery({
        queryKey: ['ml-learning-patterns', predictionType],
        queryFn: () => mlLearningService.getActivePatternsForType(predictionType),
    });
}

/**
 * Hook to create a learning pattern
 */
export function useCreateLearningPattern() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: mlLearningService.createLearningPattern,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ml-learning-patterns'] });
            toast.success('Learning pattern created');
        },
        onError: (error: Error) => {
            toast.error('Failed to create pattern');
            console.error('Failed to create pattern:', error);
        },
    });
}

/**
 * Hook to apply learning patterns to a prediction
 */
export function useApplyLearningPatterns() {
    return useMutation({
        mutationFn: ({
            predictionType,
            inputData,
            basePrediction,
            baseConfidence
        }: {
            predictionType: string;
            inputData: any;
            basePrediction: any;
            baseConfidence: number;
        }) => mlLearningService.applyLearningPatterns(
            predictionType,
            inputData,
            basePrediction,
            baseConfidence
        ),
    });
}

/**
 * Hook to get all patterns with statistics
 */
export function useAllLearningPatterns() {
    return useQuery({
        queryKey: ['ml-learning-patterns', 'all'],
        queryFn: mlLearningService.getAllPatternsWithStats,
    });
}

/**
 * Hook to toggle pattern activation
 */
export function useToggleLearningPattern() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ patternId, activate }: { patternId: string; activate: boolean }) =>
            activate
                ? mlLearningService.activatePattern(patternId)
                : mlLearningService.deactivatePattern(patternId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ml-learning-patterns'] });
            toast.success('Pattern updated');
        },
        onError: (error: Error) => {
            toast.error('Failed to update pattern');
            console.error('Failed to update pattern:', error);
        },
    });
}
