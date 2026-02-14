/**
 * ML Retraining Service
 * Manages model retraining operations and job tracking
 */

import { supabase as _supabase } from "@/integrations/supabase/client";
const supabase = _supabase as any;

export interface RetrainingJob {
    id: string;
    model_type: 'risk' | 'cost' | 'schedule';
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at?: string;
    completed_at?: string;
    training_samples_count?: number;
    new_model_id?: string;
    accuracy_before?: number;
    accuracy_after?: number;
    improvement_percent?: number;
    error_message?: string;
    created_at: string;
}

export interface RetrainingResult {
    job_id: string;
    model_id: string;
    model_version: string;
    accuracy: number;
    training_samples: number;
    improvement_over_current: number;
    message: string;
}

/**
 * Trigger model retraining
 */
export async function triggerRetraining(
    modelType: 'risk' | 'cost' | 'schedule',
    trainingPeriodDays: number = 90
): Promise<{ data: RetrainingResult | null; error: string | null }> {
    try {
        const response = await supabase.functions.invoke('ml-retrain-model', {
            body: {
                model_type: modelType,
                training_period_days: trainingPeriodDays,
                validation_split: 0.2
            }
        });

        if (response.error) throw response.error;

        return { data: response.data as RetrainingResult, error: null };

    } catch (err: any) {
        console.error('Error triggering retraining:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Get all retraining jobs
 */
export async function getRetrainingJobs(
    modelType?: 'risk' | 'cost' | 'schedule',
    limit: number = 10
): Promise<{ data: RetrainingJob[] | null; error: string | null }> {
    try {
        let query = supabase
            .from('ml_retraining_jobs' as any)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (modelType) {
            query = query.eq('model_type', modelType);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data: data as RetrainingJob[], error: null };

    } catch (err: any) {
        console.error('Error fetching retraining jobs:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Get retraining job by ID
 */
export async function getRetrainingJob(jobId: string): Promise<{ data: RetrainingJob | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('ml_retraining_jobs' as any)
            .select('*')
            .eq('id', jobId)
            .single();

        if (error) throw error;

        return { data: data as RetrainingJob, error: null };

    } catch (err: any) {
        console.error('Error fetching retraining job:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Get retraining statistics
 */
export async function getRetrainingStats(modelType: 'risk' | 'cost' | 'schedule'): Promise<{
    data: {
        total_jobs: number;
        successful_jobs: number;
        failed_jobs: number;
        avg_improvement: number;
        last_retraining: string | null;
    } | null;
    error: string | null;
}> {
    try {
        const { data: jobs, error } = await supabase
            .from('ml_retraining_jobs' as any)
            .select('*')
            .eq('model_type', modelType);

        if (error) throw error;

        if (!jobs || jobs.length === 0) {
            return {
                data: {
                    total_jobs: 0,
                    successful_jobs: 0,
                    failed_jobs: 0,
                    avg_improvement: 0,
                    last_retraining: null
                },
                error: null
            };
        }

        const successful = jobs.filter((j: any) => j.status === 'completed');
        const failed = jobs.filter((j: any) => j.status === 'failed');
        const avgImprovement = successful.length > 0
            ? successful.reduce((acc: number, j: any) => acc + (j.improvement_percent || 0), 0) / successful.length
            : 0;

        const sortedJobs = jobs.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
            data: {
                total_jobs: jobs.length,
                successful_jobs: successful.length,
                failed_jobs: failed.length,
                avg_improvement: avgImprovement,
                last_retraining: sortedJobs[0].created_at
            },
            error: null
        };

    } catch (err: any) {
        console.error('Error fetching retraining stats:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Get retraining schedule
 * NOTE: Requires integration with cron service (e.g., pg_cron, external scheduler)
 * To implement:
 * 1. Create ml_retraining_schedules table with: model_type, frequency, next_run, enabled
 * 2. Set up cron jobs to trigger retraining
 * 3. Query schedule from database instead of returning mock data
 */
export function getRetrainingSchedule(modelType: 'risk' | 'cost' | 'schedule'): {
    frequency: string;
    next_run: string;
    enabled: boolean;
} {
    // Placeholder until cron integration is implemented
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 3, 0, 0);

    return {
        frequency: 'monthly',
        next_run: nextMonth.toISOString(),
        enabled: true
    };
}
