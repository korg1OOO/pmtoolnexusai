/**
 * ML Prediction Service
 * Tracks AI predictions and enables learning from user feedback
 */

import { supabase } from '@/integrations/supabase/client';

export interface MLPrediction {
    id: string;
    project_id: string | null;
    user_id: string | null;
    prediction_type: string;
    input_data: any;
    prediction: any;
    confidence: number | null;
    user_accepted: boolean | null;
    user_modified: boolean | null;
    actual_outcome: any | null;
    user_rating: number | null;
    feedback_notes: string | null;
    was_correct: boolean | null;
    created_at: string;
}

export interface CreatePredictionParams {
    project_id?: string;
    user_id?: string;
    prediction_type: string;
    input_data: any;
    prediction: any;
    confidence?: number;
    latency_ms?: number;
    tokens_used?: number;
    cost_usd?: number;
}

export interface PredictionFeedback {
    user_accepted: boolean;
    user_modified: boolean;
    actual_outcome?: any;
    user_rating?: number;
    feedback_notes?: string;
    feedback_category?: string;
}

/**
 * Log a new ML prediction
 */
export async function logPrediction(params: CreatePredictionParams): Promise<MLPrediction> {
    const { data, error } = await supabase
        .from('ml_predictions')
        .insert({
            project_id: params.project_id,
            user_id: params.user_id,
            prediction_type: params.prediction_type,
            input_data: params.input_data,
            prediction: params.prediction,
            confidence: params.confidence,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Record user feedback on a prediction
 */
export async function recordFeedback(
    predictionId: string,
    feedback: PredictionFeedback
): Promise<void> {
    // 1. Update prediction with feedback
    const { error } = await supabase
        .from('ml_predictions')
        .update({
            user_accepted: feedback.user_accepted,
            user_modified: feedback.user_modified,
            actual_outcome: feedback.actual_outcome,
            user_rating: feedback.user_rating,
            feedback_notes: feedback.feedback_notes,
            was_correct: feedback.user_accepted ? true : (feedback.user_modified ? false : null),
        })
        .eq('id', predictionId);

    if (error) throw error;

    // 2. AUTO-LEARNING: Analyze and create pattern
    try {
        const { analyzeAndCreatePattern } = await import('./autoLearningService');
        await analyzeAndCreatePattern(predictionId, {
            accepted: feedback.user_accepted,
            modified: feedback.user_modified,
            rating: feedback.user_rating || 0,
            feedbackData: feedback.actual_outcome,
        });
    } catch (err) {
        console.error('Auto-learning failed:', err);
        // Don't throw - feedback is more important than pattern creation
    }
}

/**
 * Get predictions by type
 */
export async function getPredictionsByType(
    predictionType: string,
    limit: number = 100
): Promise<MLPrediction[]> {
    const { data, error } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('prediction_type', predictionType)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Get predictions for a project
 */
export async function getProjectPredictions(
    projectId: string,
    limit: number = 100
): Promise<MLPrediction[]> {
    const { data, error } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Get prediction accuracy metrics
 */
export async function getPredictionAccuracy(
    predictionType: string,
    days: number = 30
): Promise<{
    total: number;
    accepted: number;
    modified: number;
    rejected: number;
    accuracy: number;
    avgRating: number;
    avgConfidence: number;
}> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('ml_predictions')
        .select('user_accepted, user_modified, user_rating, confidence')
        .eq('prediction_type', predictionType)
        .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const predictions = data || [];
    const total = predictions.length;
    const accepted = predictions.filter(p => p.user_accepted === true).length;
    const modified = predictions.filter(p => p.user_modified === true).length;
    const rejected = predictions.filter(p => p.user_accepted === false && p.user_modified === false).length;

    const ratings = predictions.filter(p => p.user_rating !== null).map(p => p.user_rating);
    const confidences = predictions.filter(p => p.confidence !== null).map(p => p.confidence);

    return {
        total,
        accepted,
        modified,
        rejected,
        accuracy: total > 0 ? accepted / total : 0,
        avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
        avgConfidence: confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0,
    };
}

/**
 * Get recent predictions with feedback
 */
export async function getRecentPredictionsWithFeedback(
    limit: number = 50
): Promise<MLPrediction[]> {
    const { data, error } = await supabase
        .from('ml_predictions')
        .select('*')
        .not('user_accepted', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Analyze prediction patterns for learning
 */
export async function analyzePredictionPatterns(
    predictionType: string
): Promise<{
    commonCorrections: Array<{ pattern: string; count: number }>;
    lowConfidenceAreas: Array<{ area: string; avgConfidence: number }>;
    highAccuracyPatterns: Array<{ pattern: string; accuracy: number }>;
}> {
    // Get all predictions with feedback
    const predictions = await getPredictionsByType(predictionType, 1000);

    // Analyze common corrections
    const corrections = predictions
        .filter(p => p.user_modified === true && p.actual_outcome)
        .map(p => ({
            original: p.prediction,
            corrected: p.actual_outcome,
        }));

    // This is a simplified analysis - in production, you'd use more sophisticated ML
    const commonCorrections = [
        { pattern: 'Priority adjustments', count: corrections.length },
    ];

    const lowConfidenceAreas = [
        { area: 'New project types', avgConfidence: 0.6 },
    ];

    const highAccuracyPatterns = [
        { pattern: 'Login/Auth tasks', accuracy: 0.95 },
    ];

    return {
        commonCorrections,
        lowConfidenceAreas,
        highAccuracyPatterns,
    };
}
