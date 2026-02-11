/**
 * ML Snapshot Service
 * Handles creation and management of project data snapshots for model training
 */

import { supabase } from "@/integrations/supabase/client";

export interface ProjectSnapshot {
    project_id: string;
    snapshot_data: {
        // Project metadata
        name: string;
        status: string;
        progress: number;
        start_date: string;
        end_date: string;
        budget: number;

        // Tasks data
        total_tasks: number;
        completed_tasks: number;
        overdue_tasks: number;
        avg_task_duration_days: number;

        // Cost data
        total_costs: number;
        cost_by_category: Record<string, number>;
        budget_variance: number;
        budget_variance_percent: number;

        // Risk data
        open_risks: number;
        high_severity_risks: number;
        avg_risk_score: number;

        // Team data
        team_size: number;
        resource_utilization: number;

        // Timeline data
        planned_duration_days: number;
        elapsed_days: number;
        schedule_variance_days: number;
    };
    data_quality_score: number;
}

/**
 * Calculate data quality score based on completeness and consistency
 */
export function calculateDataQualityScore(data: any): number {
    let score = 0;
    let checks = 0;

    // Check for required fields (0.4 weight)
    const requiredFields = ['total_tasks', 'budget', 'progress', 'start_date'];
    requiredFields.forEach(field => {
        checks++;
        if (data[field] !== undefined && data[field] !== null) {
            score += 0.1;
        }
    });

    // Check data consistency (0.3 weight)
    checks++;
    if (data.total_tasks > 0 && data.completed_tasks <= data.total_tasks) {
        score += 0.15;
    }

    checks++;
    if (data.budget > 0 && data.total_costs >= 0) {
        score += 0.15;
    }

    // Check data richness (0.3 weight)
    checks++;
    if (data.open_risks !== undefined) score += 0.1;

    checks++;
    if (data.team_size !== undefined && data.team_size > 0) score += 0.1;

    checks++;
    if (data.cost_by_category && Object.keys(data.cost_by_category).length > 0) score += 0.1;

    return Math.min(1, score);
}

/**
 * Create a snapshot of project data
 */
export async function createProjectSnapshot(projectId: string): Promise<{ data: any; error: string | null }> {
    try {
        // Fetch project data
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (projectError) throw projectError;

        // Fetch tasks
        const { data: tasks, error: tasksError } = await supabase
            .from('actions')
            .select('*')
            .eq('project_id', projectId);

        if (tasksError) throw tasksError;

        // Fetch risks
        const { data: risks, error: risksError } = await supabase
            .from('risks')
            .select('*')
            .eq('project_id', projectId);

        if (risksError) throw risksError;

        // Aggregate snapshot data
        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter(t => t.status === 'Done').length || 0;
        const overdueTasks = tasks?.filter(t => {
            if (!t.due_date || t.status === 'Done') return false;
            return new Date(t.due_date) < new Date();
        }).length || 0;

        const avgTaskDuration = tasks && tasks.length > 0
            ? tasks.reduce((acc, t) => {
                if (!t.created_at || !t.completed_at) return acc;
                const duration = (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24);
                return acc + duration;
            }, 0) / tasks.length
            : 0;

        const openRisks = risks?.filter(r => r.status !== 'closed').length || 0;
        const highSeverityRisks = risks?.filter(r => r.severity === 'high' || r.severity === 'critical').length || 0;
        const avgRiskScore = risks && risks.length > 0
            ? risks.reduce((acc, r) => acc + (r.impact_score || 0), 0) / risks.length
            : 0;

        // Calculate budget metrics
        const budget = project.budget || 0;
        const totalCosts = project.total_spent || 0;
        const budgetVariance = budget - totalCosts;
        const budgetVariancePercent = budget > 0 ? ((budgetVariance / budget) * 100) : 0;

        // Calculate timeline metrics
        const startDate = new Date(project.start_date);
        const endDate = project.end_date ? new Date(project.end_date) : new Date();
        const plannedDurationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const elapsedDays = (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const expectedProgress = plannedDurationDays > 0 ? (elapsedDays / plannedDurationDays) * 100 : 0;
        const scheduleVarianceDays = ((project.progress || 0) - expectedProgress) / 100 * plannedDurationDays;

        const snapshotData = {
            name: project.name,
            status: project.status,
            progress: project.progress || 0,
            start_date: project.start_date,
            end_date: project.end_date,
            budget: budget,

            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            overdue_tasks: overdueTasks,
            avg_task_duration_days: avgTaskDuration,

            total_costs: totalCosts,
            cost_by_category: {
                labor: project.labor_costs || 0,
                materials: project.material_costs || 0,
                equipment: project.equipment_costs || 0,
                other: totalCosts - (project.labor_costs || 0) - (project.material_costs || 0) - (project.equipment_costs || 0)
            },
            budget_variance: budgetVariance,
            budget_variance_percent: budgetVariancePercent,

            open_risks: openRisks,
            high_severity_risks: highSeverityRisks,
            avg_risk_score: avgRiskScore,

            team_size: project.team_members?.length || 0,
            resource_utilization: project.resource_utilization || 75,

            planned_duration_days: plannedDurationDays,
            elapsed_days: elapsedDays,
            schedule_variance_days: scheduleVarianceDays
        };

        const dataQualityScore = calculateDataQualityScore(snapshotData);

        // Store snapshot
        const { data: snapshot, error: snapshotError } = await supabase
            .from('ml_training_data' as any)
            .insert({
                project_id: projectId,
                snapshot_date: new Date().toISOString(),
                snapshot_data: snapshotData,
                data_quality_score: dataQualityScore
            })
            .select()
            .single();

        if (snapshotError) throw snapshotError;

        return { data: snapshot, error: null };

    } catch (err: any) {
        console.error('Error creating snapshot:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Get all snapshots for a specific model type within a date range
 */
export async function getTrainingDataRange(
    startDate: Date,
    endDate: Date
): Promise<{ data: any[] | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('ml_training_data' as any)
            .select('*')
            .gte('snapshot_date', startDate.toISOString())
            .lte('snapshot_date', endDate.toISOString())
            .order('snapshot_date', { ascending: false });

        if (error) throw error;

        return { data, error: null };
    } catch (err: any) {
        console.error('Error fetching training data:', err);
        return { data: null, error: err.message };
    }
}

/**
 * Purge old snapshots beyond retention period
 */
export async function purgeOldSnapshots(retentionDays: number = 365): Promise<{ error: string | null }> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const { error } = await supabase
            .from('ml_training_data' as any)
            .delete()
            .lt('snapshot_date', cutoffDate.toISOString());

        if (error) throw error;

        return { error: null };
    } catch (err: any) {
        console.error('Error purging snapshots:', err);
        return { error: err.message };
    }
}

/**
 * Get snapshot count and date range
 */
export async function getSnapshotStats(): Promise<{
    data: { count: number; oldest: string; newest: string; avgQuality: number } | null;
    error: string | null;
}> {
    try {
        const { data, error } = await supabase
            .from('ml_training_data' as any)
            .select('snapshot_date, data_quality_score');

        if (error) throw error;

        if (!data || data.length === 0) {
            return {
                data: { count: 0, oldest: '', newest: '', avgQuality: 0 },
                error: null
            };
        }

        const dates = data.map((d: any) => d.snapshot_date).sort();
        const avgQuality = data.reduce((acc: number, d: any) => acc + (d.data_quality_score || 0), 0) / data.length;

        return {
            data: {
                count: data.length,
                oldest: dates[0],
                newest: dates[dates.length - 1],
                avgQuality: avgQuality
            },
            error: null
        };
    } catch (err: any) {
        console.error('Error fetching snapshot stats:', err);
        return { data: null, error: err.message };
    }
}
