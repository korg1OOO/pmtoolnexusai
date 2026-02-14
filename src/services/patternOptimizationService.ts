/**
 * Pattern Optimization Service
 * Optimizes patterns based on performance data
 */

import { supabase } from '@/integrations/supabase/client';

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
 * Optimize a single pattern based on performance
 */
export async function optimizePattern(patternId: string): Promise<Pattern | null> {
    try {
        const { data: pattern } = await supabase
            .from('ml_learning_patterns')
            .select('*')
            .eq('id', patternId)
            .single();

        if (!pattern) return null;

        // Skip if not enough data
        if (pattern.application_count < 20) {
            console.log(`Pattern ${patternId} needs more applications (${pattern.application_count}/20)`);
            return null;
        }

        // Optimize based on success rate
        let optimizedAdjustment = { ...pattern.adjustment };

        if (pattern.success_rate > 0.8) {
            // High success - boost confidence adjustment
            if (optimizedAdjustment.type === 'boost_confidence') {
                optimizedAdjustment.value = Math.min(optimizedAdjustment.value * 1.2, 0.3);
            }
        } else if (pattern.success_rate < 0.6) {
            // Low success - reduce confidence adjustment
            if (optimizedAdjustment.type === 'boost_confidence') {
                optimizedAdjustment.value = Math.max(optimizedAdjustment.value * 0.8, 0.05);
            }
        }

        // Update pattern
        const { data, error } = await supabase
            .from('ml_learning_patterns')
            .update({
                adjustment: optimizedAdjustment,
            })
            .eq('id', patternId)
            .select()
            .single();

        if (error) {
            console.error('Error optimizing pattern:', error);
            return null;
        }

        console.log(`✅ Optimized pattern ${patternId}`);

        // Track optimization
        await trackPatternOptimization(pattern.pattern_type.split('_')[0]);

        return data as Pattern;
    } catch (error) {
        console.error('Error in optimizePattern:', error);
        return null;
    }
}

/**
 * Optimize all eligible patterns
 */
export async function optimizeAllPatterns(): Promise<number> {
    try {
        const { data: patterns } = await supabase
            .from('ml_learning_patterns')
            .select('*')
            .eq('is_active', true)
            .gte('application_count', 20);

        if (!patterns) return 0;

        let optimizedCount = 0;
        for (const pattern of patterns) {
            const result = await optimizePattern(pattern.id);
            if (result) optimizedCount++;
        }

        console.log(`✅ Optimized ${optimizedCount} patterns`);
        return optimizedCount;
    } catch (error) {
        console.error('Error in optimizeAllPatterns:', error);
        return 0;
    }
}

/**
 * Merge similar patterns to reduce redundancy
 */
export async function mergeSimilarPatterns(): Promise<number> {
    try {
        const { data: patterns } = await supabase
            .from('ml_learning_patterns')
            .select('*')
            .eq('is_active', true)
            .order('success_rate', { ascending: false });

        if (!patterns || patterns.length < 2) return 0;

        let mergedCount = 0;
        const processedIds = new Set<string>();

        for (let i = 0; i < patterns.length; i++) {
            if (processedIds.has(patterns[i].id)) continue;

            for (let j = i + 1; j < patterns.length; j++) {
                if (processedIds.has(patterns[j].id)) continue;

                if (areSimilarPatterns(patterns[i], patterns[j])) {
                    await mergePatterns(patterns[i], patterns[j]);
                    processedIds.add(patterns[j].id);
                    mergedCount++;
                }
            }
        }

        console.log(`✅ Merged ${mergedCount} similar patterns`);
        return mergedCount;
    } catch (error) {
        console.error('Error in mergeSimilarPatterns:', error);
        return 0;
    }
}

/**
 * Check if two patterns are similar
 */
function areSimilarPatterns(p1: Pattern, p2: Pattern): boolean {
    // Same type
    if (p1.pattern_type !== p2.pattern_type) return false;

    // Similar context
    const c1 = p1.context || {};
    const c2 = p2.context || {};

    return (
        c1.predictionType === c2.predictionType &&
        c1.category === c2.category
    );
}

/**
 * Merge two patterns (keep better one, deactivate other)
 */
async function mergePatterns(keepPattern: Pattern, removePattern: Pattern): Promise<void> {
    // Calculate combined stats
    const totalApplications = keepPattern.application_count + removePattern.application_count;
    const keepSuccesses = Math.round(keepPattern.success_rate * keepPattern.application_count);
    const removeSuccesses = Math.round(removePattern.success_rate * removePattern.application_count);
    const combinedSuccessRate = (keepSuccesses + removeSuccesses) / totalApplications;

    // Update keep pattern with combined stats
    await supabase
        .from('ml_learning_patterns')
        .update({
            application_count: totalApplications,
            success_rate: combinedSuccessRate,
        })
        .eq('id', keepPattern.id);

    // Deactivate remove pattern
    await supabase
        .from('ml_learning_patterns')
        .update({
            is_active: false,
        })
        .eq('id', removePattern.id);

    console.log(`Merged pattern ${removePattern.id} into ${keepPattern.id}`);
}

/**
 * Adjust confidence thresholds for a prediction type
 */
export async function adjustConfidenceThresholds(predictionType: string): Promise<void> {
    try {
        // Get recent predictions for this type
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: predictions } = await supabase
            .from('ml_predictions')
            .select('*')
            .eq('prediction_type', predictionType)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .not('user_accepted', 'is', null);

        if (!predictions || predictions.length < 10) {
            console.log(`Not enough data for ${predictionType}`);
            return;
        }

        // Calculate accuracy
        const accepted = predictions.filter(p => p.user_accepted).length;
        const accuracy = accepted / predictions.length;

        console.log(`${predictionType} accuracy: ${(accuracy * 100).toFixed(1)}%`);

        // Get patterns for this type
        const { data: patterns } = await supabase
            .from('ml_learning_patterns')
            .select('*')
            .like('pattern_type', `${predictionType}%`)
            .eq('is_active', true);

        if (!patterns) return;

        // Adjust confidence based on accuracy
        let adjustmentFactor = 1.0;
        if (accuracy > 0.9) {
            adjustmentFactor = 1.05; // Increase confidence by 5%
        } else if (accuracy < 0.7) {
            adjustmentFactor = 0.95; // Decrease confidence by 5%
        }

        if (adjustmentFactor !== 1.0) {
            for (const pattern of patterns) {
                if (pattern.adjustment?.type === 'boost_confidence') {
                    const newValue = pattern.adjustment.value * adjustmentFactor;
                    await supabase
                        .from('ml_learning_patterns')
                        .update({
                            adjustment: {
                                ...pattern.adjustment,
                                value: Math.max(0.05, Math.min(0.3, newValue)),
                            },
                        })
                        .eq('id', pattern.id);
                }
            }

            console.log(`✅ Adjusted confidence for ${predictionType} by ${((adjustmentFactor - 1) * 100).toFixed(1)}%`);
        }
    } catch (error) {
        console.error('Error in adjustConfidenceThresholds:', error);
    }
}

/**
 * Track pattern optimization for velocity metrics
 */
async function trackPatternOptimization(predictionType: string): Promise<void> {
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
                patterns_optimized: existing.patterns_optimized + 1,
            })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('ml_learning_velocity')
            .insert({
                date: today,
                prediction_type: predictionType,
                patterns_created: 0,
                patterns_optimized: 1,
                patterns_pruned: 0,
            });
    }
}
