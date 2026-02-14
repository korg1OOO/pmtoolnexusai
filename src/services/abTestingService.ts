/**
 * A/B Testing Service
 * Manages A/B tests for ML patterns
 */

import { supabase as _supabase } from '@/integrations/supabase/client';

const supabase = _supabase as any;

export interface ABTest {
    id: string;
    name: string;
    description: string | null;
    pattern_a_id: string;
    pattern_b_id: string;
    pattern_c_id: string | null;
    pattern_d_id: string | null;
    traffic_split: Record<string, number>;
    status: 'running' | 'paused' | 'completed';
    winner_pattern_id: string | null;
    confidence_level: number | null;
    started_at: string;
    ended_at: string | null;
    created_at: string;
}

export interface CreateABTestParams {
    name: string;
    description?: string;
    pattern_a_id: string;
    pattern_b_id: string;
    pattern_c_id?: string;
    pattern_d_id?: string;
    traffic_split?: Record<string, number>;
}

export interface ABTestStats {
    variant: string;
    pattern_id: string;
    total_predictions: number;
    successful_predictions: number;
    success_rate: number;
}

export interface SignificanceResult {
    is_significant: boolean;
    confidence_level: number;
    winner_variant: string | null;
    stats: ABTestStats[];
}

/**
 * Create a new A/B test
 */
export async function createABTest(params: CreateABTestParams): Promise<ABTest> {
    const { data, error } = await supabase
        .from('ml_ab_tests')
        .insert({
            name: params.name,
            description: params.description,
            pattern_a_id: params.pattern_a_id,
            pattern_b_id: params.pattern_b_id,
            pattern_c_id: params.pattern_c_id,
            pattern_d_id: params.pattern_d_id,
            traffic_split: params.traffic_split || { a: 50, b: 50 },
            status: 'running',
        })
        .select()
        .single();

    if (error) throw error;
    return data as ABTest;
}

/**
 * Get active A/B test for a pattern type
 */
export async function getActiveABTest(patternType: string): Promise<ABTest | null> {
    const { data: patterns } = await supabase
        .from('ml_learning_patterns')
        .select('id')
        .like('pattern_type', `${patternType}%`)
        .eq('is_active', true);

    if (!patterns || patterns.length === 0) return null;

    const patternIds = patterns.map((p: any) => p.id);

    const { data } = await supabase
        .from('ml_ab_tests')
        .select('*')
        .eq('status', 'running')
        .or(`pattern_a_id.in.(${patternIds.join(',')}),pattern_b_id.in.(${patternIds.join(',')})`)
        .single();

    return data as ABTest | null;
}

/**
 * Get all A/B tests
 */
export async function getAllABTests(): Promise<ABTest[]> {
    const { data, error } = await supabase
        .from('ml_ab_tests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ABTest[];
}

/**
 * Record A/B test result
 */
export async function recordABTestResult(
    testId: string,
    patternId: string,
    predictionId: string,
    variant: string,
    wasSuccessful: boolean
): Promise<void> {
    const { error } = await supabase
        .from('ml_ab_test_results')
        .insert({
            ab_test_id: testId,
            pattern_id: patternId,
            prediction_id: predictionId,
            variant,
            was_successful: wasSuccessful,
        });

    if (error) throw error;
}

/**
 * Get A/B test statistics
 */
export async function getABTestStats(testId: string): Promise<ABTestStats[]> {
    const { data, error } = await supabase
        .from('ml_ab_test_results')
        .select('variant, pattern_id, was_successful')
        .eq('ab_test_id', testId);

    if (error) throw error;

    const statsByVariant = new Map<string, ABTestStats>();

    for (const result of data || []) {
        if (!statsByVariant.has(result.variant)) {
            statsByVariant.set(result.variant, {
                variant: result.variant,
                pattern_id: result.pattern_id,
                total_predictions: 0,
                successful_predictions: 0,
                success_rate: 0,
            });
        }

        const stats = statsByVariant.get(result.variant)!;
        stats.total_predictions++;
        if (result.was_successful) {
            stats.successful_predictions++;
        }
    }

    const statsArray: ABTestStats[] = [];
    for (const stats of statsByVariant.values()) {
        stats.success_rate = stats.total_predictions > 0
            ? stats.successful_predictions / stats.total_predictions
            : 0;
        statsArray.push(stats);
    }

    return statsArray;
}

/**
 * Calculate statistical significance using Z-test
 */
export async function calculateSignificance(testId: string): Promise<SignificanceResult> {
    const stats = await getABTestStats(testId);

    if (stats.length < 2) {
        return {
            is_significant: false,
            confidence_level: 0,
            winner_variant: null,
            stats,
        };
    }

    const [variantA, variantB] = stats;

    const p1 = variantA.success_rate;
    const n1 = variantA.total_predictions;
    const p2 = variantB.success_rate;
    const n2 = variantB.total_predictions;

    if (n1 < 30 || n2 < 30) {
        return {
            is_significant: false,
            confidence_level: 0,
            winner_variant: null,
            stats,
        };
    }

    const p = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
    const z = Math.abs(p1 - p2) / se;

    const confidence = z > 2.58 ? 0.99 : z > 1.96 ? 0.95 : z > 1.64 ? 0.90 : 0;

    const is_significant = confidence >= 0.95;
    const winner_variant = is_significant
        ? (p1 > p2 ? variantA.variant : variantB.variant)
        : null;

    return {
        is_significant,
        confidence_level: confidence,
        winner_variant,
        stats,
    };
}

/**
 * Select winner and end test
 */
export async function selectWinner(testId: string): Promise<void> {
    const significance = await calculateSignificance(testId);

    if (!significance.is_significant || !significance.winner_variant) {
        throw new Error('No statistically significant winner found');
    }

    const winnerStats = significance.stats.find(s => s.variant === significance.winner_variant);
    if (!winnerStats) throw new Error('Winner stats not found');

    const { error } = await supabase
        .from('ml_ab_tests')
        .update({
            status: 'completed',
            winner_pattern_id: winnerStats.pattern_id,
            confidence_level: significance.confidence_level,
            ended_at: new Date().toISOString(),
        })
        .eq('id', testId);

    if (error) throw error;

    const losingPatterns = significance.stats
        .filter(s => s.variant !== significance.winner_variant)
        .map(s => s.pattern_id);

    if (losingPatterns.length > 0) {
        await supabase
            .from('ml_learning_patterns')
            .update({ is_active: false })
            .in('id', losingPatterns);
    }
}

/**
 * Pause A/B test
 */
export async function pauseABTest(testId: string): Promise<void> {
    const { error } = await supabase
        .from('ml_ab_tests')
        .update({ status: 'paused' })
        .eq('id', testId);

    if (error) throw error;
}

/**
 * Resume A/B test
 */
export async function resumeABTest(testId: string): Promise<void> {
    const { error } = await supabase
        .from('ml_ab_tests')
        .update({ status: 'running' })
        .eq('id', testId);

    if (error) throw error;
}
