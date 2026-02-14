/**
 * Auto-Learning Service
 * Automatically creates patterns from user feedback
 */

import { supabase } from '@/integrations/supabase/client';
import type { MLPrediction } from './mlPredictionService';

interface FeedbackData {
    accepted: boolean;
    modified: boolean;
    rating: number;
    feedbackData?: any;
}

interface PatternContext {
    predictionType: string;
    projectId: string;
    category?: string;
    inputDataHash: string;
}

interface Pattern {
    id: string;
    pattern_type: string;
    context: any;
    adjustment: any;
    success_rate: number;
    application_count: number;
    is_active: boolean;
}

/**
 * Main function: Analyze feedback and create pattern if beneficial
 */
export async function analyzeAndCreatePattern(
    predictionId: string,
    feedback: FeedbackData
): Promise<Pattern | null> {
    try {
        // 1. Get auto-learning config
        const config = await getAutoLearningConfig();
        if (!config.enabled) {
            console.log('Auto-learning disabled');
            return null;
        }

        // 2. Get prediction details
        const { data: prediction } = await supabase
            .from('ml_predictions')
            .select('*')
            .eq('id', predictionId)
            .single();

        if (!prediction) return null;

        // 3. Extract context
        const context = extractContext(prediction);

        // 4. Check if similar pattern exists
        const existingPattern = await findSimilarPattern(context);
        if (existingPattern) {
            console.log('Similar pattern exists, updating instead');
            return await updatePatternStats(existingPattern.id, feedback.accepted);
        }

        // 5. Check if we have enough similar feedbacks
        const similarFeedbackCount = await countSimilarFeedbacks(context);
        if (similarFeedbackCount < config.min_feedbacks_for_pattern) {
            console.log(`Not enough similar feedbacks: ${similarFeedbackCount}/${config.min_feedbacks_for_pattern}`);
            return null;
        }

        // 6. Create new pattern
        return await createPatternFromFeedback(prediction, feedback);
    } catch (error) {
        console.error('Error in analyzeAndCreatePattern:', error);
        return null;
    }
}

/**
 * Get auto-learning configuration
 */
async function getAutoLearningConfig() {
    const { data } = await supabase
        .from('ml_auto_learning_config')
        .select('*')
        .single();

    return data || {
        enabled: true,
        min_feedbacks_for_pattern: 3,
        min_success_rate_threshold: 0.4,
        pruning_enabled: true,
        optimization_enabled: true,
    };
}

/**
 * Extract context from prediction
 */
function extractContext(prediction: MLPrediction): PatternContext {
    const inputDataStr = JSON.stringify(prediction.input_data || {});
    const inputDataHash = simpleHash(inputDataStr);

    return {
        predictionType: prediction.prediction_type,
        projectId: prediction.project_id,
        category: prediction.input_data?.category,
        inputDataHash,
    };
}

/**
 * Simple hash function for input data
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * Find similar existing pattern
 */
async function findSimilarPattern(context: PatternContext): Promise<Pattern | null> {
    const { data } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .eq('pattern_type', context.predictionType)
        .eq('is_active', true)
        .limit(1);

    if (!data || data.length === 0) return null;

    // Check if context is similar
    for (const pattern of data) {
        const patternContext = pattern.context || {};
        if (
            patternContext.category === context.category &&
            patternContext.inputDataHash === context.inputDataHash
        ) {
            return pattern as Pattern;
        }
    }

    return null;
}

/**
 * Count similar feedbacks for this context
 */
async function countSimilarFeedbacks(context: PatternContext): Promise<number> {
    const { data } = await supabase
        .from('ml_predictions')
        .select('id')
        .eq('prediction_type', context.predictionType)
        .eq('project_id', context.projectId)
        .not('user_accepted', 'is', null);

    return data?.length || 0;
}

/**
 * Create new pattern from feedback
 */
async function createPatternFromFeedback(
    prediction: MLPrediction,
    feedback: FeedbackData
): Promise<Pattern | null> {
    try {
        const patternType = determinePatternType(feedback);
        const context = extractContext(prediction);
        const adjustment = createAdjustment(prediction, feedback);

        const { data, error } = await supabase
            .from('ml_learning_patterns')
            .insert({
                pattern_type: `${prediction.prediction_type}_${patternType}`,
                context: {
                    predictionType: context.predictionType,
                    category: context.category,
                    inputDataHash: context.inputDataHash,
                },
                adjustment: adjustment,
                success_rate: 0.5, // Initial neutral success rate
                application_count: 0,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating pattern:', error);
            return null;
        }

        console.log('✅ Auto-created pattern:', data.id);

        // Track velocity
        await trackPatternCreation(prediction.prediction_type);

        return data as Pattern;
    } catch (error) {
        console.error('Error in createPatternFromFeedback:', error);
        return null;
    }
}

/**
 * Determine pattern type from feedback
 */
function determinePatternType(feedback: FeedbackData): string {
    if (feedback.accepted && !feedback.modified) return 'success';
    if (feedback.modified) return 'adjustment';
    return 'avoidance';
}

/**
 * Create adjustment object from feedback
 */
function createAdjustment(prediction: MLPrediction, feedback: FeedbackData): any {
    if (feedback.accepted && !feedback.modified) {
        return {
            type: 'boost_confidence',
            value: 0.1,
        };
    }

    if (feedback.modified && feedback.feedbackData) {
        return {
            type: 'modify_prediction',
            originalPrediction: prediction.prediction,
            modifiedPrediction: feedback.feedbackData,
        };
    }

    return {
        type: 'reduce_confidence',
        value: -0.2,
    };
}

/**
 * Update pattern statistics
 */
async function updatePatternStats(
    patternId: string,
    wasSuccessful: boolean
): Promise<Pattern | null> {
    const { data: pattern } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .eq('id', patternId)
        .single();

    if (!pattern) return null;

    const newApplicationCount = pattern.application_count + 1;
    const currentSuccessCount = Math.round(pattern.success_rate * pattern.application_count);
    const newSuccessCount = currentSuccessCount + (wasSuccessful ? 1 : 0);
    const newSuccessRate = newSuccessCount / newApplicationCount;

    const { data, error } = await supabase
        .from('ml_learning_patterns')
        .update({
            application_count: newApplicationCount,
            success_rate: newSuccessRate,
        })
        .eq('id', patternId)
        .select()
        .single();

    if (error) {
        console.error('Error updating pattern stats:', error);
        return null;
    }

    return data as Pattern;
}

/**
 * Track pattern creation for velocity metrics
 */
async function trackPatternCreation(predictionType: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
        .from('ml_learning_velocity')
        .select('*')
        .eq('date', today)
        .eq('prediction_type', predictionType)
        .single();

    if (existing) {
        await supabase
            .from('ml_learning_velocity')
            .update({
                patterns_created: existing.patterns_created + 1,
            })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('ml_learning_velocity')
            .insert({
                date: today,
                prediction_type: predictionType,
                patterns_created: 1,
                patterns_optimized: 0,
                patterns_pruned: 0,
            });
    }
}
