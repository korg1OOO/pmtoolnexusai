/**
 * ML Monitoring Service
 * Handles accuracy tracking, alerts, and model performance monitoring
 */

import { supabase } from "@/integrations/supabase/client";

export interface MLAlert {
    id: string;
    model_type: string;
    alert_type: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    metadata?: any;
    is_acknowledged: boolean;
    created_at: string;
}

export interface AccuracyLog {
    id: string;
    model_type: string;
    predicted_value: any;
    actual_value: any;
    accuracy_score: number;
    deviation_percent: number;
    logged_at: string;
}

export interface AccuracyTrend {
    date: string;
    accuracy: number;
    sample_count: number;
}

/**
 * Log prediction accuracy (actual vs predicted)
 */
export async function logPredictionAccuracy(
    predictionId: string,
    modelId: string,
    modelType: 'risk' | 'cost' | 'schedule',
    predictedValue: any,
    actualValue: any
): Promise<{ data: any; error: string | null }> {
    try {
        // Calculate accuracy score based on model type
        let accuracyScore = 0;
        let deviationPercent = 0;

        if (modelType === 'cost') {
            const predicted = predictedValue.total_forecast || 0;
            const actual = actualValue.total_actual || 0;
            deviationPercent = actual > 0 ? Math.abs((predicted - actual) / actual) * 100 : 0;
            accuracyScore = Math.max(0, 1 - (deviationPercent / 100));
        } else if (modelType === 'risk') {
            const predicted = predictedValue.overall_score || 0;
            const actual = actualValue.actual_score || 0;
            deviationPercent = Math.abs(predicted - actual);
            accuracyScore = 1 - (deviationPercent / 200); // Risk is 0-200 scale
        } else if (modelType === 'schedule') {
            const predicted = predictedValue.predicted_duration_days || 0;
            const actual = actualValue.actual_duration_days || 0;
            deviationPercent = actual > 0 ? Math.abs((predicted - actual) / actual) * 100 : 0;
            accuracyScore = Math.max(0, 1 - (deviationPercent / 100));
        }

        const isWithinThreshold = deviationPercent < 15; // 15% threshold

        const { data, error } = await supabase
            .from('ml_accuracy_logs' as any)
            .insert({
                prediction_id: predictionId,
                model_id: modelId,
                model_type: modelType,
                predicted_value: predictedValue,
                actual_value: actualValue,
                accuracy_score: accuracyScore,
                deviation_percent: deviationPercent,
                is_within_threshold: isWithinThreshold
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };

    } catch (err: any) {
        console.error('Error logging accuracy:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Get accuracy trend for a model type
 */
export async function getAccuracyTrend(
    modelType: 'risk' | 'cost' | 'schedule',
    days: number = 30
): Promise<{ data: AccuracyTrend[] | null; error: string | null }> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const { data: logs, error } = await supabase
            .from('ml_accuracy_logs' as any)
            .select('logged_at, accuracy_score')
            .eq('model_type', modelType)
            .gte('logged_at', cutoffDate.toISOString())
            .order('logged_at', { ascending: true });

        if (error) throw error;

        if (!logs || logs.length === 0) {
            return { data: [], error: null };
        }

        // Group by day and calculate average accuracy
        const trendMap = new Map<string, { total: number; count: number }>();

        logs.forEach((log: any) => {
            const date = new Date(log.logged_at).toISOString().split('T')[0];
            const existing = trendMap.get(date) || { total: 0, count: 0 };
            existing.total += log.accuracy_score;
            existing.count += 1;
            trendMap.set(date, existing);
        });

        const trend: AccuracyTrend[] = Array.from(trendMap.entries()).map(([date, stats]) => ({
            date,
            accuracy: stats.total / stats.count,
            sample_count: stats.count
        }));

        return { data: trend, error: null };

    } catch (err: any) {
        console.error('Error fetching accuracy trend:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Get all alerts
 */
export async function getAlerts(
    modelType?: 'risk' | 'cost' | 'schedule',
    includeAcknowledged: boolean = false
): Promise<{ data: MLAlert[] | null; error: string | null }> {
    try {
        let query = supabase
            .from('ml_alerts' as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (modelType) {
            query = query.eq('model_type', modelType);
        }

        if (!includeAcknowledged) {
            query = query.eq('is_acknowledged', false);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data: data as MLAlert[], error: null };

    } catch (err: any) {
        console.error('Error fetching alerts:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string, userId?: string): Promise<{ error: string | null }> {
    try {
        const { error } = await supabase
            .from('ml_alerts' as any)
            .update({
                is_acknowledged: true,
                acknowledged_by: userId,
                acknowledged_at: new Date().toISOString()
            })
            .eq('id', alertId);

        if (error) throw error;

        return { error: null };

    } catch (err: any) {
        console.error('Error acknowledging alert:', err);
        return { error: err.message };
    }
}

/**
 * Create manual alert
 */
export async function createAlert(
    modelType: 'risk' | 'cost' | 'schedule',
    alertType: string,
    severity: 'critical' | 'warning' | 'info',
    title: string,
    message: string,
    metadata?: any
): Promise<{ data: any; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('ml_alerts' as any)
            .insert({
                model_type: modelType,
                alert_type: alertType,
                severity: severity,
                title: title,
                message: message,
                metadata: metadata
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };

    } catch (err: any) {
        console.error('Error creating alert:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Get alert statistics
 */
export async function getAlertStats(modelType?: 'risk' | 'cost' | 'schedule'): Promise<{
    data: {
        total: number;
        critical: number;
        warning: number;
        info: number;
        unacknowledged: number;
    } | null;
    error: string | null;
}> {
    try {
        let query = supabase
            .from('ml_alerts' as any)
            .select('severity, is_acknowledged');

        if (modelType) {
            query = query.eq('model_type', modelType);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!data) {
            return {
                data: { total: 0, critical: 0, warning: 0, info: 0, unacknowledged: 0 },
                error: null
            };
        }

        const stats = {
            total: data.length,
            critical: data.filter((a: any) => a.severity === 'critical').length,
            warning: data.filter((a: any) => a.severity === 'warning').length,
            info: data.filter((a: any) => a.severity === 'info').length,
            unacknowledged: data.filter((a: any) => !a.is_acknowledged).length
        };

        return { data: stats, error: null };

    } catch (err: any) {
        console.error('Error fetching alert stats:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Check for alert conditions and create alerts if needed
 */
export async function checkAlertConditions(modelType: 'risk' | 'cost' | 'schedule'): Promise<{
    alerts_created: number;
    error: string | null;
}> {
    try {
        let alertsCreated = 0;

        // Check accuracy trend
        const { data: trend } = await getAccuracyTrend(modelType, 7);

        if (trend && trend.length > 0) {
            const recentAccuracy = trend[trend.length - 1].accuracy;

            // Critical: accuracy below 70%
            if (recentAccuracy < 0.70) {
                await createAlert(
                    modelType,
                    'accuracy_drop',
                    'critical',
                    'Critical Accuracy Drop',
                    `${modelType} model accuracy dropped to ${(recentAccuracy * 100).toFixed(1)}%`,
                    { accuracy: recentAccuracy, threshold: 0.70 }
                );
                alertsCreated++;
            }
            // Warning: accuracy below 80%
            else if (recentAccuracy < 0.80) {
                await createAlert(
                    modelType,
                    'accuracy_drop',
                    'warning',
                    'Model Accuracy Warning',
                    `${modelType} model accuracy at ${(recentAccuracy * 100).toFixed(1)}%`,
                    { accuracy: recentAccuracy, threshold: 0.80 }
                );
                alertsCreated++;
            }
        }

        // Check if model needs retraining (hasn't been retrained in 90+ days)
        const { data: currentModel } = await supabase
            .from('ml_model_metadata' as any)
            .select('training_date')
            .eq('model_type', modelType)
            .eq('is_active', true)
            .single();

        if (currentModel) {
            const daysSinceTraining = (new Date().getTime() - new Date(currentModel.training_date).getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceTraining > 90) {
                await createAlert(
                    modelType,
                    'retrain_needed',
                    'warning',
                    'Retraining Recommended',
                    `${modelType} model hasn't been retrained in ${Math.floor(daysSinceTraining)} days`,
                    { days_since_training: Math.floor(daysSinceTraining) }
                );
                alertsCreated++;
            }
        }

        return { alerts_created: alertsCreated, error: null };

    } catch (err: any) {
        console.error('Error checking alert conditions:', err);
        return { alerts_created: 0, error: err.message };
    }
}
