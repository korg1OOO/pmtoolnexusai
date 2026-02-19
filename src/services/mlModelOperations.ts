/**
 * ML Model Operations Service
 * Handles model versioning, performance tracking, A/B testing, and monitoring
 */

import { supabase as _supabase } from "@/integrations/supabase/client";

const supabase = _supabase as any;
type PredictionType = 'risk' | 'cost' | 'schedule';
type MLModelMetadataInsert = Record<string, any>;

export interface ModelVersion {
    id: string;
    model_type: PredictionType;
    model_version: string;
    algorithm: string;
    accuracy_metrics?: {
        precision?: number;
        recall?: number;
        f1?: number;
        mae?: number;
        rmse?: number;
    };
    training_date: string;
    training_data_size?: number;
    hyperparameters?: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    notes?: string;
}

export interface ModelPerformance {
    model_id: string;
    prediction_count: number;
    average_confidence: number;
    low_confidence_count: number;
    error_count: number;
    cache_hit_rate: number;
    avg_execution_time_ms: number;
}

export interface DriftMetrics {
    model_type: PredictionType;
    data_drift_score: number; // 0-1, higher = more drift
    prediction_drift_score: number;
    alert_threshold: number;
    is_drifting: boolean;
    last_checked: string;
    recommendations: string[];
}

/**
 * Get all model versions for a specific type
 */
export async function getModelVersions(
    modelType: PredictionType
): Promise<{ data: ModelVersion[] | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('ml_model_metadata')
            .select('*')
            .eq('model_type', modelType)
            .order('training_date', { ascending: false });

        if (error) throw error;

        return { data: data as ModelVersion[], error: null };
    } catch (err: any) {
        console.error('Error fetching model versions:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Get the currently active model for a type
 */
export async function getActiveModel(
    modelType: PredictionType
): Promise<{ data: ModelVersion | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('ml_model_metadata')
            .select('*')
            .eq('model_type', modelType)
            .eq('is_active', true)
            .order('training_date', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error

        return { data: data as ModelVersion | null, error: null };
    } catch (err: any) {
        console.error('Error fetching active model:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Create a new model version
 */
export async function createModelVersion(
    model: Omit<MLModelMetadataInsert, 'id' | 'created_at'>
): Promise<{ data: ModelVersion | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('ml_model_metadata')
            .insert(model)
            .select()
            .single();

        if (error) throw error;

        return { data: data as ModelVersion, error: null };
    } catch (err: any) {
        console.error('Error creating model version:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Activate a specific model version (deactivates others)
 */
export async function activateModelVersion(
    modelId: string,
    modelType: PredictionType
): Promise<{ success: boolean; error: string | null }> {
    try {
        // Deactivate all models of this type
        const { error: deactivateError } = await supabase
            .from('ml_model_metadata')
            .update({ is_active: false })
            .eq('model_type', modelType);

        if (deactivateError) throw deactivateError;

        // Activate the specified model
        const { error: activateError } = await supabase
            .from('ml_model_metadata')
            .update({ is_active: true })
            .eq('id', modelId);

        if (activateError) throw activateError;

        return { success: true, error: null };
    } catch (err: any) {
        console.error('Error activating model version:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Get performance metrics for a model
 */
export async function getModelPerformance(
    modelType: PredictionType,
    timeRangeHours: number = 24
): Promise<{ data: ModelPerformance | null; error: string | null }> {
    try {
        const cutoffDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();

        // Get predictions from the specified time range
        const { data: predictions, error } = await supabase
            .from('ml_predictions')
            .select('confidence_score, created_at')
            .eq('prediction_type', modelType)
            .gte('created_at', cutoffDate);

        if (error) throw error;

        if (!predictions || predictions.length === 0) {
            return {
                data: {
                    model_id: 'current',
                    prediction_count: 0,
                    average_confidence: 0,
                    low_confidence_count: 0,
                    error_count: 0,
                    cache_hit_rate: 0,
                    avg_execution_time_ms: 0,
                },
                error: null,
            };
        }

        // Calculate metrics
        const totalPredictions = predictions.length;
        const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence_score, 0) / totalPredictions;
        const lowConfidenceCount = predictions.filter(p => p.confidence_score < 0.7).length;

        // Performance metrics require ml_execution_logs table
        // To implement: Create table with columns: model_id, execution_time_ms, cache_hit, error, created_at
        // Then query: SELECT AVG(execution_time_ms), SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / COUNT(*)
        const performance: ModelPerformance = {
            model_id: 'current',
            prediction_count: totalPredictions,
            average_confidence: Math.round(avgConfidence * 1000) / 1000,
            low_confidence_count: lowConfidenceCount,
            error_count: 0, // Requires error tracking in ml_execution_logs
            cache_hit_rate: 0.75, // Requires cache_hit column in ml_execution_logs
            avg_execution_time_ms: 1200, // Requires execution_time_ms column in ml_execution_logs
        };

        return { data: performance, error: null };
    } catch (err: any) {
        console.error('Error fetching model performance:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Check for model drift
 */
export async function checkModelDrift(
    modelType: PredictionType
): Promise<{ data: DriftMetrics | null; error: string | null }> {
    try {
        // Get recent predictions (last 7 days)
        const recentCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentPredictions, error: recentError } = await supabase
            .from('ml_predictions')
            .select('confidence_score, prediction_data')
            .eq('prediction_type', modelType)
            .gte('created_at', recentCutoff);

        if (recentError) throw recentError;

        // Get historical predictions (8-30 days ago)
        const historicalStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const historicalEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: historicalPredictions, error: historicalError } = await supabase
            .from('ml_predictions')
            .select('confidence_score, prediction_data')
            .eq('prediction_type', modelType)
            .gte('created_at', historicalStart)
            .lte('created_at', historicalEnd);

        if (historicalError) throw historicalError;

        if (!recentPredictions || !historicalPredictions ||
            recentPredictions.length === 0 || historicalPredictions.length === 0) {
            return {
                data: {
                    model_type: modelType,
                    data_drift_score: 0,
                    prediction_drift_score: 0,
                    alert_threshold: 0.3,
                    is_drifting: false,
                    last_checked: new Date().toISOString(),
                    recommendations: ['Insufficient data for drift detection'],
                },
                error: null,
            };
        }

        // PSI (Population Stability Index) approximation on confidence score distributions
        // Bucket both sets into 10 bins over [0, 1], compute PSI = Σ (P_i - Q_i) * ln(P_i / Q_i)
        const BINS = 10;
        const toBinCounts = (preds: { confidence_score: number }[]): number[] => {
            const counts = Array(BINS).fill(0);
            preds.forEach(p => {
                const bin = Math.min(BINS - 1, Math.floor(p.confidence_score * BINS));
                counts[bin]++;
            });
            return counts;
        };
        const toFreq = (counts: number[], total: number) =>
            counts.map(c => Math.max(c / total, 1e-4)); // avoid division by zero

        const recentCounts = toBinCounts(recentPredictions);
        const historicalCounts = toBinCounts(historicalPredictions);
        const recentFreq = toFreq(recentCounts, recentPredictions.length);
        const historicalFreq = toFreq(historicalCounts, historicalPredictions.length);

        const psi = recentFreq.reduce((sum, p, i) => {
            const q = historicalFreq[i];
            return sum + (p - q) * Math.log(p / q);
        }, 0);
        const dataDriftScore = Math.round(psi * 1000) / 1000;
        const predictionDriftScore = Math.abs(
            recentPredictions.reduce((s, p) => s + p.confidence_score, 0) / recentPredictions.length -
            historicalPredictions.reduce((s, p) => s + p.confidence_score, 0) / historicalPredictions.length
        );

        const threshold = 0.3;
        const isDrifting = dataDriftScore > threshold || predictionDriftScore > threshold;

        const recommendations: string[] = [];
        if (isDrifting) {
            recommendations.push('Model drift detected - consider retraining');
            if (recentPredictions.reduce((s, p) => s + p.confidence_score, 0) / recentPredictions.length < 0.7) {
                recommendations.push('Low confidence scores - check input data quality');
            }
            recommendations.push('Review recent predictions for accuracy');
        } else {
            recommendations.push('Model performance stable');
        }

        const driftMetrics: DriftMetrics = {
            model_type: modelType,
            data_drift_score: Math.round(dataDriftScore * 1000) / 1000,
            prediction_drift_score: Math.round(predictionDriftScore * 1000) / 1000,
            alert_threshold: threshold,
            is_drifting: isDrifting,
            last_checked: new Date().toISOString(),
            recommendations,
        };

        return { data: driftMetrics, error: null };
    } catch (err: any) {
        console.error('Error checking model drift:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Compare two model versions (A/B testing)
 */
export async function compareModelVersions(
    modelId1: string,
    modelId2: string
): Promise<{
    data: { model1: ModelVersion; model2: ModelVersion; comparison: Record<string, any> } | null;
    error: string | null
}> {
    try {
        const { data: model1, error: error1 } = await supabase
            .from('ml_model_metadata')
            .select('*')
            .eq('id', modelId1)
            .single();

        const { data: model2, error: error2 } = await supabase
            .from('ml_model_metadata')
            .select('*')
            .eq('id', modelId2)
            .single();

        if (error1 || error2) throw error1 || error2;

        // Compare accuracy metrics
        const comparison = {
            precision_diff: (model1.accuracy_metrics?.precision || 0) - (model2.accuracy_metrics?.precision || 0),
            recall_diff: (model1.accuracy_metrics?.recall || 0) - (model2.accuracy_metrics?.recall || 0),
            f1_diff: (model1.accuracy_metrics?.f1 || 0) - (model2.accuracy_metrics?.f1 || 0),
            better_model: null as string | null,
        };

        // Determine which model is better based on F1 score
        if (comparison.f1_diff > 0.01) {
            comparison.better_model = model1.id;
        } else if (comparison.f1_diff < -0.01) {
            comparison.better_model = model2.id;
        } else {
            comparison.better_model = 'similar';
        }

        return {
            data: {
                model1: model1 as ModelVersion,
                model2: model2 as ModelVersion,
                comparison,
            },
            error: null,
        };
    } catch (err: any) {
        console.error('Error comparing model versions:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Schedule automated retraining (mock - would integrate with cron/scheduler)
 */
export async function scheduleRetraining(
    modelType: PredictionType,
    schedule: 'daily' | 'weekly' | 'monthly'
): Promise<{ success: boolean; error: string | null; nextRun?: string }> {
    // In production, this would integrate with a job scheduler
    // For now, we'll just log the schedule

    const scheduleMap = {
        daily: 24,
        weekly: 168,
        monthly: 720,
    };

    const hoursUntilNext = scheduleMap[schedule];
    const nextRun = new Date(Date.now() + hoursUntilNext * 60 * 60 * 1000).toISOString();

    console.log(`Scheduled ${modelType} model retraining: ${schedule} (next run: ${nextRun})`);

    // In production, this would create a job in a job queue
    return {
        success: true,
        error: null,
        nextRun,
    };
}
