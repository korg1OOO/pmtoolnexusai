/**
 * ML Learning Pattern Service
 * Manages learned patterns and applies them to improve predictions
 */

import { supabase } from '@/integrations/supabase/client';

export interface LearningPattern {
    id: string;
    pattern_type: string;
    prediction_type: string;
    context: any;
    adjustment: any;
    success_rate: number | null;
    sample_size: number;
    is_active: boolean;
    created_at: string;
}

export interface CreatePatternParams {
    pattern_type: string;
    prediction_type: string;
    context: any;
    adjustment: any;
    success_rate?: number;
}

/**
 * Create a new learning pattern
 */
export async function createLearningPattern(params: CreatePatternParams): Promise<LearningPattern> {
    const { data, error } = await supabase
        .from('ml_learning_patterns')
        .insert({
            pattern_type: params.pattern_type,
            prediction_type: params.prediction_type,
            context: params.context,
            adjustment: params.adjustment,
            success_rate: params.success_rate,
            sample_size: 1,
            is_active: true,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get active patterns for a prediction type
 */
export async function getActivePatternsForType(predictionType: string): Promise<LearningPattern[]> {
    const { data, error } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .eq('prediction_type', predictionType)
        .eq('is_active', true)
        .order('success_rate', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Apply learning patterns to enhance a prediction
 */
export async function applyLearningPatterns(
    predictionType: string,
    inputData: any,
    basePrediction: any,
    baseConfidence: number
): Promise<{
    enhancedPrediction: any;
    enhancedConfidence: number;
    appliedPatterns: string[];
}> {
    const patterns = await getActivePatternsForType(predictionType);

    let enhancedPrediction = { ...basePrediction };
    let enhancedConfidence = baseConfidence;
    const appliedPatterns: string[] = [];

    // Apply each matching pattern
    for (const pattern of patterns) {
        if (patternMatches(pattern.context, inputData)) {
            // Apply the adjustment
            enhancedPrediction = applyAdjustment(enhancedPrediction, pattern.adjustment);

            // Boost confidence based on pattern success rate
            if (pattern.success_rate) {
                enhancedConfidence = Math.min(1.0, enhancedConfidence + (pattern.success_rate * 0.1));
            }

            appliedPatterns.push(pattern.id);
        }
    }

    return {
        enhancedPrediction,
        enhancedConfidence,
        appliedPatterns,
    };
}

/**
 * Check if a pattern's context matches the input data
 */
function patternMatches(context: any, inputData: any): boolean {
    // Simple keyword matching - in production, use more sophisticated matching
    if (context.keywords && Array.isArray(context.keywords)) {
        const inputText = JSON.stringify(inputData).toLowerCase();
        return context.keywords.some((keyword: string) =>
            inputText.includes(keyword.toLowerCase())
        );
    }
    return false;
}

/**
 * Apply an adjustment to a prediction
 */
function applyAdjustment(prediction: any, adjustment: any): any {
    const enhanced = { ...prediction };

    // Apply each adjustment field
    Object.keys(adjustment).forEach(key => {
        if (key === 'priority' || key === 'risk_level') {
            enhanced[key] = adjustment[key];
        } else if (key === 'confidence_boost') {
            // Handled separately in applyLearningPatterns
        } else {
            enhanced[key] = adjustment[key];
        }
    });

    return enhanced;
}

/**
 * Update pattern success rate based on feedback
 */
export async function updatePatternSuccessRate(
    patternId: string,
    wasSuccessful: boolean
): Promise<void> {
    // Get current pattern
    const { data: pattern, error: fetchError } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .eq('id', patternId)
        .single();

    if (fetchError) throw fetchError;

    // Calculate new success rate
    const currentSuccesses = (pattern.success_rate || 0) * pattern.sample_size;
    const newSampleSize = pattern.sample_size + 1;
    const newSuccesses = currentSuccesses + (wasSuccessful ? 1 : 0);
    const newSuccessRate = newSuccesses / newSampleSize;

    // Update pattern
    const { error: updateError } = await supabase
        .from('ml_learning_patterns')
        .update({
            success_rate: newSuccessRate,
            sample_size: newSampleSize,
        })
        .eq('id', patternId);

    if (updateError) throw updateError;
}

/**
 * Get all learning patterns with statistics
 */
export async function getAllPatternsWithStats(): Promise<LearningPattern[]> {
    const { data, error } = await supabase
        .from('ml_learning_patterns')
        .select('*')
        .order('success_rate', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Deactivate a learning pattern
 */
export async function deactivatePattern(patternId: string): Promise<void> {
    const { error } = await supabase
        .from('ml_learning_patterns')
        .update({ is_active: false })
        .eq('id', patternId);

    if (error) throw error;
}

/**
 * Activate a learning pattern
 */
export async function activatePattern(patternId: string): Promise<void> {
    const { error } = await supabase
        .from('ml_learning_patterns')
        .update({ is_active: true })
        .eq('id', patternId);

    if (error) throw error;
}
